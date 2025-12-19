import bcrypt from "bcryptjs";
import PointOfSale from "../models/pos.model.js";
import User from "../models/user.model.js";

export const createCashier = async (req, res) => {
  try {
    const { username, email, password, pointOfSaleId } = req.body;

    if (!username || !email || !password || !pointOfSaleId) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    const pos = await PointOfSale.findById(pointOfSaleId);
    if (!pos) {
      return res.status(404).json({
        success: false,
        message: "Point de vente non trouvé",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déja utilisé",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const cashier = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "cashier",
      pointOfSaleId,
    });

    res.status(201).json({
      success: true,
      message: "Caissier créé avec succès",
      cashier: {
        id: cashier._id,
        email: cashier.email,
        username: cashier.username,
        pointOfSaleId: cashier.pointOfSaleId,
      },
    });
  } catch (error) {
    console.error("Erreur createCashier:", error.message || error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const getAllCashiers = async (req, res) => {
  try {
    const cashiers = await User.find({ role: "cashier" })
      .populate("pointOfSaleId")
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      cashiers,
    });
  } catch (error) {
    console.error("Erreur getAllCashiers:", error.message || error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const getCashier = async (req, res) => {
  try {
    const { id } = req.params;
    const cashier = await User.findById(id)
      .populate("pointOfSaleId")
      .select("-password");
    if (!cashier) {
      return res.status(404).json({
        success: false,
        message: "Caissier non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      cashier,
    });
  } catch (error) {
    console.error("Erreur getCashier:", error.message || error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const updateCashier = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, pointOfSaleId, isActive } = req.body;

    const cashier = await User.findByIdAndUpdate(
      id,
      {
        username,
        email,
        pointOfSaleId,
        isActive,
      },
      { new: true }
    ).select("-password");

    if (!cashier) {
      return res.status(404).json({
        success: false,
        message: "Caissier non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Caissier mis à jour avec succès",
      cashier,
    });
  } catch (error) {
    console.error("Erreur updateCashier:", error.message || error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const deleteCashier = async (req, res) => {
  try {
    const { id } = req.params;
    const cashier = await User.findByIdAndDelete(id);

    if (!cashier) {
      return res.status(404).json({
        success: false,
        message: "Caissier non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Caissier supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur deleteCashier:", error.message || error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};
