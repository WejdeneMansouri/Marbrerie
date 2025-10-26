import axios from "axios";

// URL backend (Render ou local)
export const API_URL = "https://marbrerie.onrender.com/api"; // Remplace par localhost:5000 pour dev local

// Récupérer le token depuis localStorage
const getToken = () => localStorage.getItem('token');

// Configuration axios avec token
const axiosConfig = () => {
  const token = getToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// --- PRODUITS ---
export const fetchProduits = async () => {
  try {
    const res = await axios.get(`${API_URL}/produits`);
    return res.data;
  } catch (err) {
    console.error("Erreur fetchProduits:", err);
    return [];
  }
};

// --- USERS ---
export const signupUser = async (userData) => {
  try {
    const res = await axios.post(`${API_URL}/signup`, userData);
    return res.data;
  } catch (err) {
    console.error("❌ Erreur signupUser:", err.response?.data || err.message);
    throw err;
  }
};

export const loginUser = async (loginData) => {
  try {
    const res = await axios.post(`${API_URL}/login`, loginData);
    // Sauvegarder token localStorage
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (err) {
    console.error("❌ Erreur loginUser:", err.response?.data || err.message);
    throw err;
  }
};

// --- COMMANDES ---
export const fetchCommandes = async () => {
  try {
    const res = await axios.get(`${API_URL}/commandes`, axiosConfig());
    return res.data;
  } catch (err) {
    console.error("Erreur fetchCommandes:", err);
    return [];
  }
};

export const createCommande = async (user_id, produits) => {
  try {
    const res = await axios.post(`${API_URL}/commandes`, { user_id, produits }, axiosConfig());
    return res.data;
  } catch (err) {
    console.error("Erreur createCommande:", err);
    throw err;
  }
};

// --- STATS ADMIN ---
export const fetchStatsAdmin = async () => {
  try {
    const res = await axios.get(`${API_URL}/admin/stats`, axiosConfig());
    return res.data;
  } catch (err) {
    console.error("Erreur fetchStatsAdmin:", err);
    return {};
  }
};
