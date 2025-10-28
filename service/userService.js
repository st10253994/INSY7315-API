const { client } = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
const validate = require('../util/validations/validation.js');
dotenv.config();

//register user
async function registerUser(userData) {
    const db = client.db('RentWise');
    const usersCollection = db.collection('System-Users');

    const {email, password, firstName, surname} = userData;

    //check if inputs are filled inputs
    if (!email || !password || !firstName || !surname) {
        throw new Error('All fields are required');
    }

    //validate email and password
    validate.sanitizeInput(email);
    validate.sanitizeInput(password);

    if (!validate.validateEmail(email)) {
        throw new Error('Invalid email format');
    }
    if (!validate.validatePassword(password)) {
        throw new Error('Password must be at least 8 characters with letters, numbers, and special characters');
    }

    //check if user already exists
    const existingUser = await usersCollection.findOne({ email: userData.email });

    if (existingUser) {
        throw new Error('User already exists');
    }

    //salt and hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //default value for a role
    const role = 'tenant';

    const newUser = {
        email: email,
        password: hashedPassword,
        firstName: firstName,
        surname: surname,
        role: role
    }

    const result = await usersCollection.insertOne(newUser);
    return { id: result.insertedId, email: newUser.email, firstName: newUser.firstName, surname: newUser.surname, role: newUser.role };
}

//login user
async function loginUser(userData) {
    const db = client.db('RentWise');
    const usersCollection = db.collection('System-Users');

    const { email, password } = userData;

    //check if inputs are filled inputs
    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    //sanitize inputs
    validate.sanitizeInput(email);
    validate.sanitizeInput(password);

    //validate email and password
    if (!validate.validateEmail(email)) {
        throw new Error('Invalid email format');
    }
    if (!validate.validatePassword(password)) {
        throw new Error('Password must be at least 8 characters with letters, numbers, and special characters');
    }

    const user = await usersCollection.findOne({ email: email });

    if (!user) {
        throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { token, userId: user._id };
}

module.exports = {
    loginUser,
    registerUser
};