# Beauty Moon - PRD

## Problema original
Crear una plataforma web "feria digital" para vendedores independientes de Avón. Permite a usuarios encontrar productos al mejor precio según ubicación y costo de envío. 3 perfiles: Usuario Final, Vendedor, Administrador. Categorías: Perfumería, Maquillaje, Rostro, Cuidado Corporal. Checkout con Mercado Pago. Fichas de producto detalladas estilo L'Oréal.

## Stack final
- React 19 + React Router (frontend)
- FastAPI + Motor MongoDB (backend, equivalente funcional al "servidor" Node.js)
- JWT auth con 3 roles
- Mercado Pago Checkout Pro
- Idioma: Español latinoamericano

## Personas
- **Cliente final**: busca productos Avón al mejor precio cerca suyo
- **Asesora Avón (vendedor)**: gestiona su stand digital y catálogo
- **Administrador**: supervisa la plataforma

## Features implementadas (MVP - 2026-02-28)

### Backend
- Auth completa (registro, login, JWT, /yo)
- Productos: CRUD + filtros + paginación + algoritmo precio/distancia/envío
- Vendedores y stand digital editable
- Favoritos persistentes
- Pedidos + integración Mercado Pago (preferencia + webhook)
- Panel admin: resumen, gestión vendedores, gestión productos
- Seed demo idempotente con 12 productos

### Frontend
- Home con hero, categorías visuales, más vendidos, promociones
- Catálogo por categoría con búsqueda, orden y paginación
- Ficha de producto con tabs (descripción/beneficios/modo_uso/ingredientes) y stand del vendedor
- Carrito lateral (drawer) con incrementar/decrementar
- Login/Registro con selector de rol (cliente/vendedor)
- Checkout con datos de envío y redirección a MP
- Página de resultado de pago (éxito/error/pendiente)
- Panel Vendedor: ABM de productos + edición de stand
- Panel Admin: dashboard, vendedores, productos
- Stand público de vendedor
- Favoritos (con autenticación)
- Diseño minimalista luxury (Playfair Display + Outfit, paleta B&W con acento cobrizo)

## Backlog futuro

### P1
- Geolocalización del navegador para "Menor Distancia" real (actualmente por provincia)
- Reseñas y rating de productos
- Filtros avanzados (rango de precio, marca, vendedor)
- Sistema de notificaciones por email (confirmación de pedido)
- Historial de pedidos del cliente con tracking

### P2
- Sistema de cupones / códigos de descuento
- Programa de puntos / fidelidad
- Chat directo con vendedora
- Comparación de productos
- Wishlist compartible
- Multi-imagen por producto
- Variantes de producto (tamaños, colores)

### P3
- Sora 2 video generation para banners promocionales
- Recomendador de productos con AI
- Dashboard de analytics para vendedoras
- Integración con redes sociales
