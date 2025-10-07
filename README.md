🏗️ Projet : Site Web Dynamique de Vente de Marbre
📖 Description du projet

Ce projet est une application web dynamique développée avec React.js pour le frontend et Node.js / Express pour le backend, connectée à une base de données MySQL.
Elle permet la vente en ligne de marbre, où les clients peuvent explorer les produits, choisir les dimensions personnalisées, et passer leur commande en toute simplicité.

Le site offre une expérience fluide et intelligente :

Lorsqu’un utilisateur sélectionne un produit et clique sur "Ajouter au panier",

s’il est connecté, il est redirigé directement vers la page de paiement ;

sinon, la page de connexion s’ouvre automatiquement, puis le panier est associé à son compte après connexion.

👥 Fonctionnalités principales
🧑‍💻 Côté Client

🔍 Parcourir la liste des marbres disponibles avec images, prix et détails.

📏 Sélectionner les dimensions personnalisées avant l’achat.

🛒 Ajouter des produits au panier et passer à la commande.

🔐 Se connecter ou créer un compte client.

💳 Accéder au processus de paiement sécurisé.

👤 Consulter et modifier son profil utilisateur (informations personnelles, historique de commandes).

⚙️ Côté Administrateur

➕ Ajouter, ✏️ modifier et 🗑️ supprimer des articles (mètres de marbre).

👀 Gérer les commandes avec différents statuts :

En attente / Acceptée / Rejetée / En préparation / En cours de livraison / Livrée.

💰 Consulter le revenu total généré par les ventes.

👨‍💼 Ajouter et gérer d’autres comptes administrateurs.

📦 Suivre en temps réel les commandes clients et leur évolution.

🛠️ Technologies utilisées
Frontend

⚛️ React.js

🔄 Axios (communication avec l’API)

🎨 Bootstrap / Tailwind CSS pour le design responsive

Backend

🟩 Node.js / Express

🗄️ MySQL / phpMyAdmin

🔑 JSON Web Token (JWT) pour l’authentification sécurisée

🧱 bcrypt.js pour le hachage des mots de passe

🌐 CORS / dotenv pour la configuration serveur

🔐 Authentification

Gestion complète de l’inscription, connexion et déconnexion.

Sécurisation des routes (clients et administrateurs).

Redirection automatique selon le rôle de l’utilisateur.

🧾 Structure du projet
project-marbre/
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── config/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.js
│
└── README.md

🚀 Installation et lancement
1. Cloner le projet
git clone https://github.com/ton-compte/projet-marbre.git
cd projet-marbre

2. Installer les dépendances
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

3. Lancer le serveur backend
cd backend
npm start

4. Lancer le frontend React
cd frontend
npm start

📦 Base de données (MySQL)

Tables principales :

users (clients et admins)

produits

commandes

details_commandes

paiements

📸 Aperçu des fonctionnalités

Page d’accueil avec liste des marbres

Page de détails + dimensions personnalisées

Système de panier intelligent

Gestion complète des commandes par l’admin

Tableau de bord des statistiques et revenus

💡 Objectif du projet

Ce projet vise à digitaliser la vente de marbre en offrant une solution complète pour les clients et les administrateurs.
L’objectif est d’assurer une expérience fluide, sécurisée et professionnelle, adaptée à la gestion en ligne d’un commerce de matériaux.
