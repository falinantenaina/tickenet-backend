-- ================================================================
-- Script de création complète de la base de données
-- Système de vente de tickets Mikrotik
-- ================================================================

-- Supprimer la base de données si elle existe déjà
DROP DATABASE IF EXISTS mikrotik_tickets;

-- Créer la base de données
CREATE DATABASE mikrotik_tickets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mikrotik_tickets;

-- ================================================================
-- Table des utilisateurs administrateurs
-- ================================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table des plans de tickets
-- ================================================================
CREATE TABLE plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    duration INT NOT NULL COMMENT 'Durée en heures',
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_duration (duration)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table des tickets/vouchers
-- ================================================================
CREATE TABLE tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('available', 'sold', 'used', 'expired') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP NULL,
    used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_plan (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Table des ventes
-- ================================================================
CREATE TABLE sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    plan_id INT NOT NULL,
    payment_method ENUM('orange_money', 'mvola', 'cash') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    phone_number VARCHAR(20),
    transaction_id VARCHAR(100),
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    INDEX idx_created_at (created_at),
    INDEX idx_payment_status (payment_status),
    INDEX idx_payment_method (payment_method),
    INDEX idx_transaction (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Insertion des données par défaut
-- ================================================================

-- Insérer un compte admin par défaut
-- Email: admin@example.com
-- Mot de passe: admin123
-- Hash généré avec bcrypt (10 rounds)
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@example.com', '$2a$10$wZjXqI8aKH3HvHqgqF9g8eKBSjAqN0aZQvhOvZ8mX1yK.8K0Cp9mS', 'admin');

-- Insérer les plans par défaut (prix en Ariary)
INSERT INTO plans (name, duration, price, description, is_active) VALUES
('Plan 1 Heure', 1, 500, 'Accès internet pendant 1 heure - Idéal pour une navigation rapide', true),
('Plan 2 Heures', 2, 900, 'Accès internet pendant 2 heures - Parfait pour le travail', true),
('Plan 3 Heures', 3, 1300, 'Accès internet pendant 3 heures - Recommandé pour les étudiants', true),
('Plan 4 Heures', 4, 1600, 'Accès internet pendant 4 heures - Meilleur rapport qualité/prix', true);

-- ================================================================
-- Vues SQL utiles pour les rapports
-- ================================================================

-- Vue pour les statistiques journalières
CREATE VIEW daily_sales_stats AS
SELECT 
    DATE(s.created_at) as sale_date,
    p.name as plan_name,
    COUNT(s.id) as total_sales,
    SUM(s.amount) as total_revenue,
    s.payment_method,
    COUNT(CASE WHEN s.payment_status = 'completed' THEN 1 END) as completed_sales,
    COUNT(CASE WHEN s.payment_status = 'pending' THEN 1 END) as pending_sales
FROM sales s
JOIN plans p ON s.plan_id = p.id
WHERE s.payment_status != 'failed'
GROUP BY DATE(s.created_at), p.id, s.payment_method
ORDER BY sale_date DESC;

-- Vue pour les tickets actifs
CREATE VIEW active_tickets AS
SELECT 
    t.code,
    t.status,
    p.name as plan_name,
    p.duration,
    p.price,
    t.created_at,
    t.sold_at,
    t.used_at,
    t.expires_at
FROM tickets t
JOIN plans p ON t.plan_id = p.id
WHERE t.status IN ('available', 'sold')
ORDER BY t.created_at DESC;

-- ================================================================
-- Procédures stockées utiles
-- ================================================================

-- Procédure pour nettoyer les tickets expirés
DELIMITER //
CREATE PROCEDURE clean_expired_tickets()
BEGIN
    UPDATE tickets 
    SET status = 'expired'
    WHERE status = 'used' 
    AND expires_at < NOW();
END //
DELIMITER ;

-- Procédure pour obtenir les statistiques globales
DELIMITER //
CREATE PROCEDURE get_global_stats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM tickets WHERE status = 'sold') as total_tickets_sold,
        (SELECT COUNT(*) FROM tickets WHERE status = 'available') as tickets_available,
        (SELECT SUM(amount) FROM sales WHERE payment_status = 'completed') as total_revenue,
        (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = CURDATE() AND payment_status = 'completed') as today_sales,
        (SELECT SUM(amount) FROM sales WHERE DATE(created_at) = CURDATE() AND payment_status = 'completed') as today_revenue;
END //
DELIMITER ;

-- ================================================================
-- Triggers pour automatisation
-- ================================================================

-- Trigger pour mettre à jour le statut du ticket lors d'une vente complétée
DELIMITER //
CREATE TRIGGER after_sale_completed
AFTER UPDATE ON sales
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
        UPDATE tickets 
        SET status = 'sold', sold_at = NOW()
        WHERE id = NEW.ticket_id;
    END IF;
END //
DELIMITER ;

-- ================================================================
-- Index supplémentaires pour optimiser les performances
-- ================================================================

-- Index pour améliorer les recherches de statistiques
CREATE INDEX idx_sales_date_status ON sales(created_at, payment_status);
CREATE INDEX idx_tickets_plan_status ON tickets(plan_id, status);

-- ================================================================
-- Insertion de tickets de démonstration (optionnel)
-- ================================================================

-- Générer quelques tickets de test pour chaque plan
INSERT INTO tickets (code, plan_id, status) VALUES
-- Plan 1h
('TEST-1H01-ABCD', 1, 'available'),
('TEST-1H02-EFGH', 1, 'available'),
-- Plan 2h
('TEST-2H01-IJKL', 2, 'available'),
('TEST-2H02-MNOP', 2, 'available'),
-- Plan 3h
('TEST-3H01-QRST', 3, 'available'),
('TEST-3H02-UVWX', 3, 'available'),
-- Plan 4h
('TEST-4H01-YZAB', 4, 'available'),
('TEST-4H02-CDEF', 4, 'available');

-- ================================================================
-- Afficher un résumé de la configuration
-- ================================================================

SELECT '✅ Base de données créée avec succès!' as Status;
SELECT 'mikrotik_tickets' as Database_Name;
SELECT COUNT(*) as Total_Tables FROM information_schema.tables WHERE table_schema = 'mikrotik_tickets';
SELECT COUNT(*) as Admin_Users FROM users WHERE role = 'admin';
SELECT COUNT(*) as Available_Plans FROM plans WHERE is_active = true;
SELECT COUNT(*) as Demo_Tickets FROM tickets WHERE code LIKE 'TEST-%';

-- ================================================================
-- Instructions pour l'administrateur
-- ================================================================

/*
INFORMATIONS DE CONNEXION PAR DÉFAUT:
=====================================

Email: admin@example.com
Mot de passe: admin123

IMPORTANT: Changez ce mot de passe immédiatement après la première connexion!

Pour changer le mot de passe admin:
1. Connectez-vous au dashboard admin
2. Ou utilisez cette requête SQL avec un nouveau hash bcrypt:

UPDATE users 
SET password = 'nouveau_hash_bcrypt' 
WHERE email = 'admin@example.com';

Pour générer un hash bcrypt:
- Utilisez le script create-admin.js fourni
- Ou un générateur en ligne: https://bcrypt-generator.com/

PLANS DISPONIBLES:
==================
- Plan 1 Heure: 500 Ar
- Plan 2 Heures: 900 Ar
- Plan 3 Heures: 1300 Ar
- Plan 4 Heures: 1600 Ar

COMMANDES UTILES:
=================

-- Voir les statistiques du jour:
SELECT * FROM daily_sales_stats WHERE sale_date = CURDATE();

-- Voir tous les tickets actifs:
SELECT * FROM active_tickets;

-- Nettoyer les tickets expirés:
CALL clean_expired_tickets();

-- Voir les statistiques globales:
CALL get_global_stats();

-- Voir les 10 dernières ventes:
SELECT s.*, t.code, p.name 
FROM sales s 
JOIN tickets t ON s.ticket_id = t.id 
JOIN plans p ON s.plan_id = p.id 
ORDER BY s.created_at DESC 
LIMIT 10;
*/