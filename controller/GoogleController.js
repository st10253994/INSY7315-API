const jwt = require('jsonwebtoken');
const passport = require('passport');

class GoogleController {
  home(req, res) {
    res.json({ message: "API is running, use /auth/google" });
  }

  googleAuth(req, res, next) {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }

  googleCallback(req, res, next) {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      // ✅ Generate JWT instead of session
      const token = jwt.sign(
        { id: user._id, email: user.email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      // Send JWT back to mobile client
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          photo: user.photo
        }
      });
    })(req, res, next);
  }
}

module.exports = new GoogleController();