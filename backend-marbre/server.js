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

// CORS : autoriser le frontend
app.use(cors({
  origin: [
    "https://marbrerie-front.onrender.com",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Crée le dossier uploads si inexistant
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Connexion MySQL via .env
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});



db.connect(err => {
  if (err) return console.error("❌ Erreur MySQL :", err);
  console.log('✅ Connecté à MySQL');
});

// Multer pour images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// URL backend public
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';


// 🔹 Routes

// Test route
app.get("/api/test", (req, res) => res.send("API OK ✅"));

// Signup
app.post('/api/signup', async (req, res) => {
  const { nom, email, mot_de_passe, telephone, adresse, code_postal, pays, role } = req.body;

  if (!nom || !email || !mot_de_passe) 
    return res.status(400).json({ msg: "Champs manquants" });

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    if (rows.length > 0) 
      return res.status(400).json({ msg: "Utilisateur existant" });

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    await db.promise().query(
      'INSERT INTO users (nom, email, mot_de_passe, role, telephone, adresse, code_postal, pays, date_creation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [nom, email, hashedPassword, role || 'client', telephone, adresse, code_postal, pays]
    );

    res.json({ msg: "Utilisateur créé" });

  } catch (err) {
    console.error("ERREUR SIGNUP :", err);
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

// Serve uploads
app.use('/uploads', express.static('uploads'));

// Produits
app.get('/api/produits', (req, res) => {
  db.query("SELECT * FROM produits", (err, result) => {
    if (err) return res.status(500).json({ msg: "Erreur récupération BDD" });

    // Corrige les URLs pour le frontend
    const produits = result.map(p => ({
      ...p,
      image_url: p.image_url ? p.image_url.replace('http://localhost:5000', BACKEND_URL) : null
    }));
    res.json(produits);
  });
});

// Ajouter un produit (admin + auth)
app.post('/api/produits', upload.single('image'), (req, res) => {
  const { nom, gamme, marque, prix_m2, quantite } = req.body;
  const image_url = req.file ? `${BACKEND_URL}/uploads/${req.file.filename}` : null;

  if (!nom || !gamme || !marque || !prix_m2 || !quantite || !image_url)
    return res.status(400).send("Tous les champs sont requis !");

  const sql = "INSERT INTO produits (nom, gamme, marque, prix_m2, quantite, image_url) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [nom, gamme, marque, prix_m2, quantite, image_url], (err, result) => {
    if (err) return res.status(500).send("Erreur ajout produit");
    res.status(201).json({ id: result.insertId, nom, gamme, marque, prix_m2, quantite, image_url });
  });
});

// Démarrage serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend sur ${BACKEND_URL}`);
});
