import { describe, it, expect } from 'vitest';
import * as v from '../src/validation.js';

describe('validation', () => {
  it('isString only accepts strings', () => {
    expect(v.isString('a')).toBe(true);
    expect(v.isString(null)).toBe(false);
    expect(v.isString({})).toBe(false);
    expect(v.isString(['a'])).toBe(false);
    expect(v.isString(5)).toBe(false);
  });

  it('phone: 8 digits starting 6/8/9, whitespace ignored, shorter message at checkout', () => {
    expect(v.validatePhone('9123 4567')).toBe('');
    expect(v.validatePhone('51234567')).toBe('Enter an 8-digit Singapore number starting with 6, 8 or 9.');
    expect(v.validateCheckoutPhone('1234')).toBe('Enter an 8-digit number starting with 6, 8 or 9');
    expect(v.validatePhone(123)).not.toBe('');
    expect(v.normalizePhone(' 9123 4567 ')).toBe('91234567');
  });

  it('name: letters and spaces only, max 100', () => {
    expect(v.validateName('')).toBe('Enter your full name.');
    expect(v.validateName('Aisha Lim')).toBe('');
    expect(v.validateName('Aisha1')).toBe('Use letters and spaces only.');
    expect(v.validateName('a'.repeat(101))).toBe('Use letters and spaces only.');
    expect(v.validateName(undefined)).toBe('Enter your full name.');
  });

  it('email: valid and at most 150 chars', () => {
    expect(v.validateEmail('a@b.co')).toBe('');
    expect(v.validateEmail('  a@b.co ')).toBe('');
    expect(v.validateEmail('nope')).toBe('Enter a valid email address.');
    expect(v.validateEmail(`${'a'.repeat(150)}@b.co`)).not.toBe('');
    expect(v.validateEmail({ a: 1 })).toBe('Enter a valid email address.');
  });

  it('password: 8-72 chars with a letter and a digit', () => {
    expect(v.validatePassword('Password123')).toBe('');
    expect(v.validatePassword('short1')).not.toBe('');
    expect(v.validatePassword('onlyletters')).not.toBe('');
    expect(v.validatePassword('12345678')).not.toBe('');
    expect(v.validatePassword('a1'.repeat(37))).not.toBe('');
    expect(v.validatePassword(['Password123'])).not.toBe('');
  });

  it('confirm', () => {
    expect(v.validateConfirm('', 'x')).toBe('Confirm your password.');
    expect(v.validateConfirm('a', 'b')).toBe('Passwords do not match.');
    expect(v.validateConfirm('a', 'a')).toBe('');
  });

  it('address and notes lengths', () => {
    expect(v.validateAddress('  ', { required: true })).toBe('Enter a delivery address (up to 255 characters).');
    expect(v.validateAddress('', { required: false })).toBe('');
    expect(v.validateAddress('x'.repeat(256), { required: false })).toBe('Address must be 255 characters or fewer.');
    expect(v.validateAddress('x'.repeat(256), { required: true })).toBe('Enter a delivery address (up to 255 characters).');
    expect(v.validateNotes('x'.repeat(256))).toBe('Notes must be 255 characters or fewer.');
    expect(v.validateNotes('x'.repeat(255))).toBe('');
  });
});
