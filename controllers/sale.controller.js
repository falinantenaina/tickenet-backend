import Sale from "../models/sale.model.js";

/**
 * Récupère les statistiques des ventes selon différentes périodes
 * @route GET /api/sales/stats
 * @query {string} period - 'day', 'week', 'month', ou 'custom'
 * @query {string} date - Date spécifique (format: YYYY-MM-DD) pour period='day' ou 'custom'
 * @query {string} startDate - Date de début (format: YYYY-MM-DD) pour period='custom'
 * @query {string} endDate - Date de fin (format: YYYY-MM-DD) pour period='custom'
 */
export const getSaleStats = async (req, res) => {
  try {
    const { period = "day", date, startDate, endDate } = req.query;

    let matchCondition = {};
    let groupByFormat = "";
    let dateRange = {};

    const now = new Date();

    switch (period) {
      case "day":
        // Statistiques du jour spécifié ou d'aujourd'hui
        const targetDate = date ? new Date(date) : now;
        const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
        const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

        matchCondition = {
          createdAt: { $gte: dayStart, $lte: dayEnd },
        };
        groupByFormat = {
          $dateToString: { format: "%H:00", date: "$createdAt" },
        };
        break;

      case "week":
        // Statistiques de la semaine en cours
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        matchCondition = {
          createdAt: { $gte: weekStart, $lte: weekEnd },
        };
        groupByFormat = {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        };
        break;

      case "month":
        // Statistiques du mois en cours
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );

        matchCondition = {
          createdAt: { $gte: monthStart, $lte: monthEnd },
        };
        groupByFormat = {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        };
        break;

      case "custom":
        // Statistiques pour une période personnalisée
        if (!startDate || !endDate) {
          return res.status(400).json({
            success: false,
            message:
              "Les dates de début et de fin sont requises pour une période personnalisée",
          });
        }

        const customStart = new Date(startDate);
        customStart.setHours(0, 0, 0, 0);

        const customEnd = new Date(endDate);
        customEnd.setHours(23, 59, 59, 999);

        matchCondition = {
          createdAt: { $gte: customStart, $lte: customEnd },
        };
        groupByFormat = {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message:
            "Période invalide. Utilisez: 'day', 'week', 'month', ou 'custom'",
        });
    }

    // Agrégation pour obtenir les statistiques
    const stats = await Sale.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupByFormat,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
          completedSales: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "completed"] }, 1, 0] },
          },
          pendingSales: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] },
          },
          failedSales: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "failed"] }, 1, 0] },
          },
          completedRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "completed"] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Statistiques par méthode de paiement
    const paymentMethodStats = await Sale.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    // Résumé global
    const summary = await Sale.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
          averageSaleAmount: { $avg: "$amount" },
          completedSales: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "completed"] }, 1, 0] },
          },
          completedRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "completed"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      period,
      dateRange: matchCondition.createdAt,
      summary: summary[0] || {
        totalSales: 0,
        totalRevenue: 0,
        averageSaleAmount: 0,
        completedSales: 0,
        completedRevenue: 0,
      },
      timeline: stats,
      paymentMethods: paymentMethodStats,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
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
