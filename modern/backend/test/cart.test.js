import { describe, it, expect } from 'vitest';
import { MAX_PER_DISH, addToCart, decrease, remove } from '../src/cart.js';

const dish = { item_id: 1 };

describe('cart rules', () => {
  it('adds and merges counts', () => {
    expect(addToCart({}, dish, 5)).toEqual({ cart: { 1: 5 }, added: 5 });
    expect(addToCart({ 1: 2 }, dish, 3)).toEqual({ cart: { 1: 5 }, added: 3 });
  });
  it('never exceeds 20 per dish', () => {
    expect(MAX_PER_DISH).toBe(20);
    expect(addToCart({ 1: 18 }, dish, 5)).toEqual({ cart: { 1: 20 }, added: 2 });
    expect(addToCart({ 1: 20 }, dish, 1)).toEqual({ cart: { 1: 20 }, added: 0 });
  });
  it('adds nothing for an unknown or unavailable dish (null)', () => {
    expect(addToCart({}, null, 1)).toEqual({ cart: {}, added: 0 });
  });
  it('decrease removes the line at 0 and ignores missing lines', () => {
    expect(decrease({ 1: 2 }, 1)).toEqual({ 1: 1 });
    expect(decrease({ 1: 1 }, 1)).toEqual({});
    expect(decrease({}, 1)).toEqual({});
  });
  it('remove deletes the whole line', () => {
    expect(remove({ 1: 3, 2: 1 }, 1)).toEqual({ 2: 1 });
  });
});
