const aj = require("./arcjet.js")
const { isSpoofedBot } = require("@arcjet/inspect");

// List of legitimate email domains that should be allowed
const LEGITIMATE_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'protonmail.com',
  'aol.com',
  'live.com',
  'msn.com'
];

// List of legitimate user agents that might be flagged as bots
const LEGITIMATE_USER_AGENTS = [
  'okhttp', // Android/mobile apps using OkHttp
  'retrofit', // Android networking library
  'postman', // API testing
  'insomnia', // API testing
  'curl', // Command line testing
  'axios', // JavaScript HTTP client
  'fetch' // Browser fetch API
];

/**
 * Check if email domain is from a legitimate provider
 */
function isLegitimateEmailDomain(email) {
  if (!email || typeof email !== 'string') return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  return LEGITIMATE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Check if user agent appears to be from legitimate development/mobile tools
 */
function isLegitimateUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') return false;
  
  const ua = userAgent.toLowerCase();
  return LEGITIMATE_USER_AGENTS.some(agent => ua.includes(agent));
}

/**
 * Arcjet middleware with enhanced legitimate user handling
 */
exports.arcjetMiddleware = async (req, res, next) => {
  try {
    const email = req.body.prefLogin || req.body.email;
    const userAgent = req.get('User-Agent') || '';
    
    // Skip email validation for legitimate domains but still check for bots and rate limiting
    const skipEmailValidation = isLegitimateEmailDomain(email);
    const isLegitimateUA = isLegitimateUserAgent(userAgent);
    
    console.log("Request details:", {
      email: email,
      userAgent: userAgent,
      isLegitimateEmail: skipEmailValidation,
      isLegitimateUserAgent: isLegitimateUA
    });
    
    const decision = await aj.protect(req, { 
      email: skipEmailValidation ? undefined : email 
    });
    
    console.log("Arcjet decision:", decision);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res
          .status(429)
          .json({ 
            success: false,
            error: "Rate limit exceeded. Please try again later." 
          });
      } else if (decision.reason.isBot()) {
        // Check if this might be a false positive for legitimate users/tools
        if (skipEmailValidation || isLegitimateUA) {
          console.log("Bot detection triggered for legitimate user/tool, allowing with warning");
          console.warn(`Potential false positive bot detection:`, {
            email: email,
            userAgent: userAgent,
            reason: 'Legitimate email domain or development tool detected'
          });
          // Allow the request to proceed
        } else {
          return res.status(403).json({ 
            success: false,
            error: "Bot access denied.",
            hint: "If you're using a mobile app or development tool, this might be a false positive."
          });
        }
      } else if (decision.reason.isEmail() && !skipEmailValidation) {
        // Only block email validation for non-legitimate domains
        const types = decision.reason.emailTypes || [];

        const emailTypeMessages = {
          DISPOSABLE: "Disposable email addresses are not allowed.",
          INVALID: "This email address is invalid.",
          NO_MX_RECORDS: "Email domain cannot receive emails.",
        };

        const errorString = types
          .map((type) => emailTypeMessages[type] || type)
          .join(" ");

        return res.status(403).json({ 
          success: false,
          error: `Invalid Email: ${errorString}` 
        });
      } else {
        // For other security reasons, be more lenient with legitimate email domains and user agents
        if (skipEmailValidation || isLegitimateUA) {
          console.warn(`Security policy triggered for legitimate user/tool:`, {
            email: email,
            userAgent: userAgent,
            decision: decision.reason
          });
          // Allow with warning
        } else {
          return res.status(403).json({
            success: false,
            error: "Access denied by security policy.",
          });
        }
      }
    }

    // Check for definitely malicious spoofed bots (but be lenient with legitimate tools)
    if (decision.results.some(isSpoofedBot)) {
      if (skipEmailValidation || isLegitimateUA) {
        console.warn("Spoofed bot detection triggered for legitimate user/tool, allowing:", {
          email: email,
          userAgent: userAgent
        });
      } else {
        return res.status(403).json({
          success: false,
          error: "Spoofed bot detected",
          message: "Malicious bot activity detected.",
        });
      }
    }

    next();
  } catch (error) {
    console.log("Arcjet Protection Error:", error);
    // In case of Arcjet errors, allow the request to proceed to avoid blocking legitimate users
    console.warn("Arcjet middleware error, allowing request to proceed:", error.message);
    next();
  }
};
