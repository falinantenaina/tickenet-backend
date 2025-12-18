import PointOfSale from "../models/pos.model.js";
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
    console.error("Erreur createPointOfSale:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du point de vente",
    });
  }
};

export const getAllPointOfSale = async (req, res) => {
  try {
    const pointsOfSale = (await PointOfSale.find()).toSorted({ createdAt: -1 });

    res.json({
      success: true,
      PointOfSale,
    });
  } catch (error) {
    console.error("Erreur getAllPointsOfSale:", error);
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
