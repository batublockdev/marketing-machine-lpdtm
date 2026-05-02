# 📖 Guía para Bots - Marketing Machine LPDTM

Esta guía explica cómo los bots deben interactuar con la plataforma de aprobación de contenido.

---

## 🎯 Resumen del Flujo

```
BOT → INBOX (meta.json) → DASHBOARD → APROBACIÓN → PUBLICACIÓN → CONFIRMACIÓN
                                   ↓                      ↓
                            response.json         DIFERENTE POR PLATAFORMA
```

---

## ⚠️ IMPORTANTE: Especificar Cuenta Destino

Los bots **deben especificar** la cuenta de destino al crear posts:

```json
{
  "targetAccount": "@mi_cuenta_tiktok"
}
```

Esto permite que el dashboard sepa a qué cuenta se debe publicar el contenido.

---

## 📁 Estructura de Archivos

```
marketing-machine-lpdtm/
├── inbox/
│   └── {bot-id}/
│       └── {plataforma}/
│           └── {post-id}/
│               ├── video.mp4       # Archivo de media
│               ├── meta.json       # Metadata (OBLIGATORIO)
│               └── response.json   # Creado por la plataforma
├── approved/
│   └── {bot-id}/
│       └── {plataforma}/
│           └── {post-id}/
│               ├── video.mp4
│               └── approved.json
├── published/
│   └── {bot-id}/
│       └── {plataforma}/
│           └── {post-id}/
│               ├── video.mp4
│               └── published.json
└── dashboard/                      # No tocar
```

---

## 🚀 Paso 1: Enviar Contenido

### Via API (Recomendado)

```python
import requests
import json

def submit_post(bot_id, platform, target_account, video_path, caption, tags):
    """
    Enviar contenido via API.

    Endpoint: POST /api/submit
    """
    response = requests.post(
        'http://TU_DASHBOARD_URL/api/submit',
        json={
            'botId': bot_id,
            'platform': platform,           # "tiktok" o "instagram"
            'targetAccount': target_account, # "@mi_cuenta"
            'videoPath': video_path,
            'caption': caption,
            'tags': tags,
        }
    )

    return response.json()

# Ejemplo:
result = submit_post(
    bot_id='bot-1',
    platform='tiktok',
    target_account='@mi_cuenta_tiktok',
    video_path='/path/to/video.mp4',
    caption='Mi video! 🚀 #viral',
    tags=['viral', 'trending']
)

print(result)
# {
#   "success": true,
#   "post": {
#     "id": "uuid-del-post",
#     "botId": "bot-1",
#     "platform": "tiktok",
#     "targetAccount": "@mi_cuenta_tiktok",
#     "status": "pending"
#   }
# }
```

### Via Sistema de Archivos (Alternativo)

```bash
POST_ID="post-$(date +%s)"
BOT_ID="bot-1"
PLATFORM="tiktok"
TARGET_ACCOUNT="@mi_cuenta"

mkdir -p inbox/$BOT_ID/$PLATFORM/$POST_ID

# Copiar video
cp mi_video.mp4 inbox/$BOT_ID/$PLATFORM/$POST_ID/video.mp4

# Crear metadata
cat > inbox/$BOT_ID/$PLATFORM/$POST_ID/meta.json << 'EOF'
{
  "caption": "Mi video! 🚀 #viral",
  "tags": ["viral", "trending"],
  "targetAccount": "@mi_cuenta_tiktok"
}
EOF
```

---

## ⏳ Paso 2: Esperar Aprobación

Monitorea la aparición de `response.json`:

```python
import os
import json
import time

def wait_for_approval(post_dir, timeout=3600):
    """Espera hasta que aparezca response.json"""
    response_path = os.path.join(post_dir, "response.json")
    start = time.time()

    while time.time() - start < timeout:
        if os.path.exists(response_path):
            with open(response_path) as f:
                data = json.load(f)

            if data['status'] == 'approved':
                return 'approved', data
            elif data['status'] == 'rejected':
                return 'rejected', data.get('rejectReason')

        time.sleep(10)

    return 'timeout', None
```

**response.json (aprobado):**
```json
{
  "status": "approved",
  "postId": "uuid-del-post",
  "approvedAt": "2026-05-02T18:00:00Z"
}
```

**response.json (rechazado):**
```json
{
  "status": "rejected",
  "postId": "uuid-del-post",
  "rejectedAt": "2026-05-02T18:00:00Z",
  "rejectReason": "Mejorar la iluminación del video"
}
```

---

## 📤 Paso 3: Publicar

### 📱 TikTok - AUTOMÁTICO (Dashboard publica)

**Los bots NO publican en TikTok.** El dashboard lo hace automáticamente.

Después de aprobado:
1. El usuario hace click en "Publicar en TikTok" desde el dashboard
2. El dashboard usa el access_token guardado
3. Sube el video via TikTok Content Posting API
4. Marca el post como publicado

**El bot solo debe esperar:**

```python
def wait_for_tiktok_publication(post_dir, timeout=7200):
    """Espera a que el dashboard publique en TikTok"""
    published_path = os.path.join(post_dir, "published.json")
    start = time.time()

    while time.time() - start < timeout:
        if os.path.exists(published_path):
            with open(published_path) as f:
                data = json.load(f)

            if data.get('status') == 'published_on_tiktok':
                return 'published', data

        time.sleep(30)

    return 'timeout', None

# published.json:
# {
#   "status": "published_on_tiktok",
#   "postId": "uuid",
#   "platformPostId": "7123456789",
#   "url": "https://tiktok.com/@user/video/7123456789",
#   "publishedAt": "2026-05-02T18:30:00Z"
# }
```

### 📸 Instagram - SEMIAUTOMÁTICO (Bot publica)

Para Instagram, el proceso es:

1. **El usuario marca el post como listo para Instagram** desde el dashboard
2. **El bot detecta el flag** `instagramPublishReady` o el archivo `instagram-ready.json`
3. **El bot publica** usando las credenciales que tiene
4. **El bot confirma la publicación** via API

```python
import requests

def check_instagram_ready(post_id):
    """
    Verifica si el post está listo para publicar en Instagram.

    Endpoint: GET /api/posts/{post_id}
    """
    response = requests.get(f'http://TU_DASHBOARD_URL/api/posts/{post_id}')
    post = response.json()

    return post.get('instagramPublishReady', False)

def confirm_instagram_publication(post_id, platform_post_id, url):
    """
    Confirma que el post fue publicado en Instagram.

    Endpoint: PATCH /api/publish
    """
    response = requests.patch(
        'http://TU_DASHBOARD_URL/api/publish',
        json={
            'postId': post_id,
            'platform': 'instagram',
            'platformPostId': platform_post_id,
            'url': url
        }
    )

    return response.json()

# Ejemplo completo:
if check_instagram_ready(post_id):
    # Publicar en Instagram (tu código)
    result = publish_to_instagram(video_path, caption, target_account)

    # Confirmar publicación
    confirm_instagram_publication(
        post_id=post_id,
        platform_post_id=result['id'],
        url=result['url']
    )
```

**instagram-ready.json (cuando el usuario marca):**
```json
{
  "status": "ready_for_instagram",
  "postId": "uuid",
  "targetAccount": "@mi_cuenta_instagram",
  "readyAt": "2026-05-02T18:05:00Z"
}
```

**Después de publicado (instagram-ready.json actualizado):**
```json
{
  "status": "published_on_instagram",
  "postId": "uuid",
  "platformPostId": "ABC123",
  "url": "https://instagram.com/p/ABC123",
  "publishedAt": "2026-05-02T18:10:00Z"
}
```

---

## 🔄 Manejar Posts Rechazados

Los posts rechazados están disponibles para que los bots los obtengan, corrijan y eliminen:

### Obtener Posts Rechazados

```python
import requests

def get_rejected_posts(bot_id=None):
    """
    Obtiene posts rechazados.

    Endpoint: GET /api/rejected?botId={botId}
    """
    url = 'http://TU_DASHBOARD_URL/api/rejected'
    if bot_id:
        url += f'?botId={bot_id}'

    response = requests.get(url)
    return response.json()

# Ejemplo:
rejected = get_rejected_posts('bot-1')

for post in rejected:
    print(f"Post {post['id']} rechazado: {post['rejectReason']}")
    print(f"Target account: {post['targetAccount']}")
    print(f"Video path: {post['videoPath']}")

    # Corregir y reenviar...
    # ...
```

### Eliminar Post Rechazado (después de corregir)

```python
def delete_rejected_post(post_id):
    """
    Elimina un post rechazado después de corregirlo.

    Endpoint: DELETE /api/posts/{post_id}
    """
    response = requests.delete(
        f'http://TU_DASHBOARD_URL/api/posts/{post_id}'
    )

    return response.json()

# Ejemplo:
# Después de crear un nuevo post corregido...
delete_rejected_post(old_post_id)
```

---

## 🔄 Flujo Completo

### TikTok

```python
import os
import json
import time
import requests

BASE_URL = "http://tu-dashboard-url"
BOT_ID = "bot-1"
PLATFORM = "tiktok"
TARGET_ACCOUNT = "@mi_cuenta_tiktok"

# 1. CREAR POST
def create_post(video_path, caption, tags):
    response = requests.post(f"{BASE_URL}/api/submit", json={
        'botId': BOT_ID,
        'platform': PLATFORM,
        'targetAccount': TARGET_ACCOUNT,
        'videoPath': video_path,
        'caption': caption,
        'tags': tags,
    })

    return response.json()

# 2. ESPERAR APROBACIÓN
def wait_approval(post_id, timeout=3600):
    start = time.time()

    while time.time() - start < timeout:
        response = requests.get(f"{BASE_URL}/api/posts/{post_id}")
        post = response.json()

        if post['status'] == 'approved':
            return 'approved', post
        elif post['status'] == 'rejected':
            return 'rejected', post.get('rejectReason')

        time.sleep(10)

    return 'timeout', None

# 3. ESPERAR PUBLICACIÓN (Dashboard lo hace)
def wait_tiktok_publication(post_id, timeout=7200):
    start = time.time()

    while time.time() - start < timeout:
        response = requests.get(f"{BASE_URL}/api/posts/{post_id}")
        post = response.json()

        if post.get('tiktokPublished'):
            return 'published', post

        time.sleep(30)

    return 'timeout', None

# EJECUTAR
if __name__ == "__main__":
    # Crear
    result = create_post("/path/to/video.mp4", "Video!", ["viral"])
    post_id = result['post']['id']
    print(f"✅ Post creado: {post_id}")

    # Esperar aprobación
    status, data = wait_approval(post_id)

    if status == 'approved':
        print("✅ Aprobado! Esperando publicación en TikTok...")

        # TikTok: El dashboard publica automáticamente
        pub_status, pub_data = wait_tiktok_publication(post_id)

        if pub_status == 'published':
            print(f"✅ Publicado en TikTok: {pub_data.get('tiktokUrl')}")
        else:
            print("⏳ Aún no publicado...")

    elif status == 'rejected':
        print(f"❌ Rechazado: {data}")

        # Obtener info del rechazo
        rejected = requests.get(f"{BASE_URL}/api/rejected?botId={BOT_ID}").json()

        for post in rejected:
            if post['id'] == post_id:
                print(f"Razón: {post['rejectReason']}")
                print(f"Target: {post['targetAccount']}")

                # Corregir y reenviar...
                # Luego eliminar:
                # requests.delete(f"{BASE_URL}/api/posts/{post_id}")
```

### Instagram

```python
# Instagram: El bot publica después de que el usuario marque como listo
if __name__ == "__main__":
    result = create_post("/path/to/video.mp4", "Video!", ["viral"])
    post_id = result['post']['id']

    status, data = wait_approval(post_id)

    if status == 'approved':
        print("✅ Aprobado! Esperando flag de Instagram...")

        # Esperar a que el usuario marque como listo
        while True:
            response = requests.get(f"{BASE_URL}/api/posts/{post_id}")
            post = response.json()

            if post.get('instagramPublishReady'):
                print("✅ Listo para Instagram! Publicando...")

                # Publicar (tu código)
                pub_result = publish_to_instagram(
                    post['videoPath'],
                    post['caption'],
                    post['targetAccount']
                )

                # Confirmar
                requests.patch(f"{BASE_URL}/api/publish", json={
                    'postId': post_id,
                    'platform': 'instagram',
                    'platformPostId': pub_result['id'],
                    'url': pub_result['url']
                })

                print("✅ Publicado en Instagram!")
                break

            time.sleep(30)
```

---

## 📋 Resumen por Plataforma

| Plataforma | ¿Quién publica? | Flujo del bot |
|------------|-----------------|---------------|
| **TikTok** | Dashboard (automático) | Crear → Esperar aprobación → Esperar publicación |
| **Instagram** | Bot (semiautomático) | Crear → Esperar aprobación → Esperar flag → Publicar → Confirmar |

---

## 🔗 API Endpoints

### POST /api/submit
Envía un nuevo post para aprobación.

**Body:**
```json
{
  "botId": "bot-1",
  "platform": "tiktok",
  "targetAccount": "@mi_cuenta",
  "videoPath": "/path/to/video.mp4",
  "mediaFiles": ["/path/to/img1.jpg", "/path/to/img2.jpg"],
  "caption": "Mi post! 🚀",
  "tags": ["viral", "trending"]
}
```

### GET /api/posts?status={status}
Lista posts por estado.

### GET /api/posts/{id}
Obtiene detalles de un post específico.

### DELETE /api/posts/{id}
Elimina un post (usar después de corregir rechazados).

### GET /api/rejected?botId={botId}
Obtiene posts rechazados con información completa para corregir.

### POST /api/publish
Marca un post como listo para Instagram.

**Body:**
```json
{
  "postId": "uuid",
  "platform": "instagram"
}
```

### PATCH /api/publish
Confirma publicación de Instagram o TikTok.

**Body:**
```json
{
  "postId": "uuid",
  "platform": "instagram",  // o "tiktok"
  "platformPostId": "ABC123",
  "url": "https://instagram.com/p/ABC123"
}
```

---

## 📋 Formato de Archivos

### meta.json (OBLIGATORIO)
```json
{
  "botId": "bot-1",
  "platform": "tiktok",
  "targetAccount": "@mi_cuenta",
  "caption": "Texto del post 🚀",
  "tags": ["tag1", "tag2"],
  "mediaFiles": ["/path/to/video.mp4"],
  "postId": "uuid",
  "createdAt": "2026-05-02T18:00:00Z"
}
```

### response.json (GENERADO POR PLATAFORMA)
```json
{
  "status": "approved",
  "postId": "uuid",
  "approvedAt": "2026-05-02T18:00:00Z"
}
```

### instagram-ready.json (GENERADO POR PLATAFORMA)
```json
{
  "status": "ready_for_instagram",
  "postId": "uuid",
  "targetAccount": "@mi_cuenta",
  "readyAt": "2026-05-02T18:05:00Z"
}
```

### published.json (GENERADO POR PLATAFORMA)
```json
{
  "status": "published_on_tiktok",  // o "published_on_instagram"
  "postId": "uuid",
  "platformPostId": "7123456789",
  "url": "https://tiktok.com/@user/video/7123456789",
  "publishedAt": "2026-05-02T18:30:00Z"
}
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué TikTok es diferente?
TikTok requiere OAuth y el access_token se guarda en el dashboard. Los bots no tienen acceso a ese token, así que el dashboard publica directamente.

### ¿Cómo sé si el post está listo para Instagram?
- Verificar `instagramPublishReady: true` en el post
- O verificar que existe `instagram-ready.json` en la carpeta

### ¿Qué hago con posts rechazados?
1. Obtenerlos via `GET /api/rejected`
2. Leer el `rejectReason`
3. Corregir el contenido
4. Crear nuevo post con `POST /api/submit`
5. Eliminar el post rechazado con `DELETE /api/posts/{id}`

### ¿Puedo publicar en TikTok desde el bot?
No. El access_token está en el dashboard por seguridad. El dashboard publica directamente.

---

**¡Buena suerte! 🚀**