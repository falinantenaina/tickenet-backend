import Plan from "../models/plan.model.js";
import Sale from "../models/sale.model.js";
import Ticket from "../models/ticket.model.js";

import MikrotikManager from "../utils/mikrotik.js";
import VoucherGenerator from "../utils/voucher.js";

export const purchaseTicket = async (req, res) => {
  try {
    const { planId, paymentMethod, phoneNumber, customerEmail, customerPhone } =
      req.body;

    // Validation
    if (!planId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Plan et méthode de paiement requis",
      });
    }

    // Récupérer le plan
    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan non trouvé",
      });
    }

    // Générer un code unique
    const code = VoucherGenerator.generateCode();

    // Créer le ticket
    const ticket = await Ticket.create({ code, planId });

    // Créer la vente
    const sale = await Sale.create({
      ticketId: ticket._id,
      planId,
      paymentMethod,
      amount: plan.price,
      phoneNumber: phoneNumber || null,
      customerEmail: customerEmail || null,
      customerPhone: customerPhone || null,
    });

    // Créer l'utilisateur sur Mikrotik IMMÉDIATEMENT
    const mikrotik = new MikrotikManager();
    let mikrotikSuccess = false;

    try {
      console.log(
        `🔄 Création du code ${code} sur Mikrotik pour ${plan.duration}h...`
      );
      const result = await mikrotik.createHotspotUser(code, plan.duration);
      mikrotikSuccess = true;
      console.log("✅ Code créé sur Mikrotik:", result);
    } catch (error) {
      console.error("❌ Erreur Mikrotik:", error.message);
      // On continue quand même, mais on note l'erreur
    }

    // Si paiement en espèces, marquer comme complété directement
    if (paymentMethod === "cash") {
      await Sale.findByIdAndUpdate(sale._id, { paymentStatus: "completed" });
      await Ticket.findByIdAndUpdate(ticket._id, { status: "sold" });
    }

    res.status(201).json({
      success: true,
      message: "Ticket acheté avec succès",
      ticket: {
        code,
        planName: plan.name,
        duration: plan.duration,
        price: plan.price,
      },
      saleId: sale._id,
      paymentMethod,
    });
  } catch (error) {
    console.error("Erreur purchaseTicket:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'achat du ticket",
    });
  }
};

export const verifyTicket = async (req, res) => {
  try {
    const { code } = req.params;

    const ticket = await Ticket.findByCode(code);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket non trouvé",
      });
    }

    const Plan = require("../models/Plan");
    const plan = await Plan.getById(ticket.plan_id);

    res.json({
      success: true,
      ticket: {
        code: ticket.code,
        status: ticket.status,
        planName: plan.name,
        duration: plan.duration,
      },
    });
  } catch (error) {
    console.error("Erreur verifyTicket:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification",
    });
  }
};

/* import Plan from "../models/plan.model.js";
import Sale from "../models/sale.model.js";
import Ticket from "../models/ticket.model.js";

import MikrotikManager from "../utils/mikrotik.js";
import VoucherGenerator from "../utils/voucher.js";

export const purchaseTicket = async (req, res) => {
  try {
    const { planId, paymentMethod, phoneNumber, customerEmail, customerPhone } =
      req.body;

    // Validation
    if (!planId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Plan et méthode de paiement requis",
      });
    }

    // Récupérer le plan
    const plan = await Plan.getById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan non trouvé",
      });
    }

    // Générer un code unique
    const code = VoucherGenerator.generateCode();

    // Créer le ticket
    const ticketId = await Ticket.create(code, planId);

    // Créer la vente
    const saleId = await Sale.create(
      ticketId,
      planId,
      paymentMethod,
      plan.price,
      phoneNumber || null,
      customerEmail || null,
      customerPhone || null
    );

    // Si paiement en espèces, marquer comme complété directement
    if (paymentMethod === "cash") {
      await Sale.updatePaymentStatus(saleId, "completed", "CASH-" + Date.now());
      await Ticket.markAsSold(ticketId);

      // Créer l'utilisateur sur Mikrotik
      const mikrotik = new MikrotikManager();
      try {
        await mikrotik.createUserSimple(code, plan.duration);
      } catch (error) {
        console.error("Erreur Mikrotik:", error);
      }
    }

    res.status(201).json({
      success: true,
      message: "Ticket acheté avec succès",
      ticket: {
        code,
        planName: plan.name,
        duration: plan.duration,
        price: plan.price,
      },
      saleId,
      paymentMethod,
    });
  } catch (error) {
    console.error("Erreur purchaseTicket:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'achat du ticket",
    });
  }
};

export const verifyTicket = async (req, res) => {
  try {
    const { code } = req.params;

    const ticket = await Ticket.findByCode(code);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket non trouvé",
      });
    }
    const plan = await Plan.getById(ticket.plan_id);

    res.json({
      success: true,
      ticket: {
        code: ticket.code,
        status: ticket.status,
        planName: plan.name,
        duration: plan.duration,
      },
    });
  } catch (error) {
    console.error("Erreur verifyTicket:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification",
    });
  }
}; */
