import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API, usarApp } from '../App';
import { Users, Package, ShoppingBag, CheckCircle2, Trash2 } from 'lucide-react';

export default function PanelAdmin() {
  const { usuario, token } = usarApp();
  const [resumen, setResumen] = useState(null);
  const [vendedores, setVendedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tab, setTab] = useState('resumen');

  const headers = { Authorization: `Bearer ${token}` };

  const cargar = async () => {
    const [r, v, p] = await Promise.all([
      axios.get(`${API}/admin/resumen`, { headers }),
      axios.get(`${API}/admin/vendedores`, { headers }),
      axios.get(`${API}/admin/productos`, { headers })
    ]);
    setResumen(r.data);
    setVendedores(v.data);
    setProductos(p.data);
  };

  useEffect(() => { if (usuario?.rol === 'admin') cargar(); /* eslint-disable-next-line */ }, [usuario]);

  if (!usuario) return <Navigate to="/ingresar" />;
  if (usuario.rol !== 'admin') return <Navigate to="/" />;

  const toggleVendedor = async (id) => {
    await axios.put(`${API}/admin/vendedores/${id}/toggle`, {}, { headers });
    toast.success('Estado actualizado');
    cargar();
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar producto?')) return;
    await axios.delete(`${API}/admin/productos/${id}`, { headers });
    toast.success('Eliminado');
    cargar();
  };

  const tarjetas = resumen ? [
    { label: 'Usuarios Totales', valor: resumen.total_usuarios, icon: Users },
    { label: 'Vendedoras', valor: resumen.total_vendedores, icon: Users },
    { label: 'Productos', valor: resumen.total_productos, icon: Package },
    { label: 'Pedidos', valor: resumen.total_pedidos, icon: ShoppingBag },
    { label: 'Pedidos Aprobados', valor: resumen.pedidos_aprobados, icon: CheckCircle2 }
  ] : [];

  return (
    <div className="panel-admin" data-testid="vista-panel-admin">
      <div className="contenedor">
        <p className="texto-overline" style={{ marginBottom: 8 }}>Administración</p>
        <h1 className="titulo-seccion" style={{ marginBottom: 36 }}>Dashboard</h1>

        <div style={{ display:'flex', gap: 32, borderBottom:'1px solid var(--borde)', marginBottom: 32 }}>
          {[{v:'resumen', t:'Resumen'}, {v:'vendedores', t:'Vendedoras'}, {v:'productos', t:'Productos'}].map(o => (
            <button key={o.v} onClick={() => setTab(o.v)} data-testid={`tab-admin-${o.v}`}
              style={{ background:'none', border:'none', cursor:'pointer', padding:'14px 0',
                fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:500,
                borderBottom: tab === o.v ? '2px solid var(--primario)' : '2px solid transparent',
                color: tab === o.v ? 'var(--primario)' : 'var(--texto-tenue)' }}>
              {o.t}
            </button>
          ))}
        </div>

        {tab === 'resumen' && resumen && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {tarjetas.map(t => (
              <div key={t.label} style={{ background:'#fff', padding: 28, border:'1px solid var(--borde)' }} data-testid={`tarjeta-${t.label.toLowerCase().replace(/ /g, '-')}`}>
                <t.icon size={24} strokeWidth={1.5} style={{ marginBottom:16, color:'var(--acento)' }}/>
                <p className="texto-overline" style={{ marginBottom: 8 }}>{t.label}</p>
                <p style={{ fontFamily:'Playfair Display', fontSize:'2.4rem', fontWeight:300 }}>{t.valor}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'vendedores' && (
          <table className="tabla-limpia" data-testid="tabla-vendedores">
            <thead><tr><th>Stand</th><th>Email</th><th>Ubicación</th><th>Productos</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {vendedores.map(v => (
                <tr key={v.id}>
                  <td>{v.nombre_stand}</td>
                  <td>{v.email}</td>
                  <td>{v.provincia}, {v.ciudad}</td>
                  <td>{v.productos_count}</td>
                  <td><span style={{ padding:'4px 12px', background: v.activo ? 'var(--acento-suave)' : '#eee', fontSize:'0.75rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>{v.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td><button onClick={() => toggleVendedor(v.usuario_id)} data-testid={`toggle-vendedor-${v.usuario_id}`} className="boton-secundario" style={{ padding:'8px 14px', fontSize:'0.7rem' }}>Toggle</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'productos' && (
          <table className="tabla-limpia" data-testid="tabla-productos-admin">
            <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id}>
                  <td style={{ display:'flex', alignItems:'center', gap:12 }}><img src={p.imagen_url} alt="" style={{ width:40, height:40, objectFit:'cover' }}/>{p.nombre}</td>
                  <td>{p.categoria}</td>
                  <td>${p.precio.toLocaleString('es-AR')}</td>
                  <td>{p.stock}</td>
                  <td><button onClick={() => eliminarProducto(p.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--error)' }} data-testid={`admin-eliminar-${p.id}`}><Trash2 size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
