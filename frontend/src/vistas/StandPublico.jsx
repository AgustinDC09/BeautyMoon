import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import TarjetaProducto from '../componentes/TarjetaProducto';
import { MapPin, Phone } from 'lucide-react';

export default function StandPublico() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${API}/vendedores/${id}`).then(r => setData(r.data));
  }, [id]);

  if (!data) return <div style={{ padding:'120px 24px', textAlign:'center' }}>Cargando...</div>;
  const { vendedor, productos } = data;

  return (
    <div data-testid="vista-stand-publico">
      <section style={{ background:'var(--superficie)', padding:'72px 24px' }}>
        <div className="contenedor" style={{ display:'flex', gap:32, alignItems:'center', flexWrap:'wrap' }}>
          <img src={vendedor.avatar_url} alt={vendedor.nombre_stand} style={{ width:140, height:140, borderRadius:'50%', objectFit:'cover', filter:'grayscale(100%)' }} />
          <div style={{ flex:1, minWidth:260 }}>
            <p className="texto-overline" style={{ marginBottom:8 }}>Stand digital</p>
            <h1 style={{ fontFamily:'Playfair Display', fontSize:'2.4rem', fontWeight:300, marginBottom:12 }} data-testid="stand-nombre-publico">{vendedor.nombre_stand}</h1>
            <p style={{ color:'var(--texto-tenue)', lineHeight:1.7, marginBottom:16, maxWidth:600 }}>{vendedor.descripcion}</p>
            <div style={{ display:'flex', gap:24, flexWrap:'wrap', fontSize:'0.88rem', color:'var(--texto-tenue)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:6 }}><MapPin size={14}/> {vendedor.provincia}, {vendedor.ciudad}</span>
              {vendedor.telefono && <span style={{ display:'flex', alignItems:'center', gap:6 }}><Phone size={14}/> {vendedor.telefono}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor">
          <h2 className="titulo-seccion" style={{ marginBottom: 36 }}>Productos</h2>
          <div className="grilla-productos">
            {productos.map(p => <TarjetaProducto key={p.id} producto={p} />)}
          </div>
          {productos.length === 0 && <p style={{ color:'var(--texto-tenue)', textAlign:'center', padding: 40 }}>Aún no hay productos</p>}
        </div>
      </section>
    </div>
  );
}
