//validation for inputs to protect against XSS and other attacks
//This class will make use of regex to validate inputs
//it will be used in the services before any database operations are performed

const sanitizer = require('sanitizer');

//regex patterns for validation
const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/; //comprehensive email regex - requires at least one TLD
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; //minimum 8 characters, at least one letter, one number, and one special character
const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/; //alphanumeric and underscores, 3-30 characters
const datePattern = /^\d{2}-\d{2}-\d{4}$/; //DD-MM-YYYY format

//patterns to protect against NoSQL injection (excluding dot for emails)
const noSqlInjectionPattern = /[\$]/; // Only block $ symbol, allow dots for emails

//common patterns to protect against XSS
const xssPattern = /<script.*?>.*?<\/script.*?>/i;
const htmlTagPattern = /<\/?[^>]+(>|$)/g;
const jsEventPattern = /on\w+=".*?"/g;
const jsProtocolPattern = /javascript:/i;
const dataProtocolPattern = /data:text\/html/i;

// More restrictive profanity check for email addresses - only blocks extremely explicit content
function containsExplicitProfanity(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }
    
    // Only the most explicit profanity that should never be in email addresses
    const explicitProfanityList = [
        'fuck', 'fck', 'fuk', 'phuck', 'fucc', 'fucking',
        'shit', 'shyt', 'shite',
        'bitch', 'btch', 'bych', 'biatch',
        'asshole', 'arsehole',
        'whore', 'slut', 'slutty', 'hoe',
        'porn', 'porno', 'pornography', 'xxx',
        'penis', 'cock', 'dick', 'prick',
        'vagina', 'pussy', 'cunt', 'twat',
        'boobs', 'tits', 'titties',
        'nigger', 'nigga', 'faggot', 'fag',
        'rape', 'raping', 'molest',
        'f*ck', 'f**k', 'f***', 'fvck', 'phuk',
        'sh*t', 'sh!t', 'b*tch', 'b!tch', 'bytch',
        'a$$hole', 'a**hole', 'pu$$y', 'pus5y', 'p*ssy',
        'd1ck', 'd!ck', 'dik', 'dck', 'c0ck', 'c@ck', 'cok'
    ];
    
    const lowerText = text.toLowerCase();
    
    // Check for explicit profanity without aggressive normalization
    for (const word of explicitProfanityList) {
        // Check direct matches
        if (lowerText.includes(word.toLowerCase())) {
            return true;
        }
        
        // Check for word boundaries to avoid false positives
        const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (wordRegex.test(lowerText)) {
            return true;
        }
    }
    
    return false;
}

//function to validate email against attacks and proper format
function validateEmail(email) {
    // First check basic format
    if (!emailPattern.test(email)) {
        return false;
    }
    
    // Check for XSS patterns
    if (xssPattern.test(email) || htmlTagPattern.test(email) || jsEventPattern.test(email) || jsProtocolPattern.test(email) || dataProtocolPattern.test(email)) {
        return false;
    }
    
    // Check for NoSQL injection (only $ symbol, not dots)
    if (noSqlInjectionPattern.test(email)) {
        return false;
    }
    
    // For emails, only check for extremely explicit profanity, not common words
    // Split email to check only the local part (before @)
    const localPart = email.split('@')[0];
    if (containsExplicitProfanity(localPart)) {
        return false;
    }
    
    return true;
}

//function to validate password
function validatePassword(password) {
    if (containsExplicitProfanity(password)) {
        return false;
    } else if (noSqlInjectionPattern.test(password) || xssPattern.test(password) || htmlTagPattern.test(password) || jsEventPattern.test(password) || jsProtocolPattern.test(password) || dataProtocolPattern.test(password)) {
        return false;
    }

    return passwordPattern.test(password);
}

//function to validate username
function validateUsername(username) {
    if(containsExplicitProfanity(username)){
        return false;
    }else if(noSqlInjectionPattern.test(username) || xssPattern.test(username) || htmlTagPattern.test(username) || jsEventPattern.test(username) || jsProtocolPattern.test(username) || dataProtocolPattern.test(username)) {
        return false;
    }
    return usernamePattern.test(username);
}

//function to validate fullname
function validateFullname(fullname) {
    if(containsExplicitProfanity(fullname)){
        return false;
    }else if(noSqlInjectionPattern.test(fullname) || xssPattern.test(fullname) || htmlTagPattern.test(fullname) || jsEventPattern.test(fullname) || jsProtocolPattern.test(fullname) || dataProtocolPattern.test(fullname)) {
        return false;
    }
    return true; //allow any characters in fullname as long as it passes the above checks
}

function validateDate(date) {
    if(noSqlInjectionPattern.test(date) || xssPattern.test(date) || htmlTagPattern.test(date) || jsEventPattern.test(date) || jsProtocolPattern.test(date) || dataProtocolPattern.test(date)) {
        return false;
    }
    return datePattern.test(date);
}

function validateRentAmount(rentAmount) {
    if(noSqlInjectionPattern.test(rentAmount) || xssPattern.test(rentAmount) || htmlTagPattern.test(rentAmount) || jsEventPattern.test(rentAmount) || jsProtocolPattern.test(rentAmount) || dataProtocolPattern.test(rentAmount)) {
        return false;
    }
    return rentAmountPattern.test(rentAmount);
}

//function to sanitize input strings
function sanitizeInput(input) {
    return sanitizer.sanitize(input);
}

module.exports = {
    validateEmail,
    validatePassword,
    validateUsername,
    validateFullname,
    validateDate,
    validateRentAmount,
    sanitizeInput
};
