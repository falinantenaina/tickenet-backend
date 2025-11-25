import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    //valiation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    const hashedPassowrd = await bcrypt.hash(password, 10);

    // Create User

    const user = await User.create({
      username,
      email,
      password: hashedPassowrd,
    });

    res.status(201).json({
      success: true,
      message: "Compte crée avec succès",
      userId: user._id,
    });
  } catch (error) {
    console.error("Erreur register:", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
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
