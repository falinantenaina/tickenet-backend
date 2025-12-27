// controllers/sale.controller.js
import mongoose from "mongoose";
import Sale from "../models/sale.model.js";

/**
 * Récupère les statistiques des ventes selon différentes périodes
 */
export const getSaleStats = async (req, res) => {
  try {
    const {
      period = "day",
      date,
      startDate,
      endDate,
      pointOfSaleId,
      cashierId,
    } = req.query;
    const user = req.user;

    let matchCondition = {};
    let groupByFormat = "";
    const now = new Date();

    // Filtrage par rôle
    if (user.role === "cashier") {
      matchCondition.pointOfSaleId = new mongoose.Types.ObjectId(
        user.pointOfSaleId
      );
      matchCondition.cashierId = new mongoose.Types.ObjectId(user.id);
    } else if (user.role === "super_admin") {
      // Filtres optionnels pour super admin
      if (pointOfSaleId && pointOfSaleId !== "") {
        matchCondition.pointOfSaleId = new mongoose.Types.ObjectId(
          pointOfSaleId
        );
      }
      if (cashierId && cashierId !== "") {
        matchCondition.cashierId = new mongoose.Types.ObjectId(cashierId);
      }
    }

    // Gestion des périodes
    switch (period) {
      case "day":
        const targetDate = date ? new Date(date) : now;
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);

        matchCondition.createdAt = { $gte: dayStart, $lte: dayEnd };
        groupByFormat = {
          $dateToString: { format: "%H:00", date: "$createdAt" },
        };
        break;

      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        matchCondition.createdAt = { $gte: weekStart, $lte: weekEnd };
        groupByFormat = {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        };
        break;

      case "month":
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

        matchCondition.createdAt = { $gte: monthStart, $lte: monthEnd };
        groupByFormat = {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        };
        break;

      case "custom":
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

        matchCondition.createdAt = { $gte: customStart, $lte: customEnd };
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

    console.log("Match condition:", JSON.stringify(matchCondition, null, 2));

    // Agrégation pour obtenir les statistiques temporelles
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

    console.log("Summary result:", summary);

    return res.status(200).json({
      success: true,
      period,
      filters: {
        pointOfSaleId: pointOfSaleId || null,
        cashierId: cashierId || null,
      },
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
    const { limit = 50, offset = 0, pointOfSaleId, cashierId } = req.query;
    const user = req.user;

    let matchCondition = {};

    // Filtrage par rôle
    if (user.role === "cashier") {
      matchCondition.pointOfSaleId = new mongoose.Types.ObjectId(
        user.pointOfSaleId
      );
      matchCondition.cashierId = new mongoose.Types.ObjectId(user.id);
    } else if (user.role === "super_admin") {
      if (pointOfSaleId && pointOfSaleId !== "") {
        matchCondition.pointOfSaleId = new mongoose.Types.ObjectId(
          pointOfSaleId
        );
      }
      if (cashierId && cashierId !== "") {
        matchCondition.cashierId = new mongoose.Types.ObjectId(cashierId);
      }
    }

    console.log("Sales history match condition:", matchCondition);

    const sales = await Sale.find(matchCondition)
      .populate("ticketId")
      .populate("planId")
      .populate("pointOfSaleId")
      .populate("cashierId", "username email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await Sale.countDocuments(matchCondition);

    res.json({
      success: true,
      sales,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: sales.length,
        total: totalCount,
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

// Statistiques par caissier (pour super admin)
export const getCashierStats = async (req, res) => {
  try {
    const { cashierId, period = "day", startDate, endDate } = req.query;

    if (!cashierId) {
      return res.status(400).json({
        success: false,
        message: "ID du caissier requis",
      });
    }

    let matchCondition = {
      cashierId: new mongoose.Types.ObjectId(cashierId),
    };
    const now = new Date();

    switch (period) {
      case "day":
        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(now);
        dayEnd.setHours(23, 59, 59, 999);
        matchCondition.createdAt = { $gte: dayStart, $lte: dayEnd };
        break;
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date();
        matchCondition.createdAt = { $gte: weekStart, $lte: weekEnd };
        break;
      case "month":
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
        matchCondition.createdAt = { $gte: monthStart, $lte: monthEnd };
        break;
      case "custom":
        if (startDate && endDate) {
          const customStart = new Date(startDate);
          customStart.setHours(0, 0, 0, 0);
          const customEnd = new Date(endDate);
          customEnd.setHours(23, 59, 59, 999);
          matchCondition.createdAt = { $gte: customStart, $lte: customEnd };
        }
        break;
    }

    const stats = await Sale.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
          completedRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "completed"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    res.json({
      success: true,
      cashierId,
      period,
      stats: stats[0] || {
        totalSales: 0,
        totalRevenue: 0,
        completedRevenue: 0,
      },
    });
  } catch (error) {
    console.error("Erreur getCashierStats:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
};
