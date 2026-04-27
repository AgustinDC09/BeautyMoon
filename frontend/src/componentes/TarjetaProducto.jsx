import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { usarApp } from '../App';

export default function TarjetaProducto({ producto }) {
  const { favoritos, toggleFavorito } = usarApp();
  const esFav = favoritos.includes(producto.id);
  const tieneDescuento = producto.precio_anterior && producto.precio_anterior > producto.precio;

  return (
    <div className="tarjeta-producto animar-entrada" data-testid={`tarjeta-producto-${producto.id}`}>
      <Link to={`/producto/${producto.id}`} style={{ display:'block' }}>
        <div className="caja-imagen">
          {tieneDescuento && <div className="badge-oferta">Oferta</div>}
          <img src={producto.imagen_url} alt={producto.nombre} loading="lazy" />
          <button
            onClick={(e) => { e.preventDefault(); toggleFavorito(producto); }}
            data-testid={`favorito-btn-${producto.id}`}
            style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.85)', border:'none', width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:2 }}
          >
            <Heart size={16} strokeWidth={1.5} fill={esFav ? 'var(--primario)' : 'none'} color="var(--primario)" />
          </button>
        </div>
      </Link>
      <div>
        <p className="texto-overline" style={{ marginBottom: 4 }}>{producto.categoria.replace('_', ' ')}</p>
        <Link to={`/producto/${producto.id}`} style={{ fontSize:'1rem', fontWeight: 400, color:'var(--primario)', display:'block', marginBottom: 4 }}>
          {producto.nombre}
        </Link>
        <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
          <span style={{ fontSize:'0.95rem', fontWeight: 500 }}>${producto.precio.toLocaleString('es-AR')}</span>
          {tieneDescuento && <span className="precio-tachado">${producto.precio_anterior.toLocaleString('es-AR')}</span>}
        </div>
      </div>
    </div>
  );
}
