const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const authService = require('../service/googleSignInService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ✅ Controller functions
exports.googleMobileLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Missing idToken' });
    }

    // 1. Verify Google ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // 2. Find or create user
    let user = await authService.googleSignInService(payload.sub);
    if (!user) {
      user = await authService.googleSignInService({
        googleId: payload.sub,
        name: payload.name,
        email: payload.email,
        photo: payload.picture,
      });
    } else {
      await authService.googleSignInService(user._id);
    }

    // 3. Create JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } 
    );

    // 4. Send response
    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
      },
    });

  } catch (err) {
    console.error('Google Mobile Login Error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
};