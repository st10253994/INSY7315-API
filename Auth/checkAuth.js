const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
dotenv.config();

const checkAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: "Your session is expired. Please login again." });
    }
};

module.exports = { checkAuth };
