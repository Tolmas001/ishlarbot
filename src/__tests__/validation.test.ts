import {
  requireText,
  parseAge,
  parseCardNumber,
  parseSalaryAmount,
  validatePhoneNumber,
  validateEmail,
  validateUrl,
  sanitizeString,
  validateJobTitle,
  validateJobDescription,
  validateLocation,
  maskCardNumber
} from '../utils/validation.js';

describe('Validation Utils', () => {
  describe('requireText', () => {
    it('should return trimmed text', () => {
      expect(requireText('  test  ', 'field')).toBe('test');
    });

    it('should throw error for empty string', () => {
      expect(() => requireText('', 'field')).toThrow('field kiritilmagan.');
    });

    it('should throw error for undefined', () => {
      expect(() => requireText(undefined, 'field')).toThrow('field kiritilmagan.');
    });

    it('should throw error for too short text', () => {
      expect(() => requireText('a', 'field')).toThrow('field juda qisqa.');
    });

    it('should throw error for too long text', () => {
      expect(() => requireText('a'.repeat(201), 'field')).toThrow('field juda uzun.');
    });
  });

  describe('parseAge', () => {
    it('should parse valid age', () => {
      expect(parseAge('25')).toBe(25);
    });

    it('should return null for invalid age', () => {
      expect(parseAge('abc')).toBeNull();
    });

    it('should return null for age below minimum', () => {
      expect(parseAge('10')).toBeNull();
    });

    it('should return null for age above maximum', () => {
      expect(parseAge('100')).toBeNull();
    });
  });

  describe('parseCardNumber', () => {
    it('should parse valid card number', () => {
      expect(parseCardNumber('8600123456789012')).toBe('8600123456789012');
    });

    it('should parse card with spaces', () => {
      expect(parseCardNumber('8600 1234 5678 9012')).toBe('8600123456789012');
    });

    it('should return null for invalid length', () => {
      expect(parseCardNumber('123456789012')).toBeNull();
    });

    it('should return null for invalid Luhn check', () => {
      expect(parseCardNumber('1234567890123456')).toBeNull();
    });
  });

  describe('parseSalaryAmount', () => {
    it('should parse valid salary', () => {
      expect(parseSalaryAmount('150000')).toBe(150000);
    });

    it('should parse salary with spaces', () => {
      expect(parseSalaryAmount('150 000')).toBe(150000);
    });

    it('should return null for zero', () => {
      expect(parseSalaryAmount('0')).toBeNull();
    });

    it('should return null for negative', () => {
      expect(parseSalaryAmount('-100')).toBeNull();
    });

    it('should return null for too large amount', () => {
      expect(parseSalaryAmount('200000000')).toBeNull();
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate valid phone', () => {
      expect(validatePhoneNumber('+998901234567')).toBe(true);
    });

    it('should return false for too short', () => {
      expect(validatePhoneNumber('123')).toBe(false);
    });

    it('should return false for too long', () => {
      expect(validatePhoneNumber('1234567890123456')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should validate valid URL', () => {
      expect(validateUrl('https://example.com')).toBe(true);
    });

    it('should return false for invalid URL', () => {
      expect(validateUrl('not a url')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
    });

    it('should remove javascript:', () => {
      expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });
  });

  describe('validateJobTitle', () => {
    it('should validate valid title', () => {
      expect(validateJobTitle('G\'isht teruvchi')).toBe(true);
    });

    it('should return false for too short', () => {
      expect(validateJobTitle('ab')).toBe(false);
    });

    it('should return false for too long', () => {
      expect(validateJobTitle('a'.repeat(101))).toBe(false);
    });
  });

  describe('validateJobDescription', () => {
    it('should validate valid description', () => {
      expect(validateJobDescription('This is a job description')).toBe(true);
    });

    it('should return false for too short', () => {
      expect(validateJobDescription('short')).toBe(false);
    });

    it('should return false for too long', () => {
      expect(validateJobDescription('a'.repeat(2001))).toBe(false);
    });
  });

  describe('validateLocation', () => {
    it('should validate valid location', () => {
      expect(validateLocation('Toshkent')).toBe(true);
    });

    it('should return false for too short', () => {
      expect(validateLocation('a')).toBe(false);
    });

    it('should return false for too long', () => {
      expect(validateLocation('a'.repeat(101))).toBe(false);
    });
  });

  describe('maskCardNumber', () => {
    it('should mask valid card', () => {
      expect(maskCardNumber('8600123456789012')).toBe('8600 **** **** 9012');
    });

    it('should return original for invalid length', () => {
      expect(maskCardNumber('123456')).toBe('123456');
    });
  });
});
