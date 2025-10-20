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

/**
 * Check if email domain is from a legitimate provider
 */
function isLegitimateEmailDomain(email) {
  if (!email || typeof email !== 'string') return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  return LEGITIMATE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Arcjet middleware with enhanced legitimate user handling
 */
exports.arcjetMiddleware = async (req, res, next) => {
  try {
    const email = req.body.prefLogin || req.body.email;
    
    // Skip email validation for legitimate domains but still check for bots and rate limiting
    const skipEmailValidation = isLegitimateEmailDomain(email);
    
    const decision = await aj.protect(req, { 
      email: skipEmailValidation ? undefined : email 
    });
    
    console.log("Arcjet decision:", decision);
    console.log("Email domain legitimate:", skipEmailValidation);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res
          .status(429)
          .json({ 
            success: false,
            error: "Rate limit exceeded. Please try again later." 
          });
      } else if (decision.reason.isBot()) {
        // Check if this might be a false positive for legitimate users
        if (skipEmailValidation) {
          console.log("Bot detection triggered for legitimate email domain, allowing with warning");
          // Log the incident but allow the request
          console.warn(`Potential false positive bot detection for email: ${email}`);
        } else {
          return res.status(403).json({ 
            success: false,
            error: "Bot access denied." 
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
        // For other security reasons, be more lenient with legitimate email domains
        if (skipEmailValidation) {
          console.warn(`Security policy triggered for legitimate email: ${email}, allowing with warning`);
        } else {
          return res.status(403).json({
            success: false,
            error: "Access denied by security policy.",
          });
        }
      }
    }

    // Check for definitely malicious spoofed bots (keep this strict)
    if (decision.results.some(isSpoofedBot)) {
      return res.status(403).json({
        success: false,
        error: "Spoofed bot detected",
        message: "Malicious bot activity detected.",
      });
    }

    next();
  } catch (error) {
    console.log("Arcjet Protection Error:", error);
    // In case of Arcjet errors, allow the request to proceed to avoid blocking legitimate users
    console.warn("Arcjet middleware error, allowing request to proceed:", error.message);
    next();
  }
};
