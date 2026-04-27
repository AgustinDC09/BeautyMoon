"""Beauty Moon backend tests"""
import os, requests, pytest, uuid

BASE = os.environ.get('REACT_APP_BACKEND_URL', 'https://beauty-stand.preview.emergentagent.com').rstrip('/')
API = f"{BASE}/api"

@pytest.fixture(scope="module")
def s():
    return requests.Session()

@pytest.fixture(scope="module")
def tokens(s):
    s.post(f"{API}/seed/demo", timeout=30)
    out = {}
    for email, pwd, rol in [("admin@beautymoon.com","admin123","admin"),
                            ("sofia@beautymoon.com","vendedor123","vendedor"),
                            ("cliente@beautymoon.com","cliente123","cliente")]:
        r = s.post(f"{API}/auth/login", json={"email":email,"password":pwd}, timeout=15)
        assert r.status_code == 200, f"login {email}: {r.status_code} {r.text}"
        out[rol] = r.json()["token"]
    return out

def H(t): return {"Authorization": f"Bearer {t}"}

def test_seed(s):
    r = s.post(f"{API}/seed/demo", timeout=30); assert r.status_code == 200

def test_yo(s, tokens):
    r = s.get(f"{API}/auth/yo", headers=H(tokens["cliente"])); assert r.status_code == 200
    assert r.json()["rol"] == "cliente"

def test_registro_duplicado(s):
    r = s.post(f"{API}/auth/registro", json={"email":"admin@beautymoon.com","password":"x","nombre":"x","rol":"cliente"})
    assert r.status_code == 400

def test_registro_nuevo_cliente(s):
    email = f"test_{uuid.uuid4().hex[:8]}@test.com"
    r = s.post(f"{API}/auth/registro", json={"email":email,"password":"pass123","nombre":"T","rol":"cliente"})
    assert r.status_code == 200 and "token" in r.json()

def test_productos_lista(s):
    r = s.get(f"{API}/productos?pagina=1&por_pagina=12"); assert r.status_code == 200
    d = r.json(); assert d["total"] >= 12; assert len(d["productos"]) <= 12
    assert "vendedor" in d["productos"][0]

def test_productos_filtro_categoria(s):
    r = s.get(f"{API}/productos?categoria=perfumeria"); assert r.status_code == 200
    assert all(p["categoria"]=="perfumeria" for p in r.json()["productos"])

def test_destacados(s):
    r = s.get(f"{API}/productos/destacados"); assert r.status_code == 200
    d = r.json(); assert "destacados" in d and "mas_vendidos" in d
    assert len(d["destacados"]) > 0

def test_detalle_producto(s):
    p = s.get(f"{API}/productos").json()["productos"][0]
    r = s.get(f"{API}/productos/{p['id']}"); assert r.status_code == 200
    assert r.json()["id"] == p["id"]; assert "vendedor" in r.json()

def test_crud_producto_vendedor(s, tokens):
    payload = {"nombre":"TEST_Producto","categoria":"maquillaje","precio":1000,"descripcion":"d","imagen_url":"http://x.jpg","stock":10}
    r = s.post(f"{API}/productos", json=payload, headers=H(tokens["vendedor"])); assert r.status_code == 200
    pid = r.json()["id"]
    payload["precio"] = 1200
    r = s.put(f"{API}/productos/{pid}", json=payload, headers=H(tokens["vendedor"])); assert r.status_code == 200
    assert r.json()["precio"] == 1200
    r = s.get(f"{API}/productos/{pid}"); assert r.json()["precio"] == 1200
    r = s.delete(f"{API}/productos/{pid}", headers=H(tokens["vendedor"])); assert r.status_code == 200

def test_crud_requires_vendedor(s, tokens):
    r = s.post(f"{API}/productos", json={"nombre":"x","categoria":"maquillaje","precio":1,"descripcion":"d","imagen_url":"u"}, headers=H(tokens["cliente"]))
    assert r.status_code == 403

def test_mis_productos_stand(s, tokens):
    r = s.get(f"{API}/vendedor/mis-productos", headers=H(tokens["vendedor"])); assert r.status_code == 200
    r = s.get(f"{API}/vendedor/mi-stand", headers=H(tokens["vendedor"])); assert r.status_code == 200
    stand = r.json()
    stand_upd = {"nombre_stand":stand["nombre_stand"],"descripcion":"upd","telefono":stand.get("telefono",""),"provincia":stand.get("provincia",""),"ciudad":stand.get("ciudad",""),"avatar_url":stand.get("avatar_url","")}
    r = s.put(f"{API}/vendedor/mi-stand", json=stand_upd, headers=H(tokens["vendedor"])); assert r.status_code == 200
    assert r.json()["descripcion"] == "upd"

def test_favoritos(s, tokens):
    p = s.get(f"{API}/productos").json()["productos"][0]
    r = s.post(f"{API}/favoritos/{p['id']}", headers=H(tokens["cliente"])); assert r.status_code == 200
    r = s.get(f"{API}/favoritos", headers=H(tokens["cliente"])); assert r.status_code == 200
    assert any(x["id"]==p["id"] for x in r.json())
    r = s.delete(f"{API}/favoritos/{p['id']}", headers=H(tokens["cliente"])); assert r.status_code == 200

def test_preferencia_mp(s, tokens):
    p = s.get(f"{API}/productos").json()["productos"][0]
    payload = {"items":[{"producto_id":p["id"],"cantidad":1}],
               "datos_envio":{"nombre":"T","email":"t@t.com","telefono":"123","direccion":"a","provincia":"BA","ciudad":"CABA","codigo_postal":"1000"}}
    r = s.post(f"{API}/pedidos/crear-preferencia", json=payload, headers=H(tokens["cliente"]))
    assert r.status_code == 200, r.text
    d = r.json(); assert "init_point" in d and d["init_point"]
    assert "mercadopago" in d["init_point"]

def test_webhook(s):
    r = s.post(f"{API}/pedidos/webhook", json={"type":"test"}); assert r.status_code == 200

def test_admin(s, tokens):
    r = s.get(f"{API}/admin/resumen", headers=H(tokens["admin"])); assert r.status_code == 200
    assert r.json()["total_productos"] >= 12
    r = s.get(f"{API}/admin/vendedores", headers=H(tokens["admin"])); assert r.status_code == 200
    vs = r.json(); assert len(vs) >= 3
    vid = vs[0]["usuario_id"]
    r = s.put(f"{API}/admin/vendedores/{vid}/toggle", headers=H(tokens["admin"])); assert r.status_code == 200
    s.put(f"{API}/admin/vendedores/{vid}/toggle", headers=H(tokens["admin"]))  # revert
    r = s.get(f"{API}/admin/productos", headers=H(tokens["admin"])); assert r.status_code == 200

def test_admin_requires_admin(s, tokens):
    r = s.get(f"{API}/admin/resumen", headers=H(tokens["cliente"])); assert r.status_code == 403
