import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, User, Menu, Search, LogOut } from 'lucide-react';
import { usarApp } from '../App';

export default function Navegacion() {
  const { usuario, carrito, setAbrirCarrito, cerrarSesion } = usarApp();
  const navigate = useNavigate();
  const totalItems = carrito.reduce((a, i) => a + i.cantidad, 0);

  return (
    <nav className="navegacion" data-testid="navegacion-principal">
      <div className="contenedor" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px' }}>
        <Link to="/" style={{ fontFamily:'Playfair Display', fontSize:'1.5rem', fontWeight: 500, letterSpacing:'0.02em', color:'var(--primario)' }} data-testid="logo-link">
          Beauty Moon
        </Link>

        <div style={{ display:'none', gap:'32px' }} className="nav-links">
          <Link to="/categoria/perfumeria" className="enlace-nav" data-testid="nav-perfumeria">Perfumería</Link>
          <Link to="/categoria/maquillaje" className="enlace-nav" data-testid="nav-maquillaje">Maquillaje</Link>
          <Link to="/categoria/rostro" className="enlace-nav" data-testid="nav-rostro">Rostro</Link>
          <Link to="/categoria/cuidado_corporal" className="enlace-nav" data-testid="nav-cuidado-corporal">Cuidado Corporal</Link>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'18px' }}>
          {usuario ? (
            <>
              <span style={{ fontSize:'0.75rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--texto-tenue)' }} data-testid="usuario-nombre">
                {usuario.nombre.split(' ')[0]}
              </span>
              {usuario.rol === 'vendedor' && (
                <Link to="/panel-vendedor" className="enlace-nav" data-testid="nav-panel-vendedor">Mi Stand</Link>
              )}
              {usuario.rol === 'admin' && (
                <Link to="/panel-admin" className="enlace-nav" data-testid="nav-panel-admin">Admin</Link>
              )}
              <Link to="/favoritos" data-testid="nav-favoritos" aria-label="Favoritos">
                <Heart size={20} strokeWidth={1.5} />
              </Link>
              <button onClick={() => setAbrirCarrito(true)} data-testid="abrir-carrito-btn" style={{ background:'none', border:'none', cursor:'pointer', position:'relative' }} aria-label="Carrito">
                <ShoppingBag size={20} strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span data-testid="carrito-contador" style={{ position:'absolute', top:-8, right:-8, background:'var(--primario)', color:'#fff', borderRadius:'50%', width:18, height:18, fontSize:'0.65rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {totalItems}
                  </span>
                )}
              </button>
              <button onClick={cerrarSesion} data-testid="cerrar-sesion-btn" style={{ background:'none', border:'none', cursor:'pointer' }} aria-label="Cerrar sesión">
                <LogOut size={20} strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <>
              <Link to="/ingresar" className="enlace-nav" data-testid="nav-ingresar">Ingresar</Link>
              <Link to="/registro" className="enlace-nav" data-testid="nav-registro">Registrarse</Link>
            </>
          )}
        </div>
      </div>
      <div className="contenedor" style={{ display:'flex', gap:'24px', padding:'0 24px 16px', overflowX:'auto' }}>
        <Link to="/categoria/perfumeria" className="enlace-nav" data-testid="nav-mobile-perfumeria">Perfumería</Link>
        <Link to="/categoria/maquillaje" className="enlace-nav" data-testid="nav-mobile-maquillaje">Maquillaje</Link>
        <Link to="/categoria/rostro" className="enlace-nav" data-testid="nav-mobile-rostro">Rostro</Link>
        <Link to="/categoria/cuidado_corporal" className="enlace-nav" data-testid="nav-mobile-cuidado-corporal">Cuidado Corporal</Link>
      </div>
      <style>{`@media (min-width: 1024px) { .nav-links { display: flex !important; } .contenedor > div:last-child { display: none; } }`}</style>
    </nav>
  );
}
