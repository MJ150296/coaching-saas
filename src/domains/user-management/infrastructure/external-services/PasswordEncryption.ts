/**
 * Password Encryption Service
 */

import bcrypt from 'bcryptjs';

export class PasswordEncryption {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Hash a password
   */
  static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
