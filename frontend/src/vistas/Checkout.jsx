import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API, usarApp } from '../App';

export default function Checkout() {
  const { usuario, token, carrito } = usarApp();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [datos, setDatos] = useState({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
    telefono: '',
    direccion: '',
    provincia: usuario?.provincia || '',
    ciudad: usuario?.ciudad || '',
    codigo_postal: ''
  });

  const actualizar = (k, v) => setDatos(d => ({ ...d, [k]: v }));

  const subtotal = carrito.reduce((a, i) => a + i.producto.precio * i.cantidad, 0);
  const envio = carrito.reduce((a, i) => a + (i.producto.envio_costo || 0), 0);
  const total = subtotal + envio;

  if (!usuario) {
    return (
      <div className="seccion" style={{ textAlign:'center' }}>
        <div className="contenedor">
          <h1 className="titulo-seccion">Checkout</h1>
          <p style={{ color:'var(--texto-tenue)', margin:'24px 0' }}>Iniciá sesión para continuar</p>
          <Link to="/ingresar" className="boton-primario">Ingresar</Link>
        </div>
      </div>
    );
  }

  if (carrito.length === 0) {
    return (
      <div className="seccion" style={{ textAlign:'center' }}>
        <div className="contenedor">
          <h1 className="titulo-seccion">Checkout</h1>
          <p style={{ color:'var(--texto-tenue)', margin:'24px 0' }}>Tu carrito está vacío</p>
          <Link to="/" className="boton-primario">Seguir Comprando</Link>
        </div>
      </div>
    );
  }

  const pagar = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const items = carrito.map(i => ({ producto_id: i.producto.id, cantidad: i.cantidad }));
      const res = await axios.post(
        `${API}/pedidos/crear-preferencia`,
        { items, datos_envio: datos },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Redirigir a Mercado Pago
      if (res.data.init_point) {
        window.location.href = res.data.init_point;
      } else {
        toast.error('No se obtuvo el link de pago');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear pago');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="seccion" data-testid="vista-checkout">
      <div className="contenedor">
        <p className="texto-overline" style={{ marginBottom: 8 }}>Finalizar compra</p>
        <h1 className="titulo-seccion" style={{ marginBottom: 48 }}>Datos de Envío</h1>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap: 64 }}>
          <form onSubmit={pagar} style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div>
              <label className="label-limpio">Nombre completo *</label>
              <input required value={datos.nombre} onChange={e => actualizar('nombre', e.target.value)} className="input-limpio" data-testid="checkout-nombre"/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label className="label-limpio">Email *</label>
                <input required type="email" value={datos.email} onChange={e => actualizar('email', e.target.value)} className="input-limpio" data-testid="checkout-email"/>
              </div>
              <div>
                <label className="label-limpio">Celular *</label>
                <input required value={datos.telefono} onChange={e => actualizar('telefono', e.target.value)} className="input-limpio" data-testid="checkout-telefono"/>
              </div>
            </div>
            <div>
              <label className="label-limpio">Dirección *</label>
              <input required value={datos.direccion} onChange={e => actualizar('direccion', e.target.value)} className="input-limpio" data-testid="checkout-direccion"/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
              <div>
                <label className="label-limpio">Provincia *</label>
                <input required value={datos.provincia} onChange={e => actualizar('provincia', e.target.value)} className="input-limpio" data-testid="checkout-provincia"/>
              </div>
              <div>
                <label className="label-limpio">Ciudad *</label>
                <input required value={datos.ciudad} onChange={e => actualizar('ciudad', e.target.value)} className="input-limpio" data-testid="checkout-ciudad"/>
              </div>
              <div>
                <label className="label-limpio">C.P. *</label>
                <input required value={datos.codigo_postal} onChange={e => actualizar('codigo_postal', e.target.value)} className="input-limpio" data-testid="checkout-cp"/>
              </div>
            </div>
            <button type="submit" className="boton-primario" disabled={cargando} data-testid="btn-pagar" style={{ marginTop: 16 }}>
              {cargando ? 'Procesando...' : 'Pagar con Mercado Pago'}
            </button>
          </form>

          <div style={{ background:'var(--superficie)', padding:32 }}>
            <h3 style={{ fontFamily:'Playfair Display', fontSize:'1.4rem', fontWeight:400, marginBottom:24 }}>Tu pedido</h3>
            {carrito.map(item => (
              <div key={item.producto.id} style={{ display:'flex', gap:12, padding:'16px 0', borderBottom:'1px solid var(--borde)' }}>
                <img src={item.producto.imagen_url} alt={item.producto.nombre} style={{ width:60, height:75, objectFit:'cover' }}/>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:'0.9rem', fontWeight:500 }}>{item.producto.nombre}</p>
                  <p style={{ fontSize:'0.8rem', color:'var(--texto-tenue)' }}>Cant: {item.cantidad} × ${item.producto.precio.toLocaleString('es-AR')}</p>
                </div>
                <span style={{ fontSize:'0.9rem' }}>${(item.producto.precio * item.cantidad).toLocaleString('es-AR')}</span>
              </div>
            ))}
            <div style={{ marginTop: 24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom:6 }}>
                <span>Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom:12, color:'var(--texto-tenue)' }}>
                <span>Envío</span><span>${envio.toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'1.1rem', fontWeight:500, paddingTop:12, borderTop:'1px solid var(--borde)' }}>
                <span>Total</span><span data-testid="checkout-total">${total.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
