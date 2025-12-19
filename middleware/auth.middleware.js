import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Accès non autorisé. token manquant",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).populate("pointOfSaleId");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Compte désactivé",
      });
    }

    req.user = {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      pointOfSaleId: user.pointOfSaleId?._id,
      pointOfSale: user.pointOfSaleId,
    };

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      success: false,
      message: "Token invalide",
    });
  }
};

export const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Accès réfusé. Droits de super administrateur requis",
    });
  }

  next();
};

export const isCashier = (req, res, next) => {
  if (req.user.role !== "cashier") {
    return res.status(403).json({
      success: false,
      message: "Accès refusé. Droits de caissier requis",
    });
  }

  next();
};

export const isAutorized = (req, res, next) => {
  if (req.user.role !== "super_admin" && req.user.role !== "cashier") {
    return res.status(403).json({
      success: false,
      message: "Accès refusé",
    });
  }

  next();
};
