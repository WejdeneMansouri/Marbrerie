// server.js
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

// CORS : autoriser le frontend Render
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Crée le dossier uploads si inexistant
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Connexion MySQL depuis variables env
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) return console.error("❌ Erreur MySQL :", err);
  console.log('✅ Connecté à MySQL');
});

// Multer
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

// Signup
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

// Serve uploads
app.use('/uploads', express.static('uploads'));

// Produits
app.get('/api/produits', (req, res) => {
  db.query("SELECT * FROM produits", (err, result) => {
    if (err) return res.status(500).send("Erreur récupération");
    // Remplace localhost par BACKEND_URL pour que le frontend affiche les images
    const produits = result.map(p => ({
      ...p,
      image_url: p.image_url ? p.image_url.replace('http://localhost:5000', BACKEND_URL) : null
    }));
    res.json(produits);
  });
});

// Test route
app.get("/api/test", (req, res) => res.send("API OK ✅"));

// Démarrage serveur
app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Serveur backend sur ${BACKEND_URL}`);
});
