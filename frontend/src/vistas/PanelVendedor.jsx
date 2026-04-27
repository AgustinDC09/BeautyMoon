import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API, usarApp } from '../App';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const CATEGORIAS = ['perfumeria', 'maquillaje', 'rostro', 'cuidado_corporal'];

const productoVacio = {
  nombre: '', categoria: 'perfumeria', subcategoria: '', precio: 0, precio_anterior: null,
  descripcion: '', beneficios: '', modo_uso: '', ingredientes: '', imagen_url: '',
  stock: 0, envio_costo: 0, destacado: false
};

export default function PanelVendedor() {
  const { usuario, token } = usarApp();
  const [productos, setProductos] = useState([]);
  const [stand, setStand] = useState(null);
  const [tab, setTab] = useState('productos');
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState(productoVacio);

  const headers = { Authorization: `Bearer ${token}` };

  const cargar = async () => {
    const [prods, st] = await Promise.all([
      axios.get(`${API}/vendedor/mis-productos`, { headers }),
      axios.get(`${API}/vendedor/mi-stand`, { headers })
    ]);
    setProductos(prods.data);
    setStand(st.data);
  };

  useEffect(() => { if (usuario) cargar(); /* eslint-disable-next-line */ }, [usuario]);

  if (!usuario) return <Navigate to="/ingresar" />;
  if (usuario.rol !== 'vendedor' && usuario.rol !== 'admin') return <Navigate to="/" />;

  const nuevoProducto = () => { setFormulario(productoVacio); setEditando('nuevo'); };
  const editarProducto = (p) => { setFormulario(p); setEditando(p.id); };
  const cancelar = () => { setEditando(null); setFormulario(productoVacio); };

  const guardarProducto = async () => {
    try {
      const payload = { ...formulario, precio: parseFloat(formulario.precio), stock: parseInt(formulario.stock), envio_costo: parseFloat(formulario.envio_costo || 0) };
      if (payload.precio_anterior === '' || payload.precio_anterior === null) payload.precio_anterior = null;
      else payload.precio_anterior = parseFloat(payload.precio_anterior);
      if (editando === 'nuevo') {
        await axios.post(`${API}/productos`, payload, { headers });
        toast.success('Producto creado');
      } else {
        await axios.put(`${API}/productos/${editando}`, payload, { headers });
        toast.success('Producto actualizado');
      }
      cancelar();
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar');
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    await axios.delete(`${API}/productos/${id}`, { headers });
    toast.success('Producto eliminado');
    cargar();
  };

  const guardarStand = async () => {
    await axios.put(`${API}/vendedor/mi-stand`, stand, { headers });
    toast.success('Stand actualizado');
  };

  const act = (k, v) => setFormulario(f => ({ ...f, [k]: v }));

  return (
    <div className="panel-admin" data-testid="vista-panel-vendedor">
      <div className="contenedor">
        <p className="texto-overline" style={{ marginBottom: 8 }}>Vendedora</p>
        <h1 className="titulo-seccion" style={{ marginBottom: 36 }}>Mi Panel</h1>

        <div style={{ display:'flex', gap: 32, borderBottom:'1px solid var(--borde)', marginBottom: 32 }}>
          {[{v:'productos', t:'Mis Productos'}, {v:'stand', t:'Mi Stand'}].map(o => (
            <button key={o.v} onClick={() => setTab(o.v)} data-testid={`tab-panel-${o.v}`}
              style={{ background:'none', border:'none', cursor:'pointer', padding:'14px 0',
                fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:500,
                borderBottom: tab === o.v ? '2px solid var(--primario)' : '2px solid transparent',
                color: tab === o.v ? 'var(--primario)' : 'var(--texto-tenue)' }}>
              {o.t}
            </button>
          ))}
        </div>

        {tab === 'productos' && (
          <div>
            {editando ? (
              <div style={{ background:'#fff', padding:32, border:'1px solid var(--borde)' }}>
                <h3 style={{ fontFamily:'Playfair Display', fontSize:'1.3rem', marginBottom:24 }}>
                  {editando === 'nuevo' ? 'Nuevo Producto' : 'Editar Producto'}
                </h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:24 }}>
                  <div><label className="label-limpio">Nombre</label><input className="input-limpio" value={formulario.nombre} onChange={e => act('nombre', e.target.value)} data-testid="prod-nombre"/></div>
                  <div><label className="label-limpio">Categoría</label>
                    <select className="input-limpio" value={formulario.categoria} onChange={e => act('categoria', e.target.value)} data-testid="prod-categoria">
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div><label className="label-limpio">Precio</label><input type="number" className="input-limpio" value={formulario.precio} onChange={e => act('precio', e.target.value)} data-testid="prod-precio"/></div>
                  <div><label className="label-limpio">Precio anterior (opcional)</label><input type="number" className="input-limpio" value={formulario.precio_anterior || ''} onChange={e => act('precio_anterior', e.target.value)}/></div>
                  <div><label className="label-limpio">Stock</label><input type="number" className="input-limpio" value={formulario.stock} onChange={e => act('stock', e.target.value)} data-testid="prod-stock"/></div>
                  <div><label className="label-limpio">Costo envío</label><input type="number" className="input-limpio" value={formulario.envio_costo} onChange={e => act('envio_costo', e.target.value)}/></div>
                  <div style={{ gridColumn:'1/-1' }}><label className="label-limpio">URL de imagen</label><input className="input-limpio" value={formulario.imagen_url} onChange={e => act('imagen_url', e.target.value)} placeholder="https://..." data-testid="prod-imagen"/></div>
                  <div style={{ gridColumn:'1/-1' }}><label className="label-limpio">Descripción</label><textarea className="input-limpio" rows={2} value={formulario.descripcion} onChange={e => act('descripcion', e.target.value)} data-testid="prod-descripcion"/></div>
                  <div style={{ gridColumn:'1/-1' }}><label className="label-limpio">Beneficios</label><textarea className="input-limpio" rows={2} value={formulario.beneficios} onChange={e => act('beneficios', e.target.value)}/></div>
                  <div style={{ gridColumn:'1/-1' }}><label className="label-limpio">Modo de uso</label><textarea className="input-limpio" rows={2} value={formulario.modo_uso} onChange={e => act('modo_uso', e.target.value)}/></div>
                  <div style={{ gridColumn:'1/-1' }}><label className="label-limpio">Ingredientes</label><textarea className="input-limpio" rows={2} value={formulario.ingredientes} onChange={e => act('ingredientes', e.target.value)}/></div>
                  <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={formulario.destacado} onChange={e => act('destacado', e.target.checked)} data-testid="prod-destacado"/>
                    <span style={{ fontSize:'0.85rem' }}>Destacado (promociones del día)</span>
                  </label>
                </div>
                <div style={{ display:'flex', gap:12, marginTop: 24 }}>
                  <button onClick={guardarProducto} className="boton-primario" data-testid="guardar-producto-btn"><Save size={16} style={{ display:'inline', marginRight:8 }}/>Guardar</button>
                  <button onClick={cancelar} className="boton-secundario" data-testid="cancelar-producto-btn">Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <button onClick={nuevoProducto} className="boton-primario" style={{ marginBottom: 24 }} data-testid="nuevo-producto-btn"><Plus size={16} style={{ display:'inline', marginRight: 8 }}/>Nuevo producto</button>
                <table className="tabla-limpia" data-testid="tabla-mis-productos">
                  <thead>
                    <tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Vendidos</th><th></th></tr>
                  </thead>
                  <tbody>
                    {productos.map(p => (
                      <tr key={p.id}>
                        <td style={{ display:'flex', alignItems:'center', gap:12 }}><img src={p.imagen_url} alt="" style={{ width:40, height:40, objectFit:'cover' }}/>{p.nombre}</td>
                        <td>{p.categoria}</td>
                        <td>${p.precio.toLocaleString('es-AR')}</td>
                        <td>{p.stock}</td>
                        <td>{p.vendidos}</td>
                        <td>
                          <button onClick={() => editarProducto(p)} style={{ background:'none', border:'none', cursor:'pointer', marginRight:8 }} data-testid={`editar-${p.id}`}><Edit2 size={16}/></button>
                          <button onClick={() => eliminar(p.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--error)' }} data-testid={`eliminar-${p.id}`}><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {productos.length === 0 && <p style={{ textAlign:'center', padding:40, color:'var(--texto-tenue)' }}>Aún no cargaste productos</p>}
              </>
            )}
          </div>
        )}

        {tab === 'stand' && stand && (
          <div style={{ background:'#fff', padding:32, border:'1px solid var(--borde)', maxWidth: 720 }}>
            <h3 style={{ fontFamily:'Playfair Display', fontSize:'1.3rem', marginBottom:24 }}>Mi Stand Digital</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <div style={{ gridColumn:'1/-1' }}><label className="label-limpio">Nombre del stand</label><input className="input-limpio" value={stand.nombre_stand} onChange={e => setStand({...stand, nombre_stand: e.target.value})} data-testid="stand-nombre"/></div>
              <div style={{ gridColumn:'1/-1' }}><label className="label-limpio">Descripción</label><textarea className="input-limpio" rows={3} value={stand.descripcion} onChange={e => setStand({...stand, descripcion: e.target.value})}/></div>
              <div><label className="label-limpio">Teléfono</label><input className="input-limpio" value={stand.telefono} onChange={e => setStand({...stand, telefono: e.target.value})}/></div>
              <div><label className="label-limpio">Provincia</label><input className="input-limpio" value={stand.provincia} onChange={e => setStand({...stand, provincia: e.target.value})}/></div>
              <div><label className="label-limpio">Ciudad</label><input className="input-limpio" value={stand.ciudad} onChange={e => setStand({...stand, ciudad: e.target.value})}/></div>
              <div><label className="label-limpio">URL Avatar</label><input className="input-limpio" value={stand.avatar_url} onChange={e => setStand({...stand, avatar_url: e.target.value})}/></div>
            </div>
            <button onClick={guardarStand} className="boton-primario" style={{ marginTop: 24 }} data-testid="guardar-stand-btn">Guardar Cambios</button>
          </div>
        )}
      </div>
    </div>
  );
}
