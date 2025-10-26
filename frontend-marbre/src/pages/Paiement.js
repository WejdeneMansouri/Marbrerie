import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { createCommande } from "./api"; // <-- import depuis api.js

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [articles, setArticles] = useState([]);
  const [country, setCountry] = useState("France");
  const [currency, setCurrency] = useState("€");
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [user, navigate]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("panier")) || [];
    const withDefaults = stored.map(a => ({
      ...a,
      quantiteCommandee: a.quantiteCommandee || 1,
      largeur: a.largeur || 1,
      hauteur: a.hauteur || 1
    }));
    setArticles(withDefaults);
  }, []);

  useEffect(() => {
    if (country === "Tunisie") {
      setCurrency("TND");
      setRate(3.3);
    } else {
      setCurrency("€");
      setRate(1);
    }
  }, [country]);

  const totalArticles = articles.reduce((sum, a) => {
    const surface = a.largeur * a.hauteur;
    const prixM2 = a.prix_m2 || 0;
    return sum + surface * prixM2 * a.quantiteCommandee;
  }, 0) * rate;

  const shipping = 15 * rate;
  const total = totalArticles + shipping;

  const handleValiderCommande = async () => {
    if (!user) return navigate('/login');

    setLoading(true);
    try {
      const produitsAPI = articles.map(a => ({
        produit_id: a.id,
        longueur_cm: a.hauteur,
        largeur_cm: a.largeur,
        quantite: a.quantiteCommandee,
        prix_total: (a.largeur * a.hauteur * a.prix_m2 * a.quantiteCommandee * rate).toFixed(2)
      }));

      await createCommande(user.id, produitsAPI); // <-- API centralisée

      alert("✅ Commande validée avec succès !");
      localStorage.removeItem("panier");
      navigate("/mes-commandes");

    } catch (err) {
      console.error("❌ Erreur lors de la validation de commande:", err);
      alert("Erreur lors de la commande. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { backgroundImage: `url('/images/11.png')`, backgroundSize: "cover", minHeight: "100vh", color: "#222", display: "flex", flexDirection: "column" },
    nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem" },
    links: { display: "flex", gap: "2rem", fontSize: "1.1rem" },
    loginBtn: { padding: "8px 16px", border: "1px solid black", borderRadius: "5px", background: "white", cursor: "pointer" },
    main: { flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" },
    card: { background: "rgba(255,255,255,0.95)", padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", gap: "2rem", maxWidth: "1000px", width: "100%" },
    section: { flex: 1, display: "flex", flexDirection: "column", gap: "1rem" },
    input: { width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", boxSizing: "border-box" },
    article: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" },
    img: { width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" },
    summary: { marginTop: "1.5rem", borderTop: "1px solid #ddd", paddingTop: "1rem" },
    checkbox: { marginTop: "0.5rem" },
    button: { background: "black", color: "white", padding: "12px 30px", border: "none", borderRadius: "6px", cursor: "pointer", marginTop: "1.5rem", fontSize: "1rem", width: "100%" },
    addressRow: { display: "flex", gap: "1rem", flexWrap: "wrap" },
    select: { width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px", boxSizing: "border-box" }
  };

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <div style={styles.nav}>
        <div style={styles.links}>
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/home")}>Home</span>
          <span onClick={() => navigate('/acceuil')}>Produits</span>
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/mes-commandes")}>Mes commandes</span>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/Apropos')}>À propos</span>
        </div>
        <button style={styles.loginBtn}>Connexion</button>
      </div>

      {/* Section principale */}
      <div style={styles.main}>
        <div style={styles.card}>
          <div style={styles.section}>
            <h2>Méthodes de paiement</h2>
            <div>
              {["Carte", "PayPal", "Stripe", "Apple Pay", "Google Pay", "Virement (SEPA)"].map((m, i) => (
                <label key={i}><input type="radio" name="paiement" defaultChecked={i===0}/> {m}</label>
              ))}
            </div>

            <div style={styles.summary}>
              <h3>Résumé de la commande</h3>
              {articles.map((a, index) => {
                const surface = a.largeur * a.hauteur;
                const prixM2 = a.prix_m2 || 0;
                return (
                  <div key={index} style={styles.article}>
                    <img src={a.image_url || `http://localhost:5000/uploads/${a.image}`} alt={a.nom} style={styles.img} />
                    <span>
                      {a.nom} - {a.quantiteCommandee} pièce(s) - {a.largeur} m × {a.hauteur} m - {(surface * prixM2 * a.quantiteCommandee * rate).toFixed(2)} {currency}
                    </span>
                  </div>
                );
              })}
              <p>Frais de port : {shipping.toFixed(2)} {currency}</p>
              <p>Transporteur : Standard</p>
              <hr />
              <p><strong>Total : {total.toFixed(2)} {currency}</strong></p>
            </div>
          </div>

          <div style={styles.section}>
            <h2>Adresse de livraison</h2>
            <input style={styles.input} type="text" placeholder="Nom" />
            <input style={styles.input} type="text" placeholder="Rue" />
            <div style={styles.addressRow}>
              <input style={styles.input} type="text" placeholder="Code postal" />
              <input style={styles.input} type="text" placeholder="Ville" />
            </div>
            <select style={styles.select} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option>France</option>
              <option>Tunisie</option>
              <option>Belgique</option>
              <option>Allemagne</option>
            </select>
            <div style={styles.checkbox}>
              <label><input type="checkbox" defaultChecked /> Adresse de facturation identique</label>
            </div>
            <button style={styles.button} onClick={handleValiderCommande} disabled={loading}>
              {loading ? "Patientez..." : "Valider et Payer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
