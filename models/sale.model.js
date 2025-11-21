import pool from "../config/database.js";

export default class Sale {
  static async create(
    ticketId,
    planId,
    paymentMethod,
    amount,
    phoneNumber,
    customerEmail,
    customerPhone
  ) {
    const [result] = await pool.execute(
      `INSERT INTO sales (ticket_id, plan_id, payment_method, amount, phone_number, 
             customer_email, customer_phone, payment_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticketId,
        planId,
        paymentMethod,
        amount,
        phoneNumber,
        customerEmail,
        customerPhone,
        "pending",
      ]
    );
    return result.insertId;
  }

  static async updatePaymentStatus(saleId, status, transactionId = null) {
    const [result] = await pool.execute(
      "UPDATE sales SET payment_status = ?, transaction_id = ? WHERE id = ?",
      [status, transactionId, saleId]
    );
    return result.affectedRows;
  }

  static async getById(id) {
    const [rows] = await pool.execute(
      `SELECT s.*, t.code, p.name as plan_name, p.duration 
             FROM sales s 
             JOIN tickets t ON s.ticket_id = t.id 
             JOIN plans p ON s.plan_id = p.id 
             WHERE s.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async getStats(period = "day", specificDate = null) {
    let dateFilter = "";
    let params = [];

    if (specificDate) {
      dateFilter = "DATE(s.created_at) = ?";
      params = [specificDate];
    } else {
      switch (period) {
        case "day":
          dateFilter = "DATE(s.created_at) = CURDATE()";
          break;
        case "week":
          dateFilter = "YEARWEEK(s.created_at) = YEARWEEK(NOW())";
          break;
        case "month":
          dateFilter =
            "MONTH(s.created_at) = MONTH(NOW()) AND YEAR(s.created_at) = YEAR(NOW())";
          break;
        default:
          dateFilter = "DATE(s.created_at) = CURDATE()";
      }
    }

    const query = `
            SELECT 
                COUNT(*) as total_sales,
                SUM(amount) as total_revenue,
                p.name as plan_name,
                COUNT(s.id) as plan_sales
            FROM sales s
            JOIN plans p ON s.plan_id = p.id
            WHERE ${dateFilter} AND s.payment_status = 'completed'
            GROUP BY p.id, p.name
        `;

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getSaleHistory(limit = 50, offset = 0) {
    const [rows] = await pool.execute(
      `SELECT s.*, t.code, p.name as plan_name, p.duration, p.price 
             FROM sales s 
             JOIN tickets t ON s.ticket_id = t.id 
             JOIN plans p ON s.plan_id = p.id 
             ORDER BY s.created_at DESC 
             LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  }
}
