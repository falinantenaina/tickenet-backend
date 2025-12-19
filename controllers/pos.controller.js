import PointOfSale from "../models/pos.model.js";
import Sale from "../models/sale.model.js";
import User from "../models/user.model.js";

export const createPointOfSale = async (req, res) => {
  try {
    const { name, location, mikrotikConfig } = req.body;

    if (!name || !location || !mikrotikConfig) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    const pos = await PointOfSale.create({
      name,
      location,
      mikrotikConfig,
    });

    res.status(201).json({
      success: true,
      message: "Point de vente crée avec succès",
      PointOfSale: pos,
    });
  } catch (error) {
    console.error("Erreur createPointOfSale:", error.message || error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du point de vente",
    });
  }
};

export const getAllPointOfSale = async (req, res) => {
  try {
    const pointsOfSales = await PointOfSale.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      pointsOfSales,
    });
  } catch (error) {
    console.error("Erreur getAllPointsOfSale:", error.message || error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des points de vente",
    });
  }
};

export const getPointOfSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const pos = await PointOfSale.findById(id);

    if (!pos) {
      return res.status(404).json({
        success: false,
        message: "Point de vente non trouvé",
      });
    }

    res.json({
      success: true,
      pointOfSale: pos,
    });
  } catch (error) {
    console.error("Erreur getPointOfSaleById:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du point de vente",
    });
  }
};

export const updatePointOfSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, isActive, mikrotikConfig } = req.body;

    const pos = await PointOfSale.findByIdAndUpdate(
      id,
      {
        name,
        location,
        isActive,
        mikrotikConfig,
      },
      { new: true }
    );

    if (!pos) {
      return res.status(404).json({
        success: false,
        message: "Point de vente non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Point de vente mis à jour avec succès",
      PointOfSale: pos,
    });
  } catch (error) {
    console.error("Erreur updatePointOfSale:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
    });
  }
};

export const deletePointOfSale = async (req, res) => {
  try {
    const { id } = req.params;

    const cashiers = await User.countDocuments({ pointOfSaleId: id });
    if (cashiers > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Impossible de supprimer: des caissiers sont encore associés à ce point de vente",
      });
    }

    const pos = await PointOfSale.findByIdAndDelete(id);

    if (!pos) {
      return res.status(404).json({
        success: false,
        message: "Point de vente non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Point de vente supprimé avec succès",
    });
  } catch (error) {}
};

export const getCashiersByPos = async (req, res) => {
  try {
    const { id } = req.params;

    const cashiers = await User.find({
      pointOfSaleId: id,
      role: "cashier",
    }).select("-password");

    res.json({
      success: true,
      cashiers,
    });
  } catch (error) {
    console.error("Erreur getCashiersByPOS:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des caissiers",
    });
  }
};

export const getPointOfSaleStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = "day", startDate, endDate } = req.query;

    let matchCondition = { pointOfSaleId: id };
    const now = new Date();

    switch (period) {
      case "day":
        const dayStart = new Date(now.setHours(0, 0, 0, 0));
        const dayEnd = new Date(now.setHours(23, 59, 59, 999));
        matchCondition.createdAt = { $gte: dayStart, $lte: dayEnd };
        break;
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekend = new Date(weekStart);
        weekend.setDate(weekStart.getDate() + 6);
        weekend.setHours(23, 59, 59, 999);
        matchCondition.createdAt = { $gte: weekStart, $lte: weekend };
        break;
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const montEnd = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          999
        );
        matchCondition.createdAt = { $gte: monthStart, $lte: montEnd };
        break;
      case "custom":
        if (startDate && endDate) {
          matchCondition.createPointOfSale = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          };
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
          completedSales: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "completed"] }, 1, 0] },
          },
          completedRevenue: {
            $sum: {
              $cond: [{ $eq: ["paymentStatus", "completed"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalSales: 0,
        totalRevenue: 0,
        completedSales: 0,
        completedRevenue: 0,
      },
    });
  } catch (error) {
    console.error("Erreur getPointOfSaleStats:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
};
