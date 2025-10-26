import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signupUser } from './api'; // <-- import depuis api.js

export default function Signup() {
  const [form, setForm] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    telephone: '',
    adresse: '',
    code_postal: '',
    pays: ''
  });
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = await signupUser(form); // <-- appel API centralisé
      alert(data.msg || "Inscription réussie");
      if (data.success !== false) navigate('/login'); // navigation après succès
    } catch (err) {
      console.error('❌ Erreur inscription:', err);
      alert("Erreur inscription");
    }
  }

  const styles = {
    container: {
      maxWidth: '500px',
      margin: '50px auto',
      padding: '25px',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif',
    },
    h2: {
      textAlign: 'center',
      marginBottom: '20px',
      fontSize: '1.8rem',
      color: '#111',
    },
    inputGroup: { display: 'flex', flexDirection: 'column', marginBottom: '12px' },
    label: { fontWeight: 'bold', marginBottom: '5px', fontSize: '0.95rem' },
    input: { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' },
    button: { width: '100%', padding: '12px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'background 0.2s' }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.h2}>Créer un compte</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(form).map((key) => (
          <div style={styles.inputGroup} key={key}>
            <label style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1).replace('_',' ')}</label>
            <input
              name={key}
              type={key === 'email' ? 'email' : key === 'mot_de_passe' ? 'password' : 'text'}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
              value={form[key]}
              onChange={handleChange}
              style={styles.input}
              required={key === 'nom' || key === 'email' || key === 'mot_de_passe'}
            />
          </div>
        ))}
        <button type="submit" style={styles.button}>S'inscrire</button>
      </form>
    </div>
  );
}
