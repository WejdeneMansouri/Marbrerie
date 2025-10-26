// backend-marbre/server.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📁 Crée le dossier uploads si inexistant
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// 📦 Connexion MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'marbre_app'
});

db.connect(err => {
  if (err) return console.error("❌ Erreur MySQL :", err);
  console.log('✅ Connecté à MySQL');
});

// 🔑 Middleware Auth
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ msg: "Token manquant" });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: "Token manquant" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ msg: "Token invalide" });
  }
}

// 🔹 Middleware Admin
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: "Admin seulement" });
  next();
}

// 📦 Multer (upload images)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 🔹 Auth Routes

// Signup (client ou admin)
app.post('/api/signup', async (req, res) => {
  const { nom, email, mot_de_passe, role } = req.body;
  if (!nom || !email || !mot_de_passe) return res.status(400).json({ msg: "Champs manquants" });

  try {
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) return res.status(400).json({ msg: "Utilisateur existant" });

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    await db.promise().query(
      'INSERT INTO users (nom, email, mot_de_passe, role, date_creation) VALUES (?, ?, ?, ?, NOW())',
      [nom, email, hashedPassword, role || 'client']
    );

    res.json({ msg: "Utilisateur créé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, mot_de_passe } = req.body;
  if (!email || !mot_de_passe) return res.status(400).json({ msg: "Champs manquants" });

  try {
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ msg: "Utilisateur non trouvé" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isMatch) return res.status(400).json({ msg: "Mot de passe incorrect" });

    const token = jwt.sign(
      { id: user.id, role: user.role, nom: user.nom, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: user.id, nom: user.nom, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

// 🔓 Serve uploads
app.use('/uploads', express.static('uploads'));

// 🔹 Gestion Produits (admin)
app.post('/api/produits', authMiddleware, adminMiddleware, upload.single('image'), (req, res) => {
  const { nom, gamme, marque, prix_m2, quantite } = req.body;
  const image_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;
  if (!nom || !gamme || !marque || !prix_m2 || !quantite || !image_url)
    return res.status(400).send("Tous les champs sont requis !");

  const sql = "INSERT INTO produits (nom, gamme, marque, prix_m2, quantite, image_url) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [nom, gamme, marque, prix_m2, quantite, image_url], (err, result) => {
    if (err) return res.status(500).send("Erreur ajout produit");
    res.status(201).json({ id: result.insertId, nom, gamme, marque, prix_m2, quantite, image_url });
  });
});

app.put('/api/produits/:id', authMiddleware, adminMiddleware, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { nom, gamme, marque, prix_m2, quantite, existingImage } = req.body;
  let image_url = existingImage;
  if (req.file) image_url = `http://localhost:5000/uploads/${req.file.filename}`;

  if (!nom || !gamme || !marque || !prix_m2 || !quantite) return res.status(400).send("Champs manquants !");

  const sql = "UPDATE produits SET nom=?, gamme=?, marque=?, prix_m2=?, quantite=?, image_url=? WHERE id=?";
  db.query(sql, [nom, gamme, marque, prix_m2, quantite, image_url, id], (err) => {
    if (err) return res.status(500).send("Erreur modification");
    res.status(200).json({ msg: "Produit modifié" });
  });
});

app.delete('/api/produits/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM produits WHERE id=?", [id], (err) => {
    if (err) return res.status(500).send("Erreur suppression");
    res.json({ msg: "Produit supprimé" });
  });
});

app.get('/api/produits', (req, res) => {
  db.query("SELECT * FROM produits", (err, result) => {
    if (err) return res.status(500).send("Erreur récupération");
    res.json(result);
  });
});

// 🔹 Gestion Commandes (admin)
app.post('/api/commandes', (req, res) => {
  const { user_id, produits } = req.body;
  if (!user_id || !produits || !Array.isArray(produits) || produits.length === 0)
    return res.status(400).send("Champs invalides !");

  const sqlCommande = "INSERT INTO commandes (user_id, statut) VALUES (?, 'en attente')";
  db.query(sqlCommande, [user_id], (err, result) => {
    if (err) return res.status(500).send("Erreur création commande");

    const commande_id = result.insertId;
    const details = produits.map(p => [
      commande_id, p.produit_id, p.longueur_cm, p.largeur_cm, p.quantite, p.prix_total
    ]);

    const sqlDetails = `
      INSERT INTO details_commande 
        (commande_id, produit_id, longueur_cm, largeur_cm, quantite, prix_total) 
      VALUES ?
    `;

    db.query(sqlDetails, [details], (err2) => {
      if (err2) return res.status(500).send("Erreur ajout détails");
      res.status(201).json({ msg: "Commande créée", commande_id });
    });
  });
});

app.get('/api/commandes', (req, res) => {
  const sql = `
    SELECT c.id AS commande_id, c.user_id, u.nom AS client_nom, c.date_commande, c.statut,
           d.id AS detail_id, d.produit_id, d.longueur_cm, d.largeur_cm, d.quantite, d.prix_total,
           p.nom AS produit_nom
    FROM commandes c
    JOIN users u ON c.user_id = u.id
    JOIN details_commande d ON c.id = d.commande_id
    JOIN produits p ON d.produit_id = p.id
    ORDER BY c.date_commande DESC
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).send("Erreur récupération");
    const commandes = {};
    result.forEach(row => {
      if (!commandes[row.commande_id]) {
        commandes[row.commande_id] = {
          id: row.commande_id,
          user_id: row.user_id,
          client_nom: row.client_nom,
          date_commande: row.date_commande,
          statut: row.statut,
          details: []
        };
      }
      commandes[row.commande_id].details.push({
        detail_id: row.detail_id,
        produit_id: row.produit_id,
        produit_nom: row.produit_nom,
        longueur_cm: row.longueur_cm,
        largeur_cm: row.largeur_cm,
        quantite: row.quantite,
        prix_total: row.prix_total
      });
    });
    res.json(Object.values(commandes));
  });
});

// 🔹 Gestion Users/Admins
app.post('/api/admins', authMiddleware, adminMiddleware, async (req, res) => {
  const { nom, email, mot_de_passe, telephone, adresse } = req.body;

  if (!nom || !email || !mot_de_passe) {
    return res.status(400).json({ msg: "Nom, email et mot de passe sont obligatoires" });
  }

  try {
    const [existing] = await db.promise().query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ msg: "Email déjà utilisé" });

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    await db.promise().query(
      `INSERT INTO users (nom, email, mot_de_passe, role, telephone, adresse, date_creation)
       VALUES (?, ?, ?, 'admin', ?, ?, NOW())`,
      [nom, email, hashedPassword, telephone || null, adresse || null]
    );

    res.status(201).json({ msg: "Admin ajouté avec succès" });
  } catch (err) {
    console.error("Erreur ajout admin :", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

app.get('/api/admins', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT id, nom, email, telephone, adresse, date_creation FROM users WHERE role='admin'"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

// 📌 Mettre à jour un utilisateur (client ou admin)
app.put('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, email, telephone, adresse, mot_de_passe } = req.body;

    // Récupérer l'utilisateur par ID
    const [rows] = await db.promise().query('SELECT * FROM users WHERE id=?', [id]);
    if (rows.length === 0) return res.status(404).json({ msg: "Utilisateur introuvable" });

    const userToUpdate = rows[0];

    // Sécurité : 
    // - Un client ne peut modifier que son propre profil
    // - Un admin peut modifier n'importe quel profil
    if (req.user.role === 'client' && req.user.id !== userToUpdate.id) {
      return res.status(403).json({ msg: "Action non autorisée" });
    }

    // Hasher le mot de passe si fourni
    let hashedPassword = userToUpdate.mot_de_passe;
    if (mot_de_passe && mot_de_passe.trim() !== "") {
      hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    }

    // Update
    await db.promise().query(
      `UPDATE users 
       SET nom=?, email=?, telephone=?, adresse=?, mot_de_passe=? 
       WHERE id=?`,
      [nom, email, telephone, adresse, hashedPassword, id]
    );

    const updatedUser = {
      id,
      nom,
      email,
      telephone,
      adresse,
      role: userToUpdate.role
    };

    res.json({ msg: "✅ Profil mis à jour avec succès", user: updatedUser });

  } catch (err) {
    console.error("❌ Erreur mise à jour user:", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

// Supprimer un admin
app.delete('/api/admins/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.promise().query('DELETE FROM users WHERE id=? AND role="admin"', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ msg: "Admin non trouvé" });
    res.json({ msg: "Admin supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

// 🔹 Statistiques dashboard admin
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [produits] = await db.promise().query('SELECT COUNT(*) AS total FROM produits');
    const [admins] = await db.promise().query("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");
    const [commandes] = await db.promise().query('SELECT COUNT(*) AS total FROM commandes');
    const [revenus] = await db.promise().query('SELECT IFNULL(SUM(prix_total),0) AS total FROM details_commande');

    res.json({
      produits: produits[0].total,
      admins: admins[0].total,
      commandes: commandes[0].total,
      revenus: revenus[0].total
    });
  } catch (err) {
    console.error('❌ Erreur récupération stats:', err);
    res.status(500).json({ message: 'Erreur serveur stats' });
  }
});

// Mettre à jour le statut d'une commande (admin)
app.put('/api/commandes/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  // Vérifier que le statut est valide
  if (!statut || !['en attente','acceptée','rejetée'].includes(statut)) {
    return res.status(400).json({ msg: "Statut invalide" });
  }

  const sql = "UPDATE commandes SET statut=? WHERE id=?";
  db.query(sql, [statut, id], (err, result) => {
    if (err) return res.status(500).json({ msg: "Erreur mise à jour statut" });
    if (result.affectedRows === 0) return res.status(404).json({ msg: "Commande non trouvée" });

    res.json({ msg: "Statut mis à jour avec succès", id, statut });
  });
});

// 👉 Route de test
app.get("/api/test", (req, res) => {
  res.send("API OK ✅");
});
// 🚀 Serveur
app.listen(5000, () => {
  console.log('🚀 Serveur backend sur http://localhost:5000');
});
