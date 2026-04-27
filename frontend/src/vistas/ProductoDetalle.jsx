import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API, usarApp } from '../App';
import { Heart, MapPin, Phone, Plus, Minus } from 'lucide-react';

export default function ProductoDetalle() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [pestaña, setPestaña] = useState('descripcion');
  const { agregarAlCarrito, setAbrirCarrito, toggleFavorito, favoritos } = usarApp();

  useEffect(() => {
    axios.get(`${API}/productos/${id}`).then(r => setProducto(r.data));
  }, [id]);

  if (!producto) return <div style={{ padding:'120px 24px', textAlign:'center' }}>Cargando...</div>;

  const esFav = favoritos.includes(producto.id);
  const tieneDesc = producto.precio_anterior && producto.precio_anterior > producto.precio;

  const handleAgregar = () => {
    if (agregarAlCarrito(producto, cantidad)) setAbrirCarrito(true);
  };

  return (
    <div className="seccion" data-testid="vista-producto-detalle">
      <div className="contenedor">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:64 }}>
          {/* Imagen */}
          <div style={{ background:'var(--superficie)', aspectRatio:'4/5', overflow:'hidden' }}>
            <img src={producto.imagen_url} alt={producto.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>

          {/* Detalle */}
          <div style={{ display:'flex', flexDirection:'column', gap:24, paddingTop:16 }}>
            <p className="texto-overline">{producto.categoria.replace('_', ' ')}</p>
            <h1 style={{ fontFamily:'Playfair Display', fontSize:'2.2rem', fontWeight:300, lineHeight:1.2 }} data-testid="producto-nombre">
              {producto.nombre}
            </h1>

            <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
              <span style={{ fontSize:'1.8rem', fontWeight:400 }} data-testid="producto-precio">
                ${producto.precio.toLocaleString('es-AR')}
              </span>
              {tieneDesc && <span className="precio-tachado" style={{ fontSize:'1rem' }}>${producto.precio_anterior.toLocaleString('es-AR')}</span>}
            </div>

            <p style={{ color:'var(--texto-tenue)', lineHeight:1.8 }}>{producto.descripcion}</p>

            <div style={{ display:'flex', alignItems:'center', gap:16, paddingTop:16, borderTop:'1px solid var(--borde)' }}>
              <span className="label-limpio" style={{ marginBottom:0 }}>Cantidad</span>
              <div style={{ display:'flex', alignItems:'center', border:'1px solid var(--borde)' }}>
                <button onClick={() => setCantidad(Math.max(1, cantidad-1))} data-testid="cantidad-menos" style={{ background:'none', border:'none', width:40, height:40, cursor:'pointer' }}><Minus size={14}/></button>
                <span style={{ width:40, textAlign:'center' }} data-testid="cantidad-valor">{cantidad}</span>
                <button onClick={() => setCantidad(cantidad+1)} data-testid="cantidad-mas" style={{ background:'none', border:'none', width:40, height:40, cursor:'pointer' }}><Plus size={14}/></button>
              </div>
              <span style={{ fontSize:'0.85rem', color:'var(--texto-tenue)' }}>Stock: {producto.stock}</span>
            </div>

            <div style={{ display:'flex', gap:12 }}>
              <button className="boton-primario" style={{ flex:1 }} onClick={handleAgregar} data-testid="agregar-carrito-btn">Agregar al Carrito</button>
              <button className="boton-secundario" onClick={() => toggleFavorito(producto)} data-testid="toggle-favorito-btn" style={{ padding:'13px 18px' }}>
                <Heart size={18} strokeWidth={1.5} fill={esFav ? 'var(--primario)' : 'none'} />
              </button>
            </div>

            {/* Stand del vendedor */}
            {producto.vendedor && producto.vendedor.nombre_stand && (
              <Link to={`/stand/${producto.vendedor.usuario_id}`} data-testid="link-stand-vendedor" style={{ border:'1px solid var(--borde)', padding:24, background:'var(--superficie)', marginTop:16, display:'flex', gap:16, alignItems:'center' }}>
                <img src={producto.vendedor.avatar_url} alt={producto.vendedor.nombre_stand} style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', filter:'grayscale(100%)' }} />
                <div style={{ flex:1 }}>
                  <p className="texto-overline" style={{ marginBottom:4 }}>Vendido por</p>
                  <p style={{ fontWeight:500 }}>{producto.vendedor.nombre_stand}</p>
                  <p style={{ fontSize:'0.85rem', color:'var(--texto-tenue)', display:'flex', alignItems:'center', gap:6 }}>
                    <MapPin size={12} /> {producto.vendedor.provincia}, {producto.vendedor.ciudad}
                  </p>
                </div>
              </Link>
            )}

            {/* Fichas acordeón */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display:'flex', gap: 32, borderBottom:'1px solid var(--borde)' }}>
                {['descripcion', 'beneficios', 'modo_uso', 'ingredientes'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setPestaña(tab)}
                    data-testid={`tab-${tab}`}
                    style={{
                      background:'none', border:'none', cursor:'pointer',
                      padding:'14px 0',
                      fontSize:'0.75rem', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:500,
                      borderBottom: pestaña === tab ? '2px solid var(--primario)' : '2px solid transparent',
                      color: pestaña === tab ? 'var(--primario)' : 'var(--texto-tenue)',
                      fontFamily:'Outfit'
                    }}
                  >
                    {tab === 'modo_uso' ? 'Modo de Uso' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ padding:'24px 0', color:'var(--texto-tenue)', lineHeight:1.8, fontSize:'0.95rem' }} data-testid={`contenido-${pestaña}`}>
                {pestaña === 'descripcion' && producto.descripcion}
                {pestaña === 'beneficios' && (producto.beneficios || 'Sin información.')}
                {pestaña === 'modo_uso' && (producto.modo_uso || 'Sin información.')}
                {pestaña === 'ingredientes' && (producto.ingredientes || 'Sin información.')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
