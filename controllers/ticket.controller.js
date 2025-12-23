import Plan from "../models/plan.model.js";
import Sale from "../models/sale.model.js";
import Ticket from "../models/ticket.model.js";

import MikrotikManager from "../utils/mikrotik.js";
import VoucherGenerator from "../utils/voucher.js";

export const purchaseTicket = async (req, res) => {
  try {
    const { planId, paymentMethod, phoneNumber, customerEmail, customerPhone } =
      req.body;

    const cashierId = req.user.id;
    const pointOfSaleId = req.user.pointOfSaleId;
    const mikrotikConfig = req.user.pointOfSale?.mikrotikConfig;

    if (!planId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Plan et méthode de paiement requis",
      });
    }

    if (!pointOfSaleId) {
      return res.status(400).json({
        success: false,
        message: "Point de vente non trouvé",
      });
    }

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
    const ticket = await Ticket.create({ code, planId, pointOfSaleId });

    // Créer la vente
    const sale = await Sale.create({
      ticketId: ticket._id,
      planId,
      pointOfSaleId,
      cashierId,
      paymentMethod,
      amount: plan.price,
      phoneNumber: phoneNumber || null,
      customerEmail: customerEmail || null,
      customerPhone: customerPhone || null,
    });

    // Si paiement en espèces, marquer comme complété directement
    if (paymentMethod === "cash") {
      await Sale.findByIdAndUpdate(sale._id, { paymentStatus: "completed" });
      await Ticket.findByIdAndUpdate(ticket._id, { status: "sold" });
    }

    if (mikrotikConfig) {
      const mikrotik = new MikrotikManager(mikrotikConfig);

      try {
        console.log(
          `Création du code ${code} sur Mikrotik pour ${plan.duration}h...`
        );
        const result = await mikrotik.createHotspotUser(code, plan.duration);
        console.log("Code créé sur Mikrotik:", result);
      } catch (error) {
        console.error("Erreur Mikrotik:", error.message || error);
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

    const ticket = await Ticket.findOne({ code })
      .populate("planId")
      .populate("pointOfSaleId");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket non trouvé",
      });
    }

    res.json({
      success: true,
      ticket: {
        code: ticket.code,
        status: ticket.status,
        planName: ticket.planId.name,
        duration: ticket.planId.duration,
        pointOfSale: ticket.pointOfSaleId.name,
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
