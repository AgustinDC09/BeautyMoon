import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Recuperar.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  // 👇 usar backend local
  const API_LOCAL = process.env.REACT_APP_LOCAL_URL + "/api";

  const enviar = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      await axios.post(`${API_LOCAL}/auth/reset-password`, { token, nueva_password: password });
      toast.success('Contraseña actualizada correctamente');
      navigate('/ingresar');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al restablecer contraseña');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="recuperar-container">
      <div className="recuperar-box">
        <h1>Restablecer contraseña</h1>
        <form onSubmit={enviar} className="recuperar-form">
          <input 
            type="password" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Nueva contraseña" 
          />
          <button type="submit" disabled={cargando}>
            {cargando ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
