/**
 * Handles Google OAuth authentication for mobile clients.
 * 
 * @async
 * @function googleMobileLogin
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.idToken - Google ID token
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response containing:
 *   - success: boolean indicating success status
 *   - token: JWT token for authenticated session
 *   - user: Object containing user details (id, name, email, photo)
 * @throws {Error} 400 - If idToken is missing
 * @throws {Error} 401 - If Google token is invalid
 * 
 * @description
 * Verifies Google ID token, finds or creates user in database,
 * and returns JWT token with user information.
 * Uses Google OAuth2 client for token verification.
 * 
 * Reference used: 
 * Gemini Google. 2025. verifying google client id within node.js. Google. Available at:
 * <https://www.google.com/search?q=verifying+google+client+id+within+node.js&sca_esv=9349b9a2334e1130&ei=zrnTaNKPB-2ihbIP5dOr8QM&ved=2ahUKEwj5rtSHi_GPAxUeVEEAHfD-HA8Q0NsOegQIORAA&uact=5&sclient=gws-wiz-serp&udm=50&aep=10&ntc=1>
 * [Accessed 16 September 2025].
 */
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const {googleSignInService} = require('../service/googleSignInService');
const authService = new googleSignInService();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleMobileLogin = async (req, res) => {
  console.log(`[googleMobileLogin] Entry`);
  try {
    const { idToken } = req.body;
    if (!idToken) {
      console.error(`[googleMobileLogin] Error: Missing idToken`);
      return res.status(400).json({ error: 'Missing idToken' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const parts = payload.name.split(' ');

    let user = await authService.findUserByGoogleId(payload.sub);
    if (!user) {
      user = await authService.createUser({
        googleId: payload.sub,
        firstName: parts [0],
        surname: parts[1],
        email: payload.email,
        pfpImage: payload.picture,
      });
      console.log(`[googleMobileLogin] New user created with googleId="${payload.sub}"`);
    } else {
      console.log(`[googleMobileLogin] Existing user found with googleId="${payload.sub}"`);
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } 
    );

    console.log(`[googleMobileLogin] Exit: Login successful for userId="${user._id}"`);
    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        pfpImage: user.pfpImage,
      },
    });

  } catch (err) {
    console.error(`[googleMobileLogin] Error:`, err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
  console.log(`[googleMobileLogin] Exit: statusCode=${res.statusCode}`);
};