import crypto from "crypto";

export default class VoucherGenerator {
  // Generate a unique code for ticket
  static generateCode(length = 5) {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      code += characters[randomIndex];
    }

    return code;
  }

  // Generate many codes
  static generateBulkCode(count, length = 5) {
    const codes = new Set();

    while (codes.size < count) {
      codes.add(this.generateCode(length));
    }

    return Array.from(codes);
  }

  // Validate code fromat
  static isValidCodeFormat(code) {
    // XXXX-XXXX-XXXX (12 caractères + 2 tirets)
    const regex = /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
    return regex.test(code);
  }
}
