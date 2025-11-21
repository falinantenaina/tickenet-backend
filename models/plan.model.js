import pool from "../config/database.js";

export default class Plan {
  static async getAll() {
    const [rows] = await pool.execute(
      "SELECT * FROM plans WHERE is_active = true ORDER BY duration ASC"
    );

    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.execute("SELECT * FROM plans WHERE id = ?", [id]);

    return rows[0];
  }

  static async create(name, duration, price, description) {
    const [result] = await pool.execute(
      "INSERT INTO plans (name, duration, price, description) VALUES (?, ?, ?, ?)",
      [name, duration, price, description]
    );

    return result.insertId;
  }

  static async update(id, name, duration, price, description, isActive) {
    const [result] = await pool.execute(
      "UPDATE plans SET name = ?, duration = ?, price = ?, description = ?, is_active = ? WHERE id = ?",
      [name, duration, price, description, isActive, id]
    );

    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM plan WHERE id = ?", [id]);

    return result.affectedRows;
  }
}
