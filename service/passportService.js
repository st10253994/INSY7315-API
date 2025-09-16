const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authService = require('./authService');

function initPassport() {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await authService.findUserByGoogleId(profile.id);
      if (user) {
        await authService.updateLastLogin(user._id);
        return done(null, user);
      }

      user = await authService.createUser({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        photo: profile.photos[0].value
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

module.exports = initPassport;