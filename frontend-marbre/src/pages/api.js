import axios from "axios";

export const API_URL = "https://marbrerie.onrender.com/api"; // URL de ton backend en ligne, maintenant exportée

// Fonction pour récupérer le token depuis le localStorage
const getToken = () => localStorage.getItem('token');

// Configuration axios avec token
const axiosConfig = () => {
  const token = getToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// --- PRODUITS ---
export const fetchProduits = async () => {
  const res = await axios.get(`${API_URL}/produits`);
  return res.data;
};

// --- CLIENTS / USERS ---
export const fetchClients = async () => {
  const res = await axios.get(`${API_URL}/users`, axiosConfig());
  return res.data;
};

// --- COMMANDES ---
export const fetchCommandes = async () => {
  const res = await axios.get(`${API_URL}/commandes`, axiosConfig());
  return res.data;
};
// --- dans api.js ---
export const createCommande = async (user_id, produits) => {
  const res = await axios.post(
    `${API_URL}/commandes`,
    { user_id, produits },
    axiosConfig()
  );
  return res.data;
};

// --- USERS ---
export const signupUser = async (userData) => {
  const res = await axios.post(`${API_URL}/signup`, userData);
  return res.data;
};


export const updateStatutCommande = async (id, newStatut) => {
  await axios.put(
    `${API_URL}/commandes/${id}`,
    { statut: newStatut },
    axiosConfig()
  );
};

// --- STATS ADMIN ---
export const fetchStatsAdmin = async () => {
  const res = await axios.get(`${API_URL}/admin/stats`, axiosConfig());
  return res.data;
};
