import { randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from './password.util.js';

const PASSWORD = randomBytes(12).toString('base64url');

describe('password.util', () => {
  it('verifies the password that was hashed', async () => {
    const hash = await hashPassword(PASSWORD);

    expect(await verifyPassword(PASSWORD, hash)).toBe(true);
  });

  it('rejects a different password', async () => {
    const hash = await hashPassword(PASSWORD);

    expect(await verifyPassword(`${PASSWORD}x`, hash)).toBe(false);
  });

  it('never stores the plain password and salts every hash', async () => {
    const first = await hashPassword(PASSWORD);
    const second = await hashPassword(PASSWORD);

    expect(first).not.toContain(PASSWORD);
    expect(first).not.toBe(second);
  });

  it('rejects a malformed stored hash instead of throwing', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('x', 'bcrypt$a$b')).toBe(false);
  });
});
