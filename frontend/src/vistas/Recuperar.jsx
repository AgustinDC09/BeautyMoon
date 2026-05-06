// Recuperar.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import './Recuperar.css';

export default function Recuperar() {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);

  const API_LOCAL = process.env.REACT_APP_LOCAL_URL + "/api";

  const enviar = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      await axios.post(`${API_LOCAL}/auth/forgot-password`, { email });
      toast.success('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al solicitar recuperación');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="recuperar-container">
      <div className="recuperar-box">
        <h1>Recuperar contraseña</h1>
        <form onSubmit={enviar} className="recuperar-form">
          <input 
            type="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Tu correo" 
          />
          <button type="submit" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
      </div>
    </div>
  );
}
