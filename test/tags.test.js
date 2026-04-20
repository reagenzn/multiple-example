const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeTags } = require('../lib/tags');

test('returns empty array for non-array input', () => {
  assert.deepEqual(sanitizeTags(undefined), []);
  assert.deepEqual(sanitizeTags(null), []);
  assert.deepEqual(sanitizeTags('foo'), []);
  assert.deepEqual(sanitizeTags({ 0: 'foo' }), []);
});

test('trims whitespace and drops empty strings', () => {
  assert.deepEqual(sanitizeTags(['  foo  ', '', '   ', 'bar']), ['foo', 'bar']);
});

test('removes duplicates preserving first occurrence order', () => {
  assert.deepEqual(sanitizeTags(['a', 'b', 'a', 'c', 'b']), ['a', 'b', 'c']);
});

test('strips leading # characters', () => {
  assert.deepEqual(sanitizeTags(['#foo', '##bar', '# baz']), ['foo', 'bar', 'baz']);
});

test('filters out non-string entries', () => {
  assert.deepEqual(sanitizeTags(['foo', 42, null, undefined, {}, 'bar']), ['foo', 'bar']);
});

test('treats tag stripped of # as duplicate of hashless version', () => {
  assert.deepEqual(sanitizeTags(['foo', '#foo']), ['foo']);
});

test('returns empty array for empty input', () => {
  assert.deepEqual(sanitizeTags([]), []);
});
