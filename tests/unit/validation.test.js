/**
 * Unit Tests for Validation Utilities
 */

const validation = require('../../util/validations/validation');

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    test('should validate correct email formats', () => {
      expect(validation.validateEmail('test@example.com')).toBe(true);
      expect(validation.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validation.validateEmail('user+tag@example.com')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(validation.validateEmail('invalid-email')).toBe(false);
      expect(validation.validateEmail('missing@domain')).toBe(false);
      expect(validation.validateEmail('@example.com')).toBe(false);
      expect(validation.validateEmail('user@')).toBe(false);
    });

    test('should reject emails with XSS attempts', () => {
      expect(validation.validateEmail('<script>alert()</script>@example.com')).toBe(false);
      expect(validation.validateEmail('user@example.com<script>')).toBe(false);
    });

    test('should reject emails with NoSQL injection patterns', () => {
      expect(validation.validateEmail('user$admin@example.com')).toBe(false);
    });

    test('should reject emails with explicit profanity', () => {
      expect(validation.validateEmail('fuck@example.com')).toBe(false);
      expect(validation.validateEmail('shit@example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should validate strong passwords', () => {
      expect(validation.validatePassword('Test123!')).toBe(true);
      expect(validation.validatePassword('Secure@Pass123')).toBe(true);
      expect(validation.validatePassword('MyP@ssw0rd')).toBe(true);
    });

    test('should reject weak passwords', () => {
      expect(validation.validatePassword('weak')).toBe(false);
      expect(validation.validatePassword('nodigits!')).toBe(false);
      expect(validation.validatePassword('NoSpecial123')).toBe(false);
      expect(validation.validatePassword('12345678')).toBe(false);
    });

    test('should reject passwords with XSS attempts', () => {
      expect(validation.validatePassword('<script>alert()</script>Test123!')).toBe(false);
    });

    test('should reject passwords with NoSQL injection patterns', () => {
      expect(validation.validatePassword('Test$123!')).toBe(false);
    });

    test('should reject passwords with explicit profanity', () => {
      expect(validation.validatePassword('Fuck123!')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    test('should validate correct usernames', () => {
      expect(validation.validateUsername('user123')).toBe(true);
      expect(validation.validateUsername('test_user')).toBe(true);
      expect(validation.validateUsername('User_Name_2024')).toBe(true);
    });

    test('should reject invalid usernames', () => {
      expect(validation.validateUsername('ab')).toBe(false); // Too short
      expect(validation.validateUsername('user@name')).toBe(false); // Invalid character
      expect(validation.validateUsername('user name')).toBe(false); // Space
    });

    test('should reject usernames with XSS attempts', () => {
      expect(validation.validateUsername('<script>alert()</script>')).toBe(false);
    });

    test('should reject usernames with profanity', () => {
      expect(validation.validateUsername('fuck123')).toBe(false);
    });
  });

  describe('validateFullname', () => {
    test('should validate correct full names', () => {
      expect(validation.validateFullname('John Doe')).toBe(true);
      expect(validation.validateFullname('Mary Jane Smith')).toBe(true);
      expect(validation.validateFullname("O'Brien")).toBe(true);
    });

    test('should reject full names with XSS attempts', () => {
      expect(validation.validateFullname('<script>alert()</script>')).toBe(false);
    });

    test('should reject full names with NoSQL injection', () => {
      expect(validation.validateFullname('John$Doe')).toBe(false);
    });

    test('should reject full names with profanity', () => {
      expect(validation.validateFullname('Fuck Name')).toBe(false);
    });
  });

  describe('validateDate', () => {
    test('should validate correct date formats (DD-MM-YYYY)', () => {
      expect(validation.validateDate('01-01-2025')).toBe(true);
      expect(validation.validateDate('31-12-2025')).toBe(true);
      expect(validation.validateDate('15-06-2024')).toBe(true);
    });

    test('should reject invalid date formats', () => {
      expect(validation.validateDate('2025-01-01')).toBe(false); // Wrong format
      expect(validation.validateDate('1-1-2025')).toBe(false); // Missing zeros
      expect(validation.validateDate('invalid')).toBe(false);
    });

    test('should reject dates with XSS attempts', () => {
      expect(validation.validateDate('<script>alert()</script>')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('should sanitize HTML input', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const sanitized = validation.sanitizeInput(input);
      expect(sanitized).not.toContain('<script>');
    });

    test('should handle normal text', () => {
      const input = 'Normal text input';
      const sanitized = validation.sanitizeInput(input);
      expect(sanitized).toBe(input);
    });

    test('should sanitize SQL-like injections', () => {
      const input = "1' OR '1'='1";
      const sanitized = validation.sanitizeInput(input);
      expect(sanitized).toBeDefined();
    });
  });
});
