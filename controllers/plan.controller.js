import Plan from "../models/plan.model.js";

export const getAllPlan = async (req, res) => {
  try {
    const plans = await Plan.getAllPlan();

    res.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Erreur getAllPlans:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des plans",
    });
  }
};

export const createPlan = async (req, res) => {
  try {
    const { name, duration, price, description } = req.body;

    if (!name || !duration || !price || !description) {
      return res.status(400).json({
        success: false,
        message: "Nom, durée et prix requis",
      });
    }

    const planId = await Plan.create(name, duration, price, description);

    res.status(201).json({
      success: true,
      message: "Plan crée avec succès",
      planId,
    });
  } catch (error) {
    console.error("Erreur createPlan:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du plan",
    });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration, price, description, isActive } = req.body;

    const result = await Plan.update(
      id,
      name,
      duration,
      price,
      description,
      isActive
    );

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: "Plan non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Plan mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur updatePlan:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
    });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Plan.delete(id);

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: "Plan non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Plan supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur deletePlan:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression",
    });
  }
};
