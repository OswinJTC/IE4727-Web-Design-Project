import { describe, it, expect } from 'vitest';
import dishes from '../test/fixtures/dishes';
import { money, formatDate } from './format';
import * as v from './validation';
import { cartAdd, cartDecrease, cartRemove, summarize } from '../test/fixtures/cart';
import { MAX_PER_DISH } from './cart';
import { filterDishes, categoryCounts, normalizeCategory, normalizeQuery, menuUrl } from './menuQuery';

describe('format', () => {
  it('formats money with two decimals', () => {
    expect(money(7.2)).toBe('$7.20');
    expect(money(11.6)).toBe('$11.60');
  });
  it('formats dates like PHP j M, H:i', () => {
    expect(formatDate(new Date(2026, 9, 8, 14, 52).toISOString())).toBe('8 Oct, 14:52');
    expect(formatDate(new Date(2026, 0, 3, 9, 5).toISOString())).toBe('3 Jan, 09:05');
  });
});

describe('validation', () => {
  it('phone: 8 digits starting 6/8/9, spaces ignored', () => {
    expect(v.validatePhone('9123 4567')).toBe('');
    expect(v.validatePhone('81234567')).toBe('');
    expect(v.validatePhone('1234')).not.toBe('');
    expect(v.validatePhone('51234567')).not.toBe('');
    expect(v.validateCheckoutPhone('1234')).toBe('Enter an 8-digit number starting with 6, 8 or 9');
  });
  it('name: letters and spaces only', () => {
    expect(v.validateName('')).toBe('Enter your full name.');
    expect(v.validateName('Aisha Lim')).toBe('');
    expect(v.validateName('Aisha1')).toBe('Use letters and spaces only.');
  });
  it('email format', () => {
    expect(v.validateEmail('a@b.co')).toBe('');
    expect(v.validateEmail('nope')).not.toBe('');
  });
  it('password: 8-72 with letter and digit', () => {
    expect(v.validatePassword('Password123')).toBe('');
    expect(v.validatePassword('short1')).not.toBe('');
    expect(v.validatePassword('onlyletters')).not.toBe('');
    expect(v.validatePassword('12345678')).not.toBe('');
    expect(v.validatePassword('a1'.repeat(37))).not.toBe('');
  });
  it('confirm', () => {
    expect(v.validateConfirm('', 'x')).toBe('Confirm your password.');
    expect(v.validateConfirm('a', 'b')).toBe('Passwords do not match.');
    expect(v.validateConfirm('a', 'a')).toBe('');
  });
  it('address and notes lengths', () => {
    expect(v.validateAddress('  ', { required: true })).not.toBe('');
    expect(v.validateAddress('', { required: false })).toBe('');
    expect(v.validateAddress('x'.repeat(256), { required: false })).not.toBe('');
    expect(v.validateNotes('x'.repeat(256))).not.toBe('');
    expect(v.validateNotes('x'.repeat(255))).toBe('');
  });
  it('password strength scoring', () => {
    expect(v.passwordStrength('')).toBe(0);
    expect(v.passwordStrength('abcdefg1')).toBe(2);
    expect(v.passwordStrength('Abcdefg1')).toBe(3);
    expect(v.passwordStrength('Abcdefg1!')).toBe(4);
  });
});

describe('cart', () => {
  it('adds, merges and caps at 20 per dish', () => {
    let r = cartAdd({}, dishes, 1, 5);
    expect(r).toEqual({ cart: { 1: 5 }, added: 5 });
    r = cartAdd({ 1: 18 }, dishes, 1, 5);
    expect(r.cart[1]).toBe(MAX_PER_DISH);
    expect(r.added).toBe(2);
    r = cartAdd({ 1: 20 }, dishes, 1, 1);
    expect(r.added).toBe(0);
  });
  it('ignores unknown or unavailable dishes', () => {
    expect(cartAdd({}, dishes, 999, 1).added).toBe(0);
    const hidden = dishes.map((d) => (d.id === 1 ? { ...d, available: false } : d));
    expect(cartAdd({}, hidden, 1, 1).added).toBe(0);
  });
  it('decreases and removes', () => {
    expect(cartDecrease({ 1: 2 }, 1)).toEqual({ 1: 1 });
    expect(cartDecrease({ 1: 1 }, 1)).toEqual({});
    expect(cartDecrease({}, 1)).toEqual({});
    expect(cartRemove({ 1: 3, 2: 1 }, 1)).toEqual({ 2: 1 });
  });
  it('summarizes with catalog prices', () => {
    const s = summarize({ 3: 1, 9: 2 }, dishes); // Curry laksa 7.20, Iced lemon tea 2.20
    expect(s.items).toBe(3);
    expect(s.total).toBe(11.6);
    expect(s.lines.map((l) => l.name)).toEqual(['Curry laksa', 'Iced lemon tea']);
  });
});

describe('menu query', () => {
  it('normalizes category and query', () => {
    expect(normalizeCategory('Mains')).toBe('Mains');
    expect(normalizeCategory('Pizza')).toBe('');
    expect(normalizeQuery('  laksa ')).toBe('laksa');
    expect(normalizeQuery('x'.repeat(150))).toHaveLength(100);
  });
  it('filters by category and search, sorted by name', () => {
    const mains = filterDishes(dishes, 'Mains', '');
    expect(mains.every((d) => d.category === 'Mains')).toBe(true);
    expect(mains.map((d) => d.name)).toEqual([...mains.map((d) => d.name)].sort((a, b) => a.localeCompare(b)));
    expect(filterDishes(dishes, '', 'LAKSA').map((d) => d.name)).toEqual(['Curry laksa']);
  });
  it('treats % and _ literally', () => {
    expect(filterDishes(dishes, '', '%')).toEqual([]);
    expect(filterDishes(dishes, '', '_')).toEqual([]);
  });
  it('counts honour search but not category', () => {
    const all = categoryCounts(dishes, '');
    expect(Object.values(all).reduce((a, b) => a + b, 0)).toBe(20);
    expect(categoryCounts(dishes, 'rice')).toMatchObject({ Mains: 1, Desserts: 1 });
  });
  it('builds menu urls', () => {
    expect(menuUrl('', '')).toBe('/menu');
    expect(menuUrl('Mains', 'rice')).toBe('/menu?category=Mains&q=rice');
  });
});
