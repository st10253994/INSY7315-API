const jwt = require('jsonwebtoken');

const checkAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, 'ThisIsTheStringForMyTokenGenerationThisIsSecure');
        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: "You're not Authorized." });
    }
};

module.exports = { checkAuth };
