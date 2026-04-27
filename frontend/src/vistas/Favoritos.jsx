import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API, usarApp } from '../App';
import TarjetaProducto from '../componentes/TarjetaProducto';
import { Link } from 'react-router-dom';

export default function Favoritos() {
  const { usuario, token } = usarApp();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!usuario) { setCargando(false); return; }
    axios.get(`${API}/favoritos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setProductos(r.data))
      .finally(() => setCargando(false));
  }, [usuario, token]);

  if (!usuario) {
    return (
      <div className="seccion" style={{ textAlign:'center' }} data-testid="favoritos-sin-sesion">
        <div className="contenedor">
          <h1 className="titulo-seccion">Mis Favoritos</h1>
          <p style={{ color:'var(--texto-tenue)', margin:'24px 0' }}>Iniciá sesión para ver tus favoritos</p>
          <Link to="/ingresar" className="boton-primario">Ingresar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="seccion" data-testid="vista-favoritos">
      <div className="contenedor">
        <p className="texto-overline" style={{ marginBottom: 8 }}>Tu selección</p>
        <h1 className="titulo-seccion" style={{ marginBottom: 48 }}>Mis Favoritos</h1>
        {cargando ? <p>Cargando...</p> : productos.length === 0 ? (
          <p style={{ color:'var(--texto-tenue)' }} data-testid="favoritos-vacio">Aún no tenés favoritos</p>
        ) : (
          <div className="grilla-productos">
            {productos.map(p => <TarjetaProducto key={p.id} producto={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
