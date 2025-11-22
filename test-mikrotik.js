import MikrotikManager from "./utils/mikrotik.js";

async function test() {
  const mikrotik = new MikrotikManager();

  try {
    // Créer un utilisateur de test
    const code = "TEST-1234-ABCD";
    const duration = 2; // 2 heures

    const result = await mikrotik.createHotspotUser(code, duration);
    console.log("✅ Utilisateur créé:", result);

    // Vérifier qu'il existe
    const exists = await mikrotik.codeExists(code);
    console.log("✅ Le code existe:", exists);

    // Le supprimer
    await mikrotik.deleteUser(code);
    console.log("✅ Utilisateur supprimé");
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

test();
