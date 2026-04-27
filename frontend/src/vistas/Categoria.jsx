import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API, usarApp } from '../App';
import TarjetaProducto from '../componentes/TarjetaProducto';

const nombresCat = {
  perfumeria: 'Perfumería',
  maquillaje: 'Maquillaje',
  rostro: 'Rostro',
  cuidado_corporal: 'Cuidado Corporal'
};

export default function Categoria() {
  const { slug } = useParams();
  const { usuario } = usarApp();
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [orden, setOrden] = useState('precio');
  const [busqueda, setBusqueda] = useState('');
  const porPagina = 12;

  const cargar = () => {
    const params = {
      categoria: slug,
      orden,
      pagina,
      por_pagina: porPagina,
      busqueda: busqueda || undefined,
      provincia_usuario: usuario?.provincia || undefined
    };
    axios.get(`${API}/productos`, { params }).then(r => {
      setProductos(r.data.productos);
      setTotal(r.data.total);
    });
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [slug, orden, pagina, busqueda]);

  const totalPaginas = Math.ceil(total / porPagina);

  return (
    <div className="seccion" data-testid="vista-categoria">
      <div className="contenedor">
        <p className="texto-overline" style={{ marginBottom: 8 }}>Catálogo</p>
        <h1 className="titulo-seccion" style={{ marginBottom: 36 }}>{nombresCat[slug] || slug}</h1>

        <div style={{ display:'flex', gap:16, marginBottom: 40, flexWrap:'wrap', alignItems:'center', paddingBottom:24, borderBottom:'1px solid var(--borde)' }}>
          <input
            placeholder="Buscar producto..."
            className="input-limpio"
            style={{ maxWidth: 320 }}
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
            data-testid="input-busqueda"
          />
          <select value={orden} onChange={e => setOrden(e.target.value)} data-testid="select-orden" style={{ background:'transparent', border:'none', borderBottom:'1px solid var(--borde)', padding:'12px 0', fontSize:'0.85rem', fontFamily:'Outfit', letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
            <option value="precio">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
            <option value="vendidos">Más vendidos</option>
          </select>
          <span style={{ marginLeft:'auto', fontSize:'0.85rem', color:'var(--texto-tenue)' }} data-testid="total-resultados">{total} productos</span>
        </div>

        <div className="grilla-productos">
          {productos.map(p => <TarjetaProducto key={p.id} producto={p} />)}
        </div>

        {productos.length === 0 && (
          <p style={{ textAlign:'center', padding:'80px 0', color:'var(--texto-tenue)' }} data-testid="sin-resultados">
            No se encontraron productos
          </p>
        )}

        {totalPaginas > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop: 64 }} data-testid="paginacion">
            {Array.from({ length: totalPaginas }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPagina(i+1)}
                data-testid={`pagina-${i+1}`}
                style={{
                  width:40, height:40,
                  background: pagina === i+1 ? 'var(--primario)' : 'transparent',
                  color: pagina === i+1 ? '#fff' : 'var(--primario)',
                  border:'1px solid var(--borde)',
                  cursor:'pointer',
                  fontSize:'0.85rem'
                }}
              >{i+1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
