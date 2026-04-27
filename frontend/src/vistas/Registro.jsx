import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API, usarApp } from '../App';

export default function Registro() {
  const [datos, setDatos] = useState({
    email: '', password: '', nombre: '', rol: 'cliente',
    telefono: '', provincia: '', ciudad: ''
  });
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = usarApp();
  const navigate = useNavigate();

  const actualizar = (k, v) => setDatos(d => ({ ...d, [k]: v }));

  const enviar = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await axios.post(`${API}/auth/registro`, datos);
      iniciarSesion(res.data.token, res.data.usuario);
      if (datos.rol === 'vendedor') navigate('/panel-vendedor');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al registrarse');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 120px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 24px' }} data-testid="vista-registro">
      <div style={{ maxWidth: 520, width:'100%', padding: 48, border:'1px solid var(--borde)' }}>
        <p className="texto-overline" style={{ marginBottom: 12 }}>Beauty Moon</p>
        <h1 style={{ fontFamily:'Playfair Display', fontSize:'2rem', fontWeight:300, marginBottom: 32 }}>Crear Cuenta</h1>
        <form onSubmit={enviar} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <label className="label-limpio">Tipo de cuenta</label>
            <div style={{ display:'flex', gap:12, marginTop:8 }}>
              {[{v:'cliente', t:'Comprador'}, {v:'vendedor', t:'Asesora Avón'}].map(o => (
                <button type="button" key={o.v} onClick={() => actualizar('rol', o.v)} data-testid={`rol-${o.v}`}
                  style={{
                    flex:1, padding:'14px', background: datos.rol === o.v ? 'var(--primario)' : 'transparent',
                    color: datos.rol === o.v ? '#fff' : 'var(--primario)',
                    border:'1px solid var(--primario)',
                    fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', cursor:'pointer', fontFamily:'Outfit'
                  }}>
                  {o.t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-limpio">Nombre completo</label>
            <input required value={datos.nombre} onChange={e => actualizar('nombre', e.target.value)} className="input-limpio" data-testid="input-nombre"/>
          </div>
          <div>
            <label className="label-limpio">Email</label>
            <input required type="email" value={datos.email} onChange={e => actualizar('email', e.target.value)} className="input-limpio" data-testid="input-email"/>
          </div>
          <div>
            <label className="label-limpio">Contraseña</label>
            <input required type="password" minLength={6} value={datos.password} onChange={e => actualizar('password', e.target.value)} className="input-limpio" data-testid="input-password"/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div>
              <label className="label-limpio">Teléfono</label>
              <input value={datos.telefono} onChange={e => actualizar('telefono', e.target.value)} className="input-limpio" data-testid="input-telefono"/>
            </div>
            <div>
              <label className="label-limpio">Provincia</label>
              <input value={datos.provincia} onChange={e => actualizar('provincia', e.target.value)} className="input-limpio" data-testid="input-provincia"/>
            </div>
          </div>
          <div>
            <label className="label-limpio">Ciudad</label>
            <input value={datos.ciudad} onChange={e => actualizar('ciudad', e.target.value)} className="input-limpio" data-testid="input-ciudad"/>
          </div>
          <button type="submit" className="boton-primario" disabled={cargando} data-testid="btn-registrar">
            {cargando ? 'Creando...' : 'Crear Cuenta'}
          </button>
        </form>
        <div style={{ marginTop: 24, textAlign:'center', fontSize:'0.85rem', color:'var(--texto-tenue)' }}>
          ¿Ya tenés cuenta? <Link to="/ingresar" style={{ color:'var(--primario)', fontWeight:500 }} data-testid="link-ingresar">Ingresá</Link>
        </div>
      </div>
    </div>
  );
}
