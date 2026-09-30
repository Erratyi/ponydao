import assert from 'node:assert/strict';
import test from 'node:test';
import * as data from './data.js';

test('demo owner can sign in with username or email and the display password', () => {
  assert.equal(typeof data.authenticateDemoUser, 'function');
  assert.equal(data.authenticateDemoUser('mason', 'PONYdemo2026!'), true);
  assert.equal(data.authenticateDemoUser('mason@example.com', 'PONYdemo2026!'), true);
});

test('wrong or empty demo credentials cannot sign in', () => {
  assert.equal(typeof data.authenticateDemoUser, 'function');
  assert.equal(data.authenticateDemoUser('mason', 'wrong'), false);
  assert.equal(data.authenticateDemoUser('someone-else', 'PONYdemo2026!'), false);
  assert.equal(data.authenticateDemoUser('', ''), false);
});

test('demo session stays signed in until sign out', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };

  assert.equal(typeof data.isDemoSignedIn, 'function');
  assert.equal(typeof data.startDemoSession, 'function');
  assert.equal(typeof data.endDemoSession, 'function');
  assert.equal(data.isDemoSignedIn(storage), false);
  data.startDemoSession(storage);
  assert.equal(data.isDemoSignedIn(storage), true);
  data.endDemoSession(storage);
  assert.equal(data.isDemoSignedIn(storage), false);
});
