import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { usarApp } from '../App';

export default function CarritoLateral() {
  const { abrirCarrito, setAbrirCarrito, carrito, quitarDelCarrito, actualizarCantidad, usuario } = usarApp();
  const navigate = useNavigate();

  if (!abrirCarrito) return null;

  const subtotal = carrito.reduce((a, i) => a + i.producto.precio * i.cantidad, 0);
  const envio = carrito.reduce((a, i) => a + (i.producto.envio_costo || 0), 0);
  const total = subtotal + envio;

  return (
    <>
      <div className="overlay-carrito" onClick={() => setAbrirCarrito(false)} data-testid="overlay-carrito" />
      <div className="drawer-carrito" data-testid="drawer-carrito">
        <div style={{ padding:'24px 28px', borderBottom:'1px solid var(--borde)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontFamily:'Playfair Display', fontSize:'1.4rem', fontWeight:400 }}>Tu Carrito</h3>
          <button onClick={() => setAbrirCarrito(false)} data-testid="cerrar-carrito-btn" style={{ background:'none', border:'none', cursor:'pointer' }}>
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'12px 28px' }}>
          {carrito.length === 0 ? (
            <p style={{ color:'var(--texto-tenue)', textAlign:'center', padding:'60px 0' }} data-testid="carrito-vacio">Tu carrito está vacío</p>
          ) : (
            carrito.map(item => (
              <div key={item.producto.id} data-testid={`item-carrito-${item.producto.id}`} style={{ display:'flex', gap:16, padding:'20px 0', borderBottom:'1px solid var(--borde)' }}>
                <img src={item.producto.imagen_url} alt={item.producto.nombre} style={{ width:80, height:100, objectFit:'cover' }} />
                <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <div>
                    <p style={{ fontSize:'0.95rem', fontWeight:500 }}>{item.producto.nombre}</p>
                    <p style={{ fontSize:'0.85rem', color:'var(--texto-tenue)' }}>${item.producto.precio.toLocaleString('es-AR')}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)} data-testid={`decrementar-${item.producto.id}`} style={{ background:'none', border:'1px solid var(--borde)', width:28, height:28, cursor:'pointer' }}><Minus size={14}/></button>
                    <span>{item.cantidad}</span>
                    <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)} data-testid={`incrementar-${item.producto.id}`} style={{ background:'none', border:'1px solid var(--borde)', width:28, height:28, cursor:'pointer' }}><Plus size={14}/></button>
                    <button onClick={() => quitarDelCarrito(item.producto.id)} data-testid={`quitar-${item.producto.id}`} style={{ background:'none', border:'none', marginLeft:'auto', cursor:'pointer' }}><Trash2 size={16} strokeWidth={1.5} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {carrito.length > 0 && (
          <div style={{ padding:'24px 28px', borderTop:'1px solid var(--borde)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom:8 }}>
              <span>Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom:12, color:'var(--texto-tenue)' }}>
              <span>Envío</span><span>${envio.toLocaleString('es-AR')}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'1.1rem', fontWeight:500, marginBottom:20 }} data-testid="carrito-total">
              <span>Total</span><span>${total.toLocaleString('es-AR')}</span>
            </div>
            <button className="boton-primario" style={{ width:'100%' }} data-testid="ir-a-checkout-btn" onClick={() => { setAbrirCarrito(false); navigate('/checkout'); }}>
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </>
  );
}
