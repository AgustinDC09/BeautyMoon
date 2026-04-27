# Beauty Moon - Marketplace de Productos Avón

> Plataforma web "feria digital" donde vendedores independientes de Avón tienen su stand virtual.

## Stack Tecnológico

- **Frontend:** React 19 + React Router (estructura y nombres en español)
- **Backend:** FastAPI (equivalente funcional al "servidor" Node.js)
- **Base de datos:** MongoDB (Motor async)
- **Autenticación:** JWT con 3 roles (cliente, vendedor, admin)
- **Pagos:** Mercado Pago Checkout Pro
- **Idioma:** Español Latinoamericano

> **Nota técnica:** El proyecto originalmente solicitaba HTML/CSS/JS Vanilla + Node.js. Por restricciones de la plataforma (supervisor readonly), se utilizó React + FastAPI manteniendo nombres, estructura, idioma y funcionalidades en español.

## Estructura del proyecto

```
/app/
├── backend/
│   ├── server.py              # API FastAPI (servidor)
│   ├── requirements.txt
│   └── .env                   # MONGO_URL, JWT_SECRET, MP_ACCESS_TOKEN
└── frontend/
    └── src/
        ├── App.js             # Router + ContextoApp
        ├── index.css          # Estilos globales (Playfair + Outfit)
        ├── componentes/
        │   ├── Navegacion.jsx
        │   ├── CarritoLateral.jsx
        │   ├── TarjetaProducto.jsx
        │   └── PieDePagina.jsx
        └── vistas/
            ├── Inicio.jsx
            ├── Categoria.jsx
            ├── ProductoDetalle.jsx
            ├── Ingresar.jsx
            ├── Registro.jsx
            ├── Favoritos.jsx
            ├── Checkout.jsx
            ├── PagoResultado.jsx
            ├── PanelVendedor.jsx
            ├── PanelAdmin.jsx
            └── StandPublico.jsx
```

## Funcionalidades

### Usuario / Cliente
- Búsqueda con filtros por categoría
- Ordenamiento: **Mejor Precio > Menor Distancia > Costo de Envío**
- Carrito de compras (vacío al cerrar sesión, requiere registro)
- Favoritos persistentes durante sesión
- Checkout con Mercado Pago

### Vendedor (Asesora Avón)
- ABM completo de productos (Labiales, Cremas Anew, Perfumes Far Away, etc.)
- Stand digital editable (nombre, ubicación, contacto)
- Carga de imágenes por URL

### Administrador
- Dashboard con métricas
- Gestión de vendedoras (activar/desactivar)
- Gestión global de productos

## Categorías
Perfumería · Maquillaje · Rostro · Cuidado Corporal

## Usuarios demo

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@beautymoon.com | admin123 |
| Vendedora | sofia@beautymoon.com | vendedor123 |
| Vendedora | martina@beautymoon.com | vendedor123 |
| Cliente | cliente@beautymoon.com | cliente123 |

## Puesta en marcha local

### Backend
```bash
cd backend
pip install -r requirements.txt
# configurar .env con MONGO_URL, JWT_SECRET, MP_ACCESS_TOKEN
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
# configurar .env con REACT_APP_BACKEND_URL
yarn start
```

### Cargar datos demo
```bash
curl -X POST http://localhost:8001/api/seed/demo
```

## Endpoints principales (todos prefijados con `/api`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /auth/registro | Registro con rol |
| POST | /auth/login | Login JWT |
| GET | /auth/yo | Usuario actual |
| GET | /productos | Listar (filtros + paginación) |
| GET | /productos/destacados | Más vendidos + promociones |
| GET | /productos/:id | Detalle |
| POST/PUT/DELETE | /productos/:id | CRUD vendedor |
| GET | /vendedor/mi-stand | Stand del vendedor |
| PUT | /vendedor/mi-stand | Editar stand |
| GET | /vendedores/:id | Stand público |
| GET/POST/DELETE | /favoritos | Favoritos |
| POST | /pedidos/crear-preferencia | Genera preferencia MP |
| POST | /pedidos/webhook | Webhook MP |
| GET | /admin/resumen | Dashboard |
| GET | /admin/vendedores | Listado |
| PUT | /admin/vendedores/:id/toggle | Activar/desactivar |
| POST | /seed/demo | Cargar datos demo (idempotente) |

## Test cards Mercado Pago (sandbox)

- Mastercard: `5031 7557 3453 0604` · 11/30 · CVV 123
- Titular `APRO` para aprobar, `OTHE` para rechazar
- DNI: 12345678

---
© 2026 Beauty Moon
