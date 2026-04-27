import React, { useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { usarApp } from '../App';

export default function PagoResultado() {
  const { resultado } = useParams();
  const { setCarrito } = usarApp();

  useEffect(() => {
    if (resultado === 'exito') setCarrito([]);
  }, [resultado, setCarrito]);

  const config = {
    exito: { icon: CheckCircle2, titulo: '¡Pago Aprobado!', texto: 'Tu pedido fue confirmado. Te enviamos un email con los detalles.', color: 'var(--exito)' },
    error: { icon: XCircle, titulo: 'Pago Rechazado', texto: 'No pudimos procesar tu pago. Intentá de nuevo.', color: 'var(--error)' },
    pendiente: { icon: Clock, titulo: 'Pago Pendiente', texto: 'Tu pago está siendo procesado. Te notificaremos cuando se acredite.', color: 'var(--acento)' }
  };
  const { icon: Icon, titulo, texto, color } = config[resultado] || config.pendiente;

  return (
    <div className="seccion" style={{ textAlign:'center', minHeight:'70vh' }} data-testid={`vista-pago-${resultado}`}>
      <div className="contenedor" style={{ maxWidth: 600, margin:'0 auto' }}>
        <Icon size={72} strokeWidth={1} color={color} style={{ margin:'0 auto 24px', display:'block' }} />
        <h1 style={{ fontFamily:'Playfair Display', fontSize:'2.4rem', fontWeight:300, marginBottom: 16 }}>{titulo}</h1>
        <p style={{ color:'var(--texto-tenue)', marginBottom: 36, lineHeight: 1.8 }}>{texto}</p>
        <Link to="/" className="boton-primario" data-testid="volver-inicio-btn">Volver al Inicio</Link>
      </div>
    </div>
  );
}
