import { hashPassword, verifyPassword } from './password.util.js';

describe('password.util', () => {
  it('verifies the password that was hashed', async () => {
    const hash = await hashPassword('Password-123');

    expect(await verifyPassword('Password-123', hash)).toBe(true);
  });

  it('rejects a different password', async () => {
    const hash = await hashPassword('Password-123');

    expect(await verifyPassword('password-123', hash)).toBe(false);
  });

  it('never stores the plain password and salts every hash', async () => {
    const first = await hashPassword('Password-123');
    const second = await hashPassword('Password-123');

    expect(first).not.toContain('Password-123');
    expect(first).not.toBe(second);
  });

  it('rejects a malformed stored hash instead of throwing', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('x', 'bcrypt$a$b')).toBe(false);
  });
});
