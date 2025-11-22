import Sale from "../models/sale.model.js";

export const getSalesStats = async (req, res) => {
  try {
    const { period, date } = req.query;

    const stats = await Sale.getStats(period, date);

    // Calculer les totaux
    const totalSales = stats.reduce(
      (sum, s) => sum + parseInt(s.plan_sales),
      0
    );
    const totalRevenue = stats.reduce(
      (sum, s) => sum + parseFloat(s.total_revenue || 0),
      0
    );

    res.json({
      success: true,
      period: period || "day",
      specificDate: date || null,
      summary: {
        totalSales,
        totalRevenue: totalRevenue.toFixed(2),
      },
      details: stats,
    });
  } catch (error) {
    console.error("Erreur getSalesStats:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
};

export const getSalesHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const sales = await Sale.getSaleHistory(limit, offset);

    res.json({
      success: true,
      sales,
      pagination: {
        limit,
        offset,
        count: sales.length,
      },
    });
  } catch (error) {
    console.error("Erreur getSalesHistory:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique",
    });
  }
};
