import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, getSession, hashPassword, revokeSession, verifyPassword } from './security';

describe('server security primitives', () => {
  it('hashes passwords and verifies only the matching password', async () => {
    const stored = await hashPassword('Correct Horse Battery Staple!');
    assert.match(stored, /^scrypt\$/);
    assert.equal(await verifyPassword('Correct Horse Battery Staple!', stored), true);
    assert.equal(await verifyPassword('incorrect password', stored), false);
  });

  it('issues opaque role-bearing sessions and revokes them', () => {
    const token = createSession('usr_admin', 'Administrator');
    assert.notEqual(token, 'usr_admin');
    assert.deepEqual(getSession(token), { userId: 'usr_admin', role: 'Administrator' });
    revokeSession(token);
    assert.equal(getSession(token), null);
  });
});
