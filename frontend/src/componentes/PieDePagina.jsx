import React from 'react';
import { Link } from 'react-router-dom';

export default function PieDePagina() {
  return (
    <footer style={{ background:'var(--superficie)', padding:'72px 24px 32px', marginTop: 80 }} data-testid="footer">
      <div className="contenedor" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:48, marginBottom: 48 }}>
        <div>
          <h4 style={{ fontFamily:'Playfair Display', fontSize:'1.6rem', fontWeight:400, marginBottom:16 }}>Beauty Moon</h4>
          <p style={{ fontSize:'0.85rem', color:'var(--texto-tenue)', lineHeight:1.7 }}>
            La feria digital de productos Avón. Encontrá lo mejor al mejor precio cerca tuyo.
          </p>
        </div>
        <div>
          <p className="texto-overline" style={{ marginBottom:16 }}>Categorías</p>
          <ul style={{ listStyle:'none', padding:0, fontSize:'0.88rem', lineHeight:2 }}>
            <li><Link to="/categoria/perfumeria" style={{ color:'var(--texto)'}}>Perfumería</Link></li>
            <li><Link to="/categoria/maquillaje" style={{ color:'var(--texto)'}}>Maquillaje</Link></li>
            <li><Link to="/categoria/rostro" style={{ color:'var(--texto)'}}>Rostro</Link></li>
            <li><Link to="/categoria/cuidado_corporal" style={{ color:'var(--texto)'}}>Cuidado Corporal</Link></li>
          </ul>
        </div>
        <div>
          <p className="texto-overline" style={{ marginBottom:16 }}>Ayuda</p>
          <ul style={{ listStyle:'none', padding:0, fontSize:'0.88rem', lineHeight:2, color:'var(--texto-tenue)' }}>
            <li>Envíos y devoluciones</li>
            <li>Formas de pago</li>
            <li>Preguntas frecuentes</li>
            <li>Términos y condiciones</li>
          </ul>
        </div>
        <div>
          <p className="texto-overline" style={{ marginBottom:16 }}>Vender en Beauty Moon</p>
          <p style={{ fontSize:'0.88rem', color:'var(--texto-tenue)', lineHeight:1.7, marginBottom:16 }}>
            ¿Sos asesora Avón? Registrate como vendedora y tené tu stand digital.
          </p>
          <Link to="/registro" className="enlace-nav">Crear mi stand →</Link>
        </div>
      </div>
      <div style={{ borderTop:'1px solid var(--borde)', paddingTop: 24, textAlign:'center', fontSize:'0.8rem', color:'var(--texto-tenue)' }}>
        © 2026 Beauty Moon · Marketplace independiente de productos Avón
      </div>
    </footer>
  );
}
