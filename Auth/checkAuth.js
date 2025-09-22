const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
dotenv.config();

const checkAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from DB
        const db = client.db('RentWise');
        const systemUsers = db.collection('System-Users');
        const user = await systemUsers.findOne({ email: decoded.email });

        if (!user) {
        return res.status(401).json({ message: "User not found" });
        }
        // Attach user to req (omit password)
        delete user.password;
        req.user = user;

        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: "Your session is expired. Please login again." });
    }
};

module.exports = { checkAuth };

