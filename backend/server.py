"""
Beauty Moon - Marketplace de Productos Avón
Servidor FastAPI con endpoints en español
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os
import uuid
import jwt
import bcrypt
import logging
import mercadopago
import smtplib
from email.mime.text import MIMEText
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from email.mime.multipart import MIMEMultipart
from fastapi.middleware.cors import CORSMiddleware





ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuración
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
MP_ACCESS_TOKEN = os.environ['MP_ACCESS_TOKEN']
APP_URL = os.environ['APP_URL']

# Base de datos
cliente_mongo = AsyncIOMotorClient(MONGO_URL)
db = cliente_mongo[DB_NAME]

# Mercado Pago
sdk_mp = mercadopago.SDK(MP_ACCESS_TOKEN)

# App
app = FastAPI(title="Beauty Moon API")
enrutador = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ MODELOS ============
class RegistroRequest(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    rol: Literal['cliente', 'vendedor', 'admin']
    telefono: Optional[str] = ""
    provincia: Optional[str] = ""
    ciudad: Optional[str] = ""

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ProductoRequest(BaseModel):
    nombre: str
    categoria: Literal['perfumeria', 'maquillaje', 'rostro', 'cuidado_corporal']
    subcategoria: Optional[str] = ""
    precio: float
    precio_anterior: Optional[float] = None
    descripcion: str
    beneficios: str = ""
    modo_uso: str = ""
    ingredientes: str = ""
    imagen_url: str
    stock: int = 0
    envio_costo: float = 0.0
    destacado: bool = False

class StandRequest(BaseModel):
    nombre_stand: str
    descripcion: str = ""
    telefono: str = ""
    provincia: str = ""
    ciudad: str = ""
    avatar_url: str = ""

class ItemCarrito(BaseModel):
    producto_id: str
    cantidad: int

class DatosEnvio(BaseModel):
    nombre: str
    email: EmailStr
    telefono: str
    direccion: str
    provincia: str
    ciudad: str
    codigo_postal: str

class PedidoRequest(BaseModel):
    items: List[ItemCarrito]
    datos_envio: DatosEnvio


# ============ UTILIDADES ============
def hash_password(pwd: str) -> str:
    return bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()

def verificar_password(pwd: str, hashed: str) -> bool:
    return bcrypt.checkpw(pwd.encode(), hashed.encode())

def crear_token(usuario_id: str, rol: str) -> str:
    payload = {
        "sub": usuario_id,
        "rol": rol,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def obtener_usuario_actual(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        usuario = await db.usuarios.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not usuario:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return usuario
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

def requiere_rol(rol_requerido: str):
    async def check(usuario=Depends(obtener_usuario_actual)):
        if usuario["rol"] != rol_requerido and usuario["rol"] != "admin":
            raise HTTPException(status_code=403, detail="Permiso denegado")
        return usuario
    return check


# ============ AUTENTICACIÓN ============
@enrutador.post("/auth/registro")
async def registro(data: RegistroRequest):
    existe = await db.usuarios.find_one({"email": data.email})
    if existe:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    usuario_id = str(uuid.uuid4())
    doc = {
        "id": usuario_id,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "nombre": data.nombre,
        "rol": data.rol,
        "telefono": data.telefono,
        "provincia": data.provincia,
        "ciudad": data.ciudad,
        "creado_en": datetime.now(timezone.utc).isoformat()
    }
    await db.usuarios.insert_one(doc)

    # Si es vendedor, crear stand por defecto
    if data.rol == "vendedor":
        await db.vendedores.insert_one({
            "id": str(uuid.uuid4()),
            "usuario_id": usuario_id,
            "nombre_stand": f"Stand de {data.nombre}",
            "descripcion": "Bienvenido a mi stand de productos Avón",
            "telefono": data.telefono,
            "provincia": data.provincia,
            "ciudad": data.ciudad,
            "avatar_url": "https://images.unsplash.com/photo-1722247410696-31f0a93eb504",
            "activo": True,
            "creado_en": datetime.now(timezone.utc).isoformat()
        })

    token = crear_token(usuario_id, data.rol)
    return {
        "token": token,
        "usuario": {"id": usuario_id, "email": data.email, "nombre": data.nombre, "rol": data.rol}
    }


@enrutador.post("/auth/login")
async def login(data: dict):
    email = data.get("email")
    password = data.get("password")

    usuario = await db["usuarios"].find_one({"email": email})
    if not usuario or usuario.get("password") != password:
        return JSONResponse(
            content={"detail": "Credenciales inválidas"},
            status_code=401
        )

    return {"token": "demo-token-123", "usuario": {"email": email, "nombre": "Demo"}}


@enrutador.get("/auth/yo")
async def yo(usuario=Depends(obtener_usuario_actual)):
    return usuario


# ============ RECUPERAR CONTRASEÑA ============

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    nueva_password: str


def enviar_correo_reset(destinatario: str, token: str):
    enlace = f"{os.environ['APP_URL']}/reset-password?token={token}"
    cuerpo = f"""
    Hola,
    Has solicitado restablecer tu contraseña.
    Haz clic en el siguiente enlace para continuar:

    {enlace}

    Este enlace expira en 30 minutos.
    """
    msg = MIMEText(cuerpo)
    msg["Subject"] = "Recuperar contraseña - Beauty Moon"
    msg["From"] = "no-reply@beautymoon.com"
    msg["To"] = destinatario

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"])
        server.send_message(msg)

@enrutador.post("/auth/forgot-password")
async def forgot_password(data: dict):
    tu_correo = data.get("email")  # usar el email que ingresa el usuario
    token = "demo-token-123"  # token ficticio

    enlace = f"http://localhost:3000/reset-password?token={token}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Recuperación de contraseña - BeautyMoon"
    msg["From"] = "BeautyMoon <agustindiazcontreras4321@gmail.com>"
    msg["To"] = tu_correo

    texto = f"""
Hola,

Recibimos una solicitud para restablecer tu contraseña en BeautyMoon.
Si fuiste vos, hacé clic en el siguiente enlace:

{enlace}

Si no solicitaste este cambio, podés ignorar este correo.

Saludos,
El equipo de BeautyMoon
"""

    html = f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Recuperación de contraseña</h2>
    <p>Hola,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña en <strong>BeautyMoon</strong>.</p>
    <p>Si fuiste vos, hacé clic en el siguiente enlace:</p>
    <p><a href="{enlace}" style="background:#ff69b4; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;">Restablecer contraseña</a></p>
    <p>Si no solicitaste este cambio, simplemente ignorá este correo.</p>
    <br>
    <p>Saludos,<br>El equipo de BeautyMoon</p>
  </body>
</html>
"""

    msg.attach(MIMEText(texto, "plain"))
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login("agustindiazcontreras4321@gmail.com", "pciy exxg pkmt qhdw")  # usar App Password de Gmail
        server.send_message(msg)

    return JSONResponse(
        content={"detail": f"Se envió un enlace de recuperación a {tu_correo}"},
        status_code=200
    )

@enrutador.post("/auth/reset-password")
async def reset_password(data: dict):
    token = data.get("token")
    nueva_password = data.get("nueva_password")  # 👈 coincide con el frontend

    if token != "demo-token-123":
        return JSONResponse(
            content={"detail": "Token inválido o expirado"},
            status_code=400
        )

    usuario_email = "demo@correo.com"

    # Guardar en el campo 'password'
    await db["usuarios"].update_one(
        {"email": usuario_email},
        {"$set": {"password": nueva_password}}
    )

    return JSONResponse(
        content={"detail": "Contraseña restablecida correctamente"},
        status_code=200
    )

# ============ PRODUCTOS ============
@enrutador.get("/productos")
async def listar_productos(
    categoria: Optional[str] = None,
    busqueda: Optional[str] = None,
    orden: str = "precio",
    provincia_usuario: Optional[str] = None,
    pagina: int = 1,
    por_pagina: int = 12
):
    filtro = {}
    if categoria:
        filtro["categoria"] = categoria
    if busqueda:
        filtro["nombre"] = {"$regex": busqueda, "$options": "i"}

    total = await db.productos.count_documents(filtro)
    cursor = db.productos.find(filtro, {"_id": 0})

    # Algoritmo: Mejor Precio > Menor Distancia > Costo Envío
    productos = await cursor.to_list(length=10000)

    # Enriquecer con info de vendedor
    for p in productos:
        vendedor = await db.vendedores.find_one({"usuario_id": p.get("vendedor_id")}, {"_id": 0})
        p["vendedor"] = vendedor or {}

    def clave_orden(p):
        distancia = 0 if provincia_usuario and p.get("vendedor", {}).get("provincia") == provincia_usuario else 1
        return (p.get("precio", 0), distancia, p.get("envio_costo", 0))

    if orden == "precio":
        productos.sort(key=clave_orden)
    elif orden == "precio_desc":
        productos.sort(key=lambda p: -p.get("precio", 0))
    elif orden == "vendidos":
        productos.sort(key=lambda p: -p.get("vendidos", 0))

    inicio = (pagina - 1) * por_pagina
    fin = inicio + por_pagina
    return {
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "productos": productos[inicio:fin]
    }


@enrutador.get("/productos/destacados")
async def productos_destacados():
    productos = await db.productos.find({"destacado": True}, {"_id": 0}).limit(8).to_list(8)
    mas_vendidos = await db.productos.find({}, {"_id": 0}).sort("vendidos", -1).limit(4).to_list(4)
    return {"destacados": productos, "mas_vendidos": mas_vendidos}


@enrutador.get("/productos/{producto_id}")
async def obtener_producto(producto_id: str):
    producto = await db.productos.find_one({"id": producto_id}, {"_id": 0})
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    vendedor = await db.vendedores.find_one({"usuario_id": producto.get("vendedor_id")}, {"_id": 0})
    producto["vendedor"] = vendedor or {}
    return producto


@enrutador.post("/productos")
async def crear_producto(data: ProductoRequest, usuario=Depends(requiere_rol("vendedor"))):
    producto_id = str(uuid.uuid4())
    doc = data.model_dump()
    doc.update({
        "id": producto_id,
        "vendedor_id": usuario["id"],
        "vendidos": 0,
        "creado_en": datetime.now(timezone.utc).isoformat()
    })
    await db.productos.insert_one(doc)
    doc.pop("_id", None)
    return doc


@enrutador.put("/productos/{producto_id}")
async def actualizar_producto(producto_id: str, data: ProductoRequest, usuario=Depends(requiere_rol("vendedor"))):
    producto = await db.productos.find_one({"id": producto_id})
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if producto["vendedor_id"] != usuario["id"] and usuario["rol"] != "admin":
        raise HTTPException(status_code=403, detail="No tenés permiso sobre este producto")
    await db.productos.update_one({"id": producto_id}, {"$set": data.model_dump()})
    actualizado = await db.productos.find_one({"id": producto_id}, {"_id": 0})
    return actualizado


@enrutador.delete("/productos/{producto_id}")
async def eliminar_producto(producto_id: str, usuario=Depends(requiere_rol("vendedor"))):
    producto = await db.productos.find_one({"id": producto_id})
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if producto["vendedor_id"] != usuario["id"] and usuario["rol"] != "admin":
        raise HTTPException(status_code=403, detail="No tenés permiso")
    await db.productos.delete_one({"id": producto_id})
    return {"ok": True}


@enrutador.get("/vendedor/mis-productos")
async def mis_productos(usuario=Depends(requiere_rol("vendedor"))):
    productos = await db.productos.find({"vendedor_id": usuario["id"]}, {"_id": 0}).to_list(1000)
    return productos


# ============ VENDEDORES / STAND ============
@enrutador.get("/vendedores")
async def listar_vendedores():
    vendedores = await db.vendedores.find({}, {"_id": 0}).to_list(1000)
    return vendedores


@enrutador.get("/vendedores/{vendedor_id}")
async def obtener_vendedor(vendedor_id: str):
    vendedor = await db.vendedores.find_one({"usuario_id": vendedor_id}, {"_id": 0})
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    productos = await db.productos.find({"vendedor_id": vendedor_id}, {"_id": 0}).to_list(1000)
    return {"vendedor": vendedor, "productos": productos}


@enrutador.get("/vendedor/mi-stand")
async def mi_stand(usuario=Depends(requiere_rol("vendedor"))):
    stand = await db.vendedores.find_one({"usuario_id": usuario["id"]}, {"_id": 0})
    return stand


@enrutador.put("/vendedor/mi-stand")
async def actualizar_stand(data: StandRequest, usuario=Depends(requiere_rol("vendedor"))):
    await db.vendedores.update_one(
        {"usuario_id": usuario["id"]},
        {"$set": data.model_dump()}
    )
    stand = await db.vendedores.find_one({"usuario_id": usuario["id"]}, {"_id": 0})
    return stand


# ============ FAVORITOS ============
@enrutador.get("/favoritos")
async def mis_favoritos(usuario=Depends(obtener_usuario_actual)):
    favs = await db.favoritos.find({"usuario_id": usuario["id"]}, {"_id": 0}).to_list(1000)
    ids = [f["producto_id"] for f in favs]
    productos = await db.productos.find({"id": {"$in": ids}}, {"_id": 0}).to_list(1000)
    return productos


@enrutador.post("/favoritos/{producto_id}")
async def agregar_favorito(producto_id: str, usuario=Depends(obtener_usuario_actual)):
    existente = await db.favoritos.find_one({"usuario_id": usuario["id"], "producto_id": producto_id})
    if existente:
        return {"ok": True, "ya_existia": True}
    await db.favoritos.insert_one({
        "id": str(uuid.uuid4()),
        "usuario_id": usuario["id"],
        "producto_id": producto_id
    })
    return {"ok": True}


@enrutador.delete("/favoritos/{producto_id}")
async def quitar_favorito(producto_id: str, usuario=Depends(obtener_usuario_actual)):
    await db.favoritos.delete_one({"usuario_id": usuario["id"], "producto_id": producto_id})
    return {"ok": True}


# ============ PEDIDOS + MERCADO PAGO ============
@enrutador.post("/pedidos/crear-preferencia")
async def crear_preferencia(data: PedidoRequest, usuario=Depends(obtener_usuario_actual)):
    # Buscar productos
    ids = [item.producto_id for item in data.items]
    productos_db = await db.productos.find({"id": {"$in": ids}}, {"_id": 0}).to_list(1000)
    mapa = {p["id"]: p for p in productos_db}

    items_mp = []
    total = 0.0
    envio_total = 0.0
    for item in data.items:
        p = mapa.get(item.producto_id)
        if not p:
            continue
        items_mp.append({
            "title": p["nombre"],
            "quantity": item.cantidad,
            "unit_price": float(p["precio"]),
            "currency_id": "ARS"
        })
        total += p["precio"] * item.cantidad
        envio_total += p.get("envio_costo", 0)

    if envio_total > 0:
        items_mp.append({
            "title": "Costo de envío",
            "quantity": 1,
            "unit_price": float(envio_total),
            "currency_id": "ARS"
        })

    pedido_id = str(uuid.uuid4())
    preference_data = {
        "items": items_mp,
        "payer": {
            "email": data.datos_envio.email,
            "name": data.datos_envio.nombre,
            "phone": {"number": data.datos_envio.telefono}
        },
        "back_urls": {
            "success": f"{APP_URL}/pago/exito?pedido={pedido_id}",
            "failure": f"{APP_URL}/pago/error?pedido={pedido_id}",
            "pending": f"{APP_URL}/pago/pendiente?pedido={pedido_id}"
        },
        "auto_return": "approved",
        "external_reference": pedido_id,
        "notification_url": f"{APP_URL}/api/pedidos/webhook"
    }

    try:
        resultado = sdk_mp.preference().create(preference_data)
        respuesta_mp = resultado.get("response", {})
        init_point = respuesta_mp.get("init_point") or respuesta_mp.get("sandbox_init_point")
        preference_id = respuesta_mp.get("id")
    except Exception as e:
        logger.error(f"Error MP: {e}")
        raise HTTPException(status_code=500, detail="Error al crear preferencia de pago")

    # Guardar pedido
    await db.pedidos.insert_one({
        "id": pedido_id,
        "comprador_id": usuario["id"],
        "items": [item.model_dump() for item in data.items],
        "datos_envio": data.datos_envio.model_dump(),
        "total": total + envio_total,
        "envio_costo": envio_total,
        "estado_pago": "pendiente",
        "preference_id": preference_id,
        "creado_en": datetime.now(timezone.utc).isoformat()
    })

    return {"pedido_id": pedido_id, "preference_id": preference_id, "init_point": init_point}


@enrutador.post("/pedidos/webhook")
async def webhook_mp(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
    logger.info(f"Webhook MP recibido: {body}")

    tipo = body.get("type") or body.get("topic")
    if tipo == "payment":
        payment_id = body.get("data", {}).get("id") or body.get("resource")
        if payment_id:
            try:
                resultado = sdk_mp.payment().get(payment_id)
                pago = resultado.get("response", {})
                external_ref = pago.get("external_reference")
                estado = pago.get("status")
                if external_ref:
                    await db.pedidos.update_one(
                        {"id": external_ref},
                        {"$set": {"estado_pago": estado, "pago_id": payment_id}}
                    )
                    if estado == "approved":
                        pedido = await db.pedidos.find_one({"id": external_ref})
                        if pedido:
                            for item in pedido["items"]:
                                await db.productos.update_one(
                                    {"id": item["producto_id"]},
                                    {"$inc": {"vendidos": item["cantidad"], "stock": -item["cantidad"]}}
                                )
            except Exception as e:
                logger.error(f"Error procesando webhook: {e}")
    return {"recibido": True}


@enrutador.get("/pedidos/mis-pedidos")
async def mis_pedidos(usuario=Depends(obtener_usuario_actual)):
    pedidos = await db.pedidos.find({"comprador_id": usuario["id"]}, {"_id": 0}).sort("creado_en", -1).to_list(100)
    return pedidos


@enrutador.get("/pedidos/{pedido_id}")
async def obtener_pedido(pedido_id: str, usuario=Depends(obtener_usuario_actual)):
    pedido = await db.pedidos.find_one({"id": pedido_id}, {"_id": 0})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return pedido


# ============ ADMIN ============
@enrutador.get("/admin/resumen")
async def admin_resumen(usuario=Depends(requiere_rol("admin"))):
    total_usuarios = await db.usuarios.count_documents({})
    total_vendedores = await db.usuarios.count_documents({"rol": "vendedor"})
    total_clientes = await db.usuarios.count_documents({"rol": "cliente"})
    total_productos = await db.productos.count_documents({})
    total_pedidos = await db.pedidos.count_documents({})
    pedidos_aprobados = await db.pedidos.count_documents({"estado_pago": "approved"})
    return {
        "total_usuarios": total_usuarios,
        "total_vendedores": total_vendedores,
        "total_clientes": total_clientes,
        "total_productos": total_productos,
        "total_pedidos": total_pedidos,
        "pedidos_aprobados": pedidos_aprobados
    }


@enrutador.get("/admin/vendedores")
async def admin_listar_vendedores(usuario=Depends(requiere_rol("admin"))):
    vendedores = await db.vendedores.find({}, {"_id": 0}).to_list(1000)
    for v in vendedores:
        usuario_v = await db.usuarios.find_one({"id": v["usuario_id"]}, {"_id": 0, "password_hash": 0})
        v["email"] = usuario_v["email"] if usuario_v else ""
        v["productos_count"] = await db.productos.count_documents({"vendedor_id": v["usuario_id"]})
    return vendedores


@enrutador.put("/admin/vendedores/{vendedor_usuario_id}/toggle")
async def admin_toggle_vendedor(vendedor_usuario_id: str, usuario=Depends(requiere_rol("admin"))):
    vendedor = await db.vendedores.find_one({"usuario_id": vendedor_usuario_id})
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    nuevo_estado = not vendedor.get("activo", True)
    await db.vendedores.update_one({"usuario_id": vendedor_usuario_id}, {"$set": {"activo": nuevo_estado}})
    return {"activo": nuevo_estado}


@enrutador.get("/admin/productos")
async def admin_listar_productos(usuario=Depends(requiere_rol("admin"))):
    productos = await db.productos.find({}, {"_id": 0}).to_list(10000)
    return productos


@enrutador.delete("/admin/productos/{producto_id}")
async def admin_eliminar_producto(producto_id: str, usuario=Depends(requiere_rol("admin"))):
    await db.productos.delete_one({"id": producto_id})
    return {"ok": True}


# ============ SEED DEMO ============
@enrutador.post("/seed/demo")
async def sembrar_demo():
    """Carga datos de demostración si la BD está vacía."""
    if await db.usuarios.count_documents({}) > 0:
        return {"mensaje": "Ya existen datos"}

    # Admin
    admin_id = str(uuid.uuid4())
    await db.usuarios.insert_one({
        "id": admin_id,
        "email": "admin@beautymoon.com",
        "password_hash": hash_password("admin123"),
        "nombre": "Administrador",
        "rol": "admin",
        "telefono": "", "provincia": "", "ciudad": "",
        "creado_en": datetime.now(timezone.utc).isoformat()
    })

    # Vendedores
    vendedores_data = [
        {"email": "sofia@beautymoon.com", "nombre": "Sofía Ramírez", "prov": "Buenos Aires", "ciudad": "CABA", "stand": "Glow by Sofía"},
        {"email": "martina@beautymoon.com", "nombre": "Martina López", "prov": "Córdoba", "ciudad": "Córdoba Capital", "stand": "Bella Martina"},
        {"email": "carolina@beautymoon.com", "nombre": "Carolina Díaz", "prov": "Santa Fe", "ciudad": "Rosario", "stand": "Luna Cosméticos"}
    ]
    avatars = [
        "https://images.unsplash.com/photo-1722247410696-31f0a93eb504",
        "https://images.pexels.com/photos/9774655/pexels-photo-9774655.jpeg",
        "https://images.pexels.com/photos/29745247/pexels-photo-29745247.jpeg"
    ]
    vendedor_ids = []
    for i, v in enumerate(vendedores_data):
        uid = str(uuid.uuid4())
        vendedor_ids.append(uid)
        await db.usuarios.insert_one({
            "id": uid,
            "email": v["email"],
            "password_hash": hash_password("vendedor123"),
            "nombre": v["nombre"],
            "rol": "vendedor",
            "telefono": "+54 11 5555-0000",
            "provincia": v["prov"],
            "ciudad": v["ciudad"],
            "creado_en": datetime.now(timezone.utc).isoformat()
        })
        await db.vendedores.insert_one({
            "id": str(uuid.uuid4()),
            "usuario_id": uid,
            "nombre_stand": v["stand"],
            "descripcion": f"Asesora de belleza Avón en {v['ciudad']}. Envíos a todo el país.",
            "telefono": "+54 11 5555-0000",
            "provincia": v["prov"],
            "ciudad": v["ciudad"],
            "avatar_url": avatars[i],
            "activo": True,
            "creado_en": datetime.now(timezone.utc).isoformat()
        })

    # Cliente demo
    await db.usuarios.insert_one({
        "id": str(uuid.uuid4()),
        "email": "cliente@beautymoon.com",
        "password_hash": hash_password("cliente123"),
        "nombre": "Camila Torres",
        "rol": "cliente",
        "telefono": "+54 11 1234-5678",
        "provincia": "Buenos Aires",
        "ciudad": "CABA",
        "creado_en": datetime.now(timezone.utc).isoformat()
    })

    # Productos
    catalogo = [
        # Perfumería
        {"n": "Far Away Eau de Parfum", "cat": "perfumeria", "p": 18500, "pa": 22000, "d": "Un aroma exótico y envolvente con notas de flor de karité y pachulí.",
         "b": "Fragancia duradera hasta 12hs. Frasco elegante de 50ml.", "mu": "Aplicar sobre el cuello y muñecas.", "ing": "Alcohol Denat, Parfum, Aqua.",
         "img": "https://images.pexels.com/photos/3785784/pexels-photo-3785784.jpeg", "destacado": True},
        {"n": "Little Black Dress", "cat": "perfumeria", "p": 19200, "pa": None, "d": "Fragancia sofisticada inspirada en el vestido negro icónico.",
         "b": "Seductor aroma oriental con jazmín y vainilla.", "mu": "Una aplicación dura todo el día.", "ing": "Alcohol Denat, Parfum.",
         "img": "https://images.unsplash.com/photo-1774682061055-3bfe402e5a12", "destacado": True},
        {"n": "Perceive Eau de Parfum", "cat": "perfumeria", "p": 17400, "pa": None, "d": "Perfume femenino con notas dulces de mandarina y seda blanca.",
         "b": "Sensación fresca y prolongada durante el día.", "mu": "Aplicar en puntos de pulso.", "ing": "Alcohol, Parfum, Aqua.",
         "img": "https://images.pexels.com/photos/2537930/pexels-photo-2537930.jpeg", "destacado": False},
        # Maquillaje
        {"n": "Labial Ultra Matte Rojo Pasión", "cat": "maquillaje", "p": 5200, "pa": 6800, "d": "Labial de acabado mate con alta pigmentación y larga duración.",
         "b": "No reseca los labios. Color intenso hasta 8 horas.", "mu": "Aplicar directamente sobre los labios.", "ing": "Cera de carnauba, vitamina E.",
         "img": "https://images.unsplash.com/photo-1615793685200-5802ff8bbea7", "destacado": True},
        {"n": "Paleta de Sombras True Color", "cat": "maquillaje", "p": 8900, "pa": None, "d": "Paleta con 12 sombras versátiles para looks de día y noche.",
         "b": "Sombras mate y satinadas de alta pigmentación.", "mu": "Aplicar con pincel sobre los párpados.", "ing": "Talc, Mica, pigmentos.",
         "img": "https://images.unsplash.com/photo-1625094640367-05f84293fe42", "destacado": True},
        {"n": "Máscara de Pestañas Big & Daring", "cat": "maquillaje", "p": 4800, "pa": None, "d": "Máscara con efecto volumen y alargamiento.",
         "b": "Fórmula waterproof. Cepillo curvo.", "mu": "Aplicar desde la raíz hacia las puntas.", "ing": "Aqua, Cera de abeja, Nylon.",
         "img": "https://images.pexels.com/photos/2537930/pexels-photo-2537930.jpeg", "destacado": False},
        # Rostro
        {"n": "Crema Anew Reversalist Noche", "cat": "rostro", "p": 12500, "pa": 15000, "d": "Crema antiedad con protinol que revierte signos visibles del envejecimiento.",
         "b": "Reduce arrugas profundas. Piel más firme en 2 semanas.",
         "mu": "Aplicar por la noche sobre rostro y cuello limpios.",
         "ing": "Aqua, Glicerina, Niacinamida, Protinol, Retinol.",
         "img": "https://images.pexels.com/photos/9774655/pexels-photo-9774655.jpeg", "destacado": True},
        {"n": "Serum Anew Vitamina C", "cat": "rostro", "p": 9800, "pa": None, "d": "Serum iluminador con 10% de vitamina C pura.",
         "b": "Unifica el tono y da luminosidad instantánea.", "mu": "Aplicar 3 gotas en el rostro limpio.",
         "ing": "Ácido ascórbico, ácido hialurónico, vitamina E.",
         "img": "https://images.pexels.com/photos/29745247/pexels-photo-29745247.jpeg", "destacado": True},
        # Cuidado Corporal
        {"n": "Crema Corporal Skin So Soft", "cat": "cuidado_corporal", "p": 6500, "pa": None, "d": "Crema hidratante con aceite de jojoba para piel suave.",
         "b": "24hs de hidratación profunda. Aroma sutil.",
         "mu": "Aplicar sobre la piel limpia después del baño.",
         "ing": "Aqua, Aceite de jojoba, Vitamina E, Glicerina.",
         "img": "https://images.pexels.com/photos/3785784/pexels-photo-3785784.jpeg", "destacado": True},
        {"n": "Jabón Exfoliante Natural", "cat": "cuidado_corporal", "p": 2900, "pa": None, "d": "Jabón con micro-partículas exfoliantes naturales.",
         "b": "Elimina células muertas y renueva la piel.", "mu": "Masajear sobre la piel húmeda y enjuagar.",
         "ing": "Jabón base, semillas de damasco, aceites esenciales.",
         "img": "https://images.unsplash.com/photo-1722247410696-31f0a93eb504", "destacado": False},
        {"n": "Desodorante Roll-On On Duty", "cat": "cuidado_corporal", "p": 2400, "pa": 3200, "d": "Desodorante antitranspirante 48hs.",
         "b": "Sin alcohol. Protección prolongada.", "mu": "Aplicar sobre piel limpia y seca.",
         "ing": "Aqua, Aluminum chlorohydrate, Glicerina.",
         "img": "https://images.pexels.com/photos/9774655/pexels-photo-9774655.jpeg", "destacado": False},
        {"n": "Aceite Corporal Planet Spa", "cat": "cuidado_corporal", "p": 7800, "pa": None, "d": "Aceite corporal con argán y almendras dulces.",
         "b": "Nutrición profunda y brillo natural.", "mu": "Aplicar sobre piel húmeda tras el baño.",
         "ing": "Aceite de argán, aceite de almendras, vitamina E.",
         "img": "https://images.pexels.com/photos/2537930/pexels-photo-2537930.jpeg", "destacado": False}
    ]

    for i, item in enumerate(catalogo):
        vendedor_id = vendedor_ids[i % len(vendedor_ids)]
        await db.productos.insert_one({
            "id": str(uuid.uuid4()),
            "vendedor_id": vendedor_id,
            "nombre": item["n"],
            "categoria": item["cat"],
            "subcategoria": "",
            "precio": item["p"],
            "precio_anterior": item.get("pa"),
            "descripcion": item["d"],
            "beneficios": item["b"],
            "modo_uso": item["mu"],
            "ingredientes": item["ing"],
            "imagen_url": item["img"],
            "stock": 50,
            "envio_costo": 1500 if i % 3 else 0,
            "destacado": item.get("destacado", False),
            "vendidos": (i * 7) % 40,
            "creado_en": datetime.now(timezone.utc).isoformat()
        })

    return {"mensaje": "Datos demo cargados", "productos": len(catalogo)}


# ============ APP ============
app.include_router(enrutador)




app.include_router(enrutador)

@app.on_event("shutdown")
async def shutdown():
    cliente_mongo.close()



