import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API_LOCAL, usarApp } from '../App';

export default function Ingresar() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = usarApp();
  const navigate = useNavigate();

  const enviar = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await axios.post(`${API_LOCAL}/auth/login`, { email, password }); // 👈 usa API_LOCAL
      iniciarSesion(res.data.token, res.data.usuario);
      const rol = res.data.usuario.rol;
      if (rol === 'vendedor') navigate('/panel-vendedor');
      else if (rol === 'admin') navigate('/panel-admin');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 120px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 24px' }} data-testid="vista-ingresar">
      <div style={{ maxWidth: 440, width:'100%', padding: 48, border:'1px solid var(--borde)' }}>
        <p className="texto-overline" style={{ marginBottom: 12 }}>Beauty Moon</p>
        <h1 style={{ fontFamily:'Playfair Display', fontSize:'2rem', fontWeight:300, marginBottom: 32 }}>Ingresar</h1>
        <form onSubmit={enviar} style={{ display:'flex', flexDirection:'column', gap:24 }}>
          <div>
            <label className="label-limpio" htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-limpio" data-testid="input-email" />
          </div>
          <div>
            <label className="label-limpio" htmlFor="pwd">Contraseña</label>
            <input id="pwd" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input-limpio" data-testid="input-password" />
          </div>
          <button type="submit" className="boton-primario" disabled={cargando} data-testid="btn-ingresar">
            {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <div style={{ marginTop: 32, textAlign:'center', fontSize:'0.85rem', color:'var(--texto-tenue)' }}>
          ¿No tenés cuenta? <Link to="/registro" style={{ color:'var(--primario)', fontWeight:500 }} data-testid="link-registro">Registrate</Link>
        </div>
        <div style={{ marginTop: 16, textAlign:'center', fontSize:'0.85rem' }}>
          <Link to="/recuperar" style={{ color:'var(--primario)', fontWeight:500 }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}
