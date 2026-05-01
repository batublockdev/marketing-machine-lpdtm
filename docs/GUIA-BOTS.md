# 📖 Guía para Bots - Marketing Machine LPDTM

Esta guía explica cómo los bots deben interactuar con la plataforma de aprobación de contenido.

---

## 🎯 Resumen del Flujo

```
BOT → INBOX (meta.json) → DASHBOARD → APROBACIÓN → PUBLICACIÓN → STATS
                                   ↓                      ↓
                            response.json          DIFERENTE POR PLATAFORMA
```

---

## ⚠️ IMPORTANTE: Diferencias por Plataforma

### 📱 TikTok
- **Los bots NO publican** - El dashboard publica directamente usando OAuth
- Solo generan el contenido y esperan aprobación
- El dashboard usa el access_token para subir el video via Content Posting API

### 📸 Instagram / Otras
- Los bots publican manualmente después de aprobación
- Usar API de Instagram Graph o herramientas externas

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
├── stats/
│   └── {bot-id}.json              # Stats del bot (backup)
└── dashboard/                      # No tocar
```

---

## 🚀 Paso 1: Enviar Contenido

Crear carpeta con el contenido:

```bash
POST_ID="post-$(date +%s)"
BOT_ID="bot-1"
PLATFORM="tiktok"  # o "instagram"

mkdir -p inbox/$BOT_ID/$PLATFORM/$POST_ID

# Para video:
cp mi_video.mp4 inbox/$BOT_ID/$PLATFORM/$POST_ID/video.mp4

# Para carrusel:
cp imagen1.jpg inbox/$BOT_ID/$PLATFORM/$POST_ID/image1.jpg
cp imagen2.jpg inbox/$BOT_ID/$PLATFORM/$POST_ID/image2.jpg

# Crear metadata:
cat > inbox/$BOT_ID/$PLATFORM/$POST_ID/meta.json << 'EOF'
{
  "caption": "Mi video! 🚀 #viral",
  "tags": ["viral", "trending"],
  "type": "video"
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
  "approvedAt": "2026-04-30T03:00:00Z"
}
```

**response.json (rechazado):**
```json
{
  "status": "rejected",
  "postId": "uuid-del-post",
  "rejectReason": "Mejorar la iluminación del video"
}
```

---

## 📤 Paso 3: Publicar

### 📱 TikTok - AUTOMÁTICO (Dashboard publica)

**Los bots NO publican en TikTok.** El dashboard lo hace automáticamente.

Después de aprobado, el usuario hace click en "Publicar en TikTok" desde el dashboard y:
1. El dashboard usa el access_token guardado
2. Sube el video via TikTok Content Posting API
3. Marca el post como publicado

**El bot solo debe:**
1. Esperar aprobación (`response.json` con status='approved')
2. Esperar publicación (`published.json` o consultar API)
3. Actualizar estadísticas después

```python
# TikTok: Solo esperar y monitorear
def wait_for_publication_tiktok(post_dir, timeout=7200):
    """Espera a que el dashboard publique"""
    published_path = os.path.join(post_dir, "published.json")
    start = time.time()
    
    while time.time() - start < timeout:
        if os.path.exists(published_path):
            with open(published_path) as f:
                data = json.load(f)
            return 'published', data
        
        time.sleep(30)
    
    return 'timeout', None
```

### 📸 Instagram - MANUAL (Bot publica)

Para Instagram, el bot debe publicar después de aprobación:

```python
import requests

def mark_as_published(post_id, platform_post_id, url):
    """
    Marca el post como publicado y actualiza stats iniciales.
    
    Endpoint: POST /api/publish
    """
    response = requests.post(
        'http://TU_DASHBOARD_URL/api/publish',
        json={
            'postId': post_id,
            'platformPostId': platform_post_id,  # ID en Instagram
            'url': url,  # URL pública del post
            'stats': {
                'views': 0,
                'likes': 0,
                'shares': 0,
                'comments': 0
            }
        }
    )
    
    return response.json()

# Ejemplo Instagram después de publicar:
result = mark_as_published(
    post_id='abc-123',
    platform_post_id='instagram-post-id',
    url='https://instagram.com/p/ABC123'
)
```

---

## 📊 Paso 4: Actualizar Estadísticas (API)

Actualizar periódicamente (cada hora o después de cambios):

```python
import requests

def update_post_stats(post_id, views, likes, shares, comments):
    """
    Actualiza estadísticas de un post específico.
    
    Endpoint: PATCH /api/publish
    """
    response = requests.patch(
        'http://TU_DASHBOARD_URL/api/publish',
        json={
            'postId': post_id,
            'views': views,
            'likes': likes,
            'shares': shares,
            'comments': comments
        }
    )
    
    return response.json()

def update_bot_stats(bot_id, platform, posts, views, likes, shares, comments):
    """
    Actualiza estadísticas globales del bot.
    
    Endpoint: POST /api/stats
    """
    response = requests.post(
        'http://TU_DASHBOARD_URL/api/stats',
        json={
            'botId': bot_id,
            'platform': platform,
            'posts': posts,
            'views': views,
            'likes': likes,
            'shares': shares,
            'comments': comments
        }
    )
    
    return response.json()

# Ejemplo: actualizar cada hora
while True:
    stats = get_stats_from_api()  # Tu código para obtener stats
    update_post_stats(post_id, **stats)
    time.sleep(3600)
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

# 1. CREAR POST
def create_post(video_path, caption, tags):
    post_id = f"post-{int(time.time())}"
    post_dir = f"inbox/{BOT_ID}/{PLATFORM}/{post_id}"
    
    os.makedirs(post_dir, exist_ok=True)
    os.system(f"cp {video_path} {post_dir}/video.mp4")
    
    with open(f"{post_dir}/meta.json", 'w') as f:
        json.dump({'caption': caption, 'tags': tags, 'type': 'video'}, f)
    
    return post_id, post_dir

# 2. ESPERAR APROBACIÓN
def wait_approval(post_dir):
    response_path = f"{post_dir}/response.json"
    
    for _ in range(360):  # 1 hora
        if os.path.exists(response_path):
            with open(response_path) as f:
                data = json.load(f)
            
            if data['status'] == 'approved':
                return 'approved', data['postId']
            elif data['status'] == 'rejected':
                return 'rejected', data.get('rejectReason')
        
        time.sleep(10)
    
    return 'timeout', None

# 3. ESPERAR PUBLICACIÓN (Dashboard lo hace)
def wait_publication(post_dir):
    published_path = f"{post_dir}/../published.json"
    
    for _ in range(720):  # 2 horas
        if os.path.exists(published_path):
            with open(published_path) as f:
                return json.load(f)
        
        time.sleep(10)
    
    return None

# EJECUTAR
if __name__ == "__main__":
    # Crear
    post_id, post_dir = create_post("video.mp4", "Video!", ["viral"])
    print(f"✅ Post creado: {post_id}")
    
    # Esperar aprobación
    status, data = wait_approval(post_dir)
    
    if status == 'approved':
        print("✅ Aprobado! Esperando publicación...")
        post_uuid = data
        
        # TikTok: El dashboard publica automáticamente
        published = wait_publication(post_dir)
        
        if published:
            print(f"✅ Publicado en TikTok: {published.get('url')}")
            
            # Actualizar stats
            update_post_stats(post_uuid, views=0, likes=0, shares=0, comments=0)
        else:
            print("⏳ Aún no publicado...")
    
    elif status == 'rejected':
        print(f"❌ Rechazado: {data}")
```

### Instagram

```python
# Instagram: El bot publica manualmente
if __name__ == "__main__":
    post_id, post_dir = create_post("video.mp4", "Video!", ["viral"])
    
    status, data = wait_approval(post_dir)
    
    if status == 'approved':
        post_uuid = data
        
        # Publicar en Instagram (tu código)
        result = publish_to_instagram(post_dir)
        
        # Marcar como publicado en dashboard
        requests.post(f"{BASE_URL}/api/publish", json={
            'postId': post_uuid,
            'platformPostId': result['id'],
            'url': result['url']
        })
        
        print("✅ Publicado!")
```

---

## 📋 Resumen por Plataforma

| Plataforma | ¿Quién publica? | Flujo del bot |
|------------|-----------------|---------------|
| **TikTok** | Dashboard (automático) | Crear → Esperar aprobación → Esperar publicación |
| **Instagram** | Bot (manual) | Crear → Esperar aprobación → Publicar → Marcar publicado |
| **YouTube** | Bot (manual) | Crear → Esperar aprobación → Publicar → Marcar publicado |
| **Twitter/X** | Bot (manual) | Crear → Esperar aprobación → Publicar → Marcar publicado |

---

## 📋 Formato de Archivos

### meta.json (OBLIGATORIO)
```json
{
  "caption": "Texto del post 🚀",
  "tags": ["tag1", "tag2"],
  "type": "video",
  "mediaCount": 1
}
```

### response.json (GENERADO POR PLATAFORMA)
```json
{
  "status": "approved",
  "postId": "uuid",
  "approvedAt": "2026-04-30T03:00:00Z"
}
```

### published.json (GENERADO POR PLATAFORMA PARA TIKTOK)
```json
{
  "status": "published",
  "postId": "post-123",
  "publishedAt": "2026-04-30T03:30:00Z",
  "platformPostId": "7123456789",
  "url": "https://tiktok.com/@user/video/7123456789"
}
```

---

## 🔗 API Endpoints

### POST /api/publish
Marca un post como publicado y actualiza stats.

**Body:**
```json
{
  "postId": "uuid",
  "platformPostId": "7123456789",
  "url": "https://...",
  "stats": { "views": 0, "likes": 0, "shares": 0, "comments": 0 }
}
```

### PATCH /api/publish
Actualiza estadísticas de un post específico.

**Body:**
```json
{
  "postId": "uuid",
  "views": 12500,
  "likes": 850,
  "shares": 45,
  "comments": 67
}
```

### POST /api/stats
Actualiza estadísticas globales del bot.

**Body:**
```json
{
  "botId": "bot-1",
  "platform": "tiktok",
  "posts": 15,
  "views": 125000,
  "likes": 8500,
  "shares": 320,
  "comments": 450
}
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué TikTok es diferente?
TikTok requiere OAuth y el access_token se guarda en el dashboard. Los bots no tienen acceso a ese token, así que el dashboard publica directamente.

### ¿Qué pasa si el dashboard no publica?
El post queda en status "approved". El usuario debe hacer click en "Publicar en TikTok" desde el dashboard.

### ¿Cómo sé si ya se publicó en TikTok?
- Verificar `published.json` en la carpeta del post
- O consultar API: `GET /api/posts/{postId}`

### ¿Puedo forzar la publicación desde el bot?
No para TikTok. El access_token está en el dashboard por seguridad.

---

**¡Buena suerte! 🚀**