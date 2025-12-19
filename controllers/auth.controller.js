import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../config/generateTokenAndSetCookie.js";
import PointOfSale from "../models/pos.model.js";
import User from "../models/user.model.js";

export const register = async (req, res) => {
  try {
    const { username, email, password, role, PointOfSaleId } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    //Check cashier has a pos
    if (role === "cashier" && !PointOfSaleId) {
      return res.status(400).json({
        success: false,
        message: "Un point de vente doit être assigné au caissier",
      });
    }

    //Check if pos exist
    if (PointOfSaleId) {
      const pos = await PointOfSale.findById(PointOfSaleId);
      if (!pos) {
        return res.status(400).json({
          success: false,
          message: "Point de vente non trouvé",
        });
      }
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    const hashedPassowrd = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      role,
      password: hashedPassowrd,
      pointOfSaleId: role === "cashier" ? pointOfSaleId : undefined,
    });

    generateTokenAndSetCookie(user._id, res);

    res.status(201).json({
      success: true,
      message: "Compte crée avec succès",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        pointOfSaleId: user.pointOfSaleId,
      },
    });
  } catch (error) {
    console.error("Erreur register:", error.message || error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    const user = await User.findOne({ email }).populate("pointOfSaleId");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    const isPasswordValid = bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    generateTokenAndSetCookie(user._id, res);

    res.json({
      success: true,
      message: "Connexion réussi",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        pointOfSaleId: user.pointOfSaleId?.id,
        pointOfSaleName: user.pointOfSaleId?.name,
        mikrotikConfig: user.pointOfSaleId?.mikrotikConfig,
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "User logged out successfully" });
};

export const getProfil = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("pointOfSaleId")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        pointOfSaleId: user.pointOfSaleId?._id,
        pointOfSaleName: user.pointOfSaleId?.name,
        mikrotikConfig: user.pointOfSaleId?.mikrotikConfig,
      },
    });
  } catch (error) {
    console.error("Erreur getProfil:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur getProfil",
    });
  }
};
