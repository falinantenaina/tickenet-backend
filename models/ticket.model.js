import pool from "../config/database.js";

export default class Ticket {
  static async create(code, planId) {
    const [result] = await pool.execute(
      "INSERT INTO tickets (code, plan_id, status) VALUES (?, ?, ?)",
      [code, planId, "available"]
    );

    return result.insertId;
  }

  static async findByCode(code) {
    const [rows] = await pool.execute("SELECT * FROM tickets WHERE code = ?", [
      code,
    ]);

    return rows[0];
  }

  static async MarkAsSold(ticketId) {
    const [result] = await pool.execute(
      "UPDATE tickets SET status = ?, sold_at =  NOW() WHERE id = ?",
      ["sold", ticketId]
    );

    return result.affectedRows;
  }

  static async getAvailableByPlan(planId) {
    const [rows] = await pool.execute(
      "SELECT * FROM tickets WHERE plan_id = ? AND status = ? LIMIT 1",
      [planId, "availabe"]
    );

    return rows[0];
  }
}
