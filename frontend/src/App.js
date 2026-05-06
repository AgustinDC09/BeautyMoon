import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import './App.css';
import Navegacion from './componentes/Navegacion';
import CarritoLateral from './componentes/CarritoLateral';
import Inicio from './vistas/Inicio';
import Categoria from './vistas/Categoria';
import ProductoDetalle from './vistas/ProductoDetalle';
import Ingresar from './vistas/Ingresar';
import Registro from './vistas/Registro';
import Favoritos from './vistas/Favoritos';
import Checkout from './vistas/Checkout';
import PagoResultado from './vistas/PagoResultado';
import PanelVendedor from './vistas/PanelVendedor';
import PanelAdmin from './vistas/PanelAdmin';
import StandPublico from './vistas/StandPublico';
import PieDePagina from './componentes/PieDePagina';
import Recuperar from './vistas/Recuperar';
import ResetPassword from './vistas/ResetPassword';
export const API = `${process.env.REACT_APP_BACKEND_URL}/api`; // sigue apuntando a Emergent
export const API_LOCAL = `${process.env.REACT_APP_LOCAL_URL}/api`; // nuevo backend local
export const ContextoApp = createContext(null);

console.log("API URL:", API);
function AppContenido() {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bm_token') || null);
  const [carrito, setCarrito] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [abrirCarrito, setAbrirCarrito] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Seed demo al iniciar (idempotente)
    axios.post(`${API}/seed/demo`).catch(() => {});
  }, []);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/yo`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setUsuario(res.data);
          // Cargar favoritos
          axios.get(`${API}/favoritos`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setFavoritos(r.data.map(p => p.id)))
            .catch(() => {});
        })
        .catch(() => {
          localStorage.removeItem('bm_token');
          setToken(null);
          setUsuario(null);
        })
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, [token]);

  const iniciarSesion = (nuevoToken, datosUsuario) => {
    localStorage.setItem('bm_token', nuevoToken);
    setToken(nuevoToken);
    setUsuario(datosUsuario);
    toast.success(`¡Bienvenida/o ${datosUsuario.nombre}!`);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('bm_token');
    setToken(null);
    setUsuario(null);
    setCarrito([]);
    setFavoritos([]);
    toast.success('Sesión cerrada');
  };

  const agregarAlCarrito = (producto, cantidad = 1) => {
    if (!usuario) {
      toast.error('Registrate o iniciá sesión para usar el carrito');
      return false;
    }
    setCarrito(prev => {
      const existente = prev.find(i => i.producto.id === producto.id);
      if (existente) {
        return prev.map(i => i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i);
      }
      return [...prev, { producto, cantidad }];
    });
    toast.success('Agregado al carrito');
    return true;
  };

  const quitarDelCarrito = (productoId) => {
    setCarrito(prev => prev.filter(i => i.producto.id !== productoId));
  };

  const actualizarCantidad = (productoId, cantidad) => {
    if (cantidad < 1) return quitarDelCarrito(productoId);
    setCarrito(prev => prev.map(i => i.producto.id === productoId ? { ...i, cantidad } : i));
  };

  const toggleFavorito = async (producto) => {
    if (!usuario) {
      toast.error('Iniciá sesión para usar favoritos');
      return;
    }
    const esFav = favoritos.includes(producto.id);
    const headers = { Authorization: `Bearer ${token}` };
    if (esFav) {
      await axios.delete(`${API}/favoritos/${producto.id}`, { headers });
      setFavoritos(favoritos.filter(id => id !== producto.id));
      toast.success('Quitado de favoritos');
    } else {
      await axios.post(`${API}/favoritos/${producto.id}`, {}, { headers });
      setFavoritos([...favoritos, producto.id]);
      toast.success('Agregado a favoritos');
    }
  };

  const valor = {
    usuario, token, carrito, favoritos, abrirCarrito, cargando,
    setAbrirCarrito, iniciarSesion, cerrarSesion,
    agregarAlCarrito, quitarDelCarrito, actualizarCantidad, toggleFavorito, setCarrito
  };

  if (cargando) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Cargando...</div>;
  }

  return (
    <ContextoApp.Provider value={valor}>
      <Navegacion />
      <CarritoLateral />
      <main>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/categoria/:slug" element={<Categoria />} />
          <Route path="/producto/:id" element={<ProductoDetalle />} />
          <Route path="/ingresar" element={<Ingresar />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pago/:resultado" element={<PagoResultado />} />
          <Route path="/panel-vendedor" element={<PanelVendedor />} />
          <Route path="/panel-admin" element={<PanelAdmin />} />
          <Route path="/stand/:id" element={<StandPublico />} />
          <Route path="/recuperar" element={<Recuperar />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </main>
      <PieDePagina />
      <Toaster position="top-center" richColors />
    </ContextoApp.Provider>
  );
}

export default function App() {
  return <BrowserRouter><AppContenido /></BrowserRouter>;
}

// eslint-disable-next-line react-hooks/rules-of-hooks
export const usarApp = () => useContext(ContextoApp);
