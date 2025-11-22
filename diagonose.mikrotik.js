import net from "net";

const MIKROTIK_HOST = process.env.MIKROTIK_HOST || "192.168.56.2";
const MIKROTIK_PORT = 8728;

console.log("🔍 Diagnostic de connexion Mikrotik\n");
console.log(`Host: ${MIKROTIK_HOST}`);
console.log(`Port: ${MIKROTIK_PORT}\n`);

// Test 1: Ping (via socket)
console.log("Test 1: Vérification de la connectivité réseau...");
const socket = new net.Socket();

socket.setTimeout(5000);

socket.on("connect", () => {
  console.log("✅ Le serveur répond sur le port 8728");
  console.log("✅ L'API Mikrotik est probablement active");
  socket.destroy();
  testRouterOS();
});

socket.on("timeout", () => {
  console.error("❌ Timeout: Aucune réponse après 5 secondes");
  console.error("\n🔧 Solutions possibles:");
  console.error("1. Vérifiez que le Mikrotik est allumé");
  console.error("2. Vérifiez l'IP dans .env");
  console.error("3. Activez l'API: IP > Services > api");
  socket.destroy();
});

socket.on("error", (err) => {
  console.error("❌ Erreur de connexion:", err.message);
  console.error("\n🔧 Solutions:");
  if (err.code === "ECONNREFUSED") {
    console.error("- L'API n'est pas activée sur Mikrotik");
    console.error("- Ou le firewall bloque le port 8728");
  } else if (err.code === "EHOSTUNREACH") {
    console.error("- L'IP est incorrecte");
    console.error("- Ou le routeur n'est pas accessible");
  }
  socket.destroy();
});

socket.connect(MIKROTIK_PORT, MIKROTIK_HOST);

// Test 2: RouterOS API
async function testRouterOS() {
  console.log("\nTest 2: Test de l'API RouterOS...");

  try {
    const { RouterOSAPI } = require("node-routeros");
    const api = new RouterOSAPI({
      host: MIKROTIK_HOST,
      user: process.env.MIKROTIK_USER || "admin",
      password: process.env.MIKROTIK_PASSWORD || "",
      timeout: 10,
    });

    await api.connect();
    console.log("✅ Connexion API réussie!");

    // Tester une commande
    const identity = await api.write("/system/identity/print");
    console.log("✅ Identité Mikrotik:", identity[0].name);

    await api.close();
    console.log("\n🎉 Tout fonctionne correctement!");
  } catch (error) {
    console.error("❌ Erreur API:", error.message);
    console.error("\n🔧 Solutions:");
    console.error("- Vérifiez le nom d'utilisateur et mot de passe");
    console.error("- Essayez de vous connecter avec WinBox pour tester");
  }
}
