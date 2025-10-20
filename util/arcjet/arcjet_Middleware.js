const aj = require("./arcjet.js")
const { isSpoofedBot } = require("@arcjet/inspect");

/**
 * Arcjet middleware
 */
exports.arcjetMiddleware = async (req, res, next) => {
  try {
    const decision = await aj.protect(req, { email: req.body.prefLogin ? req.body.prefLogin : req.body.email });
    console.log("Arcjet decision:", decision);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res
          .status(429)
          .json({ error: "Rate limit exceeded. Please try again later." });
      } else if (decision.reason.isBot()) {
        return res.status(403).json({ error: "Bot access denied." });
      } else if (decision.reason.isEmail()) {
        // Extract the emailTypes directly from decision.reason
        const types = decision.reason.emailTypes || [];

        // Map to user-friendly messages
        const emailTypeMessages = {
          DISPOSABLE: "Disposable email addresses are not allowed.",
          INVALID: "This email address is invalid.",
          NO_MX_RECORDS: "Email domain cannot receive emails.",
        };

        const errorString = types
          .map((type) => emailTypeMessages[type] || type)
          .join(" "); // join multiple types if needed

        return res.status(403).json({ error: `Invalid Email: ${errorString}` });
      } else {
        return res.status(403).json({
          error: "Access denied by security policy.",
        });
      }
    }

    // check for spoofed bots
    if (decision.results.some(isSpoofedBot)) {
      return res.status(403).json({
        error: "Spoofed bot detected",
        message: "Malicious bot activity detected.",
      });
    }

    next();
  } catch (error) {
    console.log("Arcjet Protection Error:", error);
    next();
  }
};
