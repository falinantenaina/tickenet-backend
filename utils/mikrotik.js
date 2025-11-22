import { RouterOSAPI } from "node-routeros";

export default class MikrotikManager {
  constructor() {
    this.host = process.env.MIKROTIK_HOST || "192.168.56.2";
    this.user = process.env.MIKROTIK_USER || "admin";
    this.password = process.env.MIKROTIK_PASSWORD || "yuiop";
  }

  // Créer une connexion au Mikrotik
  async connect() {
    try {
      const api = new RouterOSAPI({
        host: this.host,
        user: this.user,
        password: this.password,
        timeout: 10, // Augmenté à 10 secondes
        port: 8728, // Port API explicite
      });

      console.log(`Tentative de connexion à ${this.host}:8728...`);
      await api.connect();
      console.log("✅ Connexion Mikrotik réussie");
      return api;
    } catch (error) {
      console.error("❌ Erreur de connexion Mikrotik:", error);
      console.error("Vérifiez:");
      console.error("1. L'IP du Mikrotik:", this.host);
      console.error("2. L'API est activée (IP > Services > api)");
      console.error("3. Le firewall n'est pas bloquant");
      console.error("4. Les identifiants sont corrects");
      throw new Error("Impossible de se connecter au routeur Mikrotik");
    }
  }

  // Créer un utilisateur Hotspot avec un SEUL code (nom d'utilisateur = mot de passe)
  async createHotspotUser(code, duration) {
    try {
      const api = await this.connect();

      // Calculer l'uptime limit (durée en secondes)
      const uptimeLimit = duration * 3600; // heures en secondes

      // Créer l'utilisateur avec le MÊME code pour username et password
      await api.write("/ip/hotspot/user/add", [
        `=name=${code}`,
        `=password=${code}`, // Le mot de passe est identique au nom d'utilisateur
        `=limit-uptime=${uptimeLimit}`,
        "=profile=default",
      ]);

      await api.close();

      return {
        success: true,
        code: code,
        duration: `${duration}h`,
      };
    } catch (error) {
      console.error("Erreur création utilisateur Mikrotik:", error);
      throw error;
    }
  }

  // Vérifier si un code existe
  async codeExists(code) {
    try {
      const api = await this.connect();

      const users = await api.write("/ip/hotspot/user/print", [
        `?name=${code}`,
      ]);

      await api.close();

      return users.length > 0;
    } catch (error) {
      console.error("Erreur vérification code:", error);
      return false;
    }
  }

  // Supprimer un utilisateur par code
  async deleteUser(code) {
    try {
      const api = await this.connect();

      const users = await api.write("/ip/hotspot/user/print", [
        `?name=${code}`,
      ]);

      if (users.length > 0) {
        await api.write("/ip/hotspot/user/remove", [`=.id=${users[0][".id"]}`]);
      }

      await api.close();

      return true;
    } catch (error) {
      console.error("Erreur suppression utilisateur:", error);
      throw error;
    }
  }

  // Version simplifiée sans la librairie node-routeros
  // (À utiliser si vous ne pouvez pas installer node-routeros)
  async createUserSimple(code, duration) {
    // Cette fonction est un placeholder
    // Dans un environnement réel, vous devriez utiliser l'API Mikrotik
    // ou configurer les vouchers directement dans Mikrotik

    console.log(`Code d'accès créé: ${code}, durée: ${duration}h`);
    console.log(`Sur Mikrotik, l'utilisateur devra entrer: ${code}`);
    console.log(`(username: ${code}, password: ${code})`);

    return {
      success: true,
      code: code,
      duration: `${duration}h`,
    };
  }
}
