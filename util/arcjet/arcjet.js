const dotenv = require('dotenv');
const { default: arcjet, shield, detectBot, slidingWindow, validateEmail } = require('@arcjet/node');
dotenv.config();

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// https://docs.arcjet.com/get-started?f=node-js-express
const aj = arcjet({
  // Get your site key from https://app.arcjet.com and set it as an environment
  // variable rather than hard coding.
  key: process.env.ARCJET_KEY,
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: isDevelopment ? "DRY_RUN" : "LIVE" }),
    // Create a bot detection rule - more lenient in development
    detectBot({
      mode: isDevelopment ? "DRY_RUN" : "LIVE", // Log only in development
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        "CATEGORY:MONITOR", // Uptime monitoring services
        "CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
        // Add more categories for development flexibility
        ...(isDevelopment ? ["CATEGORY:SOCIAL_MEDIA", "CATEGORY:SEO"] : [])
      ],
    }),
    slidingWindow({
      mode: isDevelopment ? "DRY_RUN" : "LIVE", // More lenient rate limiting in development
      max: isDevelopment ? 50 : 10, // Higher limit in development
      interval: 0.5 * 60, // 30 seconds
    }),
    validateEmail({
      mode: isDevelopment ? "DRY_RUN" : "LIVE", // Log only in development
      // block disposable, invalid, and email addresses with no MX records
      deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
    }),
  ],
});

module.exports = aj;