import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import TarjetaProducto from '../componentes/TarjetaProducto';
import { ArrowRight } from 'lucide-react';

const categorias = [
  { slug: 'perfumeria', nombre: 'Perfumería', img: 'https://images.pexels.com/photos/3785784/pexels-photo-3785784.jpeg' },
  { slug: 'maquillaje', nombre: 'Maquillaje', img: 'https://images.unsplash.com/photo-1625094640367-05f84293fe42' },
  { slug: 'rostro', nombre: 'Rostro', img: 'https://images.pexels.com/photos/9774655/pexels-photo-9774655.jpeg' },
  { slug: 'cuidado_corporal', nombre: 'Cuidado Corporal', img: 'https://images.unsplash.com/photo-1722247410696-31f0a93eb504' }
];

export default function Inicio() {
  const [datos, setDatos] = useState({ destacados: [], mas_vendidos: [] });

  useEffect(() => {
    axios.get(`${API}/productos/destacados`).then(r => setDatos(r.data)).catch(() => {});
  }, []);

  return (
    <div data-testid="vista-inicio">
      {/* HERO */}
      <section className="hero-seccion">
        <div className="contenedor" style={{ display:'grid', gridTemplateColumns:'1fr', gap:48, alignItems:'center', minHeight:'80vh', padding:'48px 24px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:48, alignItems:'center' }}>
            <div>
              <p className="texto-overline" style={{ marginBottom: 24 }}>Feria digital Avón</p>
              <h1 style={{ fontFamily:'Playfair Display', fontSize:'clamp(2.4rem, 5vw, 4.5rem)', fontWeight:300, lineHeight:1.05, letterSpacing:'-0.02em', marginBottom: 28 }}>
                Belleza sin fronteras,<br/>cerca tuyo.
              </h1>
              <p style={{ fontSize:'1rem', color:'var(--texto-tenue)', lineHeight:1.8, marginBottom:36, maxWidth: 500 }}>
                Descubrí cientos de productos Avón ofrecidos por asesoras independientes. Comprá al mejor precio y recibí en tu casa.
              </p>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <Link to="/categoria/perfumeria" className="boton-primario" data-testid="hero-cta-explorar">Explorar Catálogo</Link>
                <Link to="/registro" className="boton-secundario" data-testid="hero-cta-vendedora">Soy Asesora</Link>
              </div>
            </div>
            <div style={{ position:'relative', aspectRatio:'4/5', maxHeight:600, overflow:'hidden' }}>
              <img src="https://images.pexels.com/photos/2537930/pexels-photo-2537930.jpeg" alt="Beauty Moon" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="seccion">
        <div className="contenedor">
          <div style={{ marginBottom: 48 }}>
            <p className="texto-overline" style={{ marginBottom: 8 }}>Explorá</p>
            <h2 className="titulo-seccion">Nuestras Categorías</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {categorias.map(c => (
              <Link key={c.slug} to={`/categoria/${c.slug}`} data-testid={`categoria-card-${c.slug}`} style={{ display:'block', position:'relative', aspectRatio:'3/4', overflow:'hidden', background:'var(--superficie)' }}>
                <img src={c.img} alt={c.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.8s ease' }} onMouseOver={e => e.target.style.transform='scale(1.08)'} onMouseOut={e => e.target.style.transform='scale(1)'} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />
                <div style={{ position:'absolute', bottom:24, left:24, right:24, color:'#fff' }}>
                  <h3 style={{ fontFamily:'Playfair Display', fontSize:'1.6rem', fontWeight:400, marginBottom:4 }}>{c.nombre}</h3>
                  <p style={{ fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:8 }}>Ver todo <ArrowRight size={14}/></p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MÁS VENDIDOS */}
      {datos.mas_vendidos.length > 0 && (
        <section className="seccion" style={{ background:'var(--superficie)' }}>
          <div className="contenedor">
            <div style={{ marginBottom: 48, display:'flex', alignItems:'end', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
              <div>
                <p className="texto-overline" style={{ marginBottom: 8 }}>Los favoritos</p>
                <h2 className="titulo-seccion">Más Vendidos</h2>
              </div>
              <Link to="/categoria/perfumeria" className="enlace-nav" data-testid="ver-mas-vendidos">Ver todos →</Link>
            </div>
            <div className="grilla-productos">
              {datos.mas_vendidos.map(p => <TarjetaProducto key={p.id} producto={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* PROMOCIONES / DESTACADOS */}
      {datos.destacados.length > 0 && (
        <section className="seccion">
          <div className="contenedor">
            <div style={{ marginBottom: 48 }}>
              <p className="texto-overline" style={{ marginBottom: 8 }}>Oferta especial</p>
              <h2 className="titulo-seccion">Promociones del Día</h2>
            </div>
            <div className="grilla-productos">
              {datos.destacados.slice(0,8).map(p => <TarjetaProducto key={p.id} producto={p} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
