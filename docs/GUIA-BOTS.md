# 📖 Guía para Bots - Marketing Machine LPDTM

Esta guía explica cómo los bots deben interactuar con la plataforma de aprobación de contenido.

---

## 🎯 Resumen del Flujo

```
BOT → API UPLOAD → DASHBOARD → APROBACIÓN → PUBLICACIÓN → LIMPIEZA (48h)
                              ↓                      ↓
                         response.json          DIFERENTE POR PLATAFORMA
```

---

## 🆕 NUEVO: API de Upload

**Los bots YA NO guardan archivos en carpetas locales.**

Ahora deben enviar el contenido via API HTTP al dashboard:

```
POST https://marketing-machine-lpdtm-production.up.railway.app/api/posts/upload
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

## 🚀 Paso 1: Enviar Contenido (API Upload)

### Endpoint

```
POST /api/posts/upload
Content-Type: multipart/form-data
```

### Parámetros

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `botId` | string | ✅ | ID del bot (ej: "trustapp", "bot-1") |
| `platform` | string | ✅ | Plataforma (ej: "tiktok", "instagram") |
| `caption` | string | ❌ | Caption del post |
| `tags` | string | ❌ | JSON array de tags (ej: '["aur","ahorro"]') |
| `media` | File[] | ✅ | Archivos de video/imagen (puede ser múltiple) |

### Ejemplo (curl)

```bash
curl -X POST https://marketing-machine-lpdtm-production.up.railway.app/api/posts/upload \
  -F "botId=trustapp" \
  -F "platform=tiktok" \
  -F "caption=Ahorro grupal en WhatsApp 📱💰" \
  -F 'tags=["aur","ahorro","whatsapp"]' \
  -F "media=@/path/to/video.mp4"
```

### Ejemplo (Node.js)

```javascript
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

async function sendPost(videoPath, caption, tags) {
  const form = new FormData();
  form.append('botId', 'trustapp');
  form.append('platform', 'tiktok');
  form.append('caption', caption);
  form.append('tags', JSON.stringify(tags));
  form.append('media', fs.createReadStream(videoPath));

  const response = await axios.post(
    'https://marketing-machine-lpdtm-production.up.railway.app/api/posts/upload',
    form,
    { headers: form.getHeaders() }
  );

  return response.data;
}

// Uso:
const result = await sendPost(
  './video.mp4',
  'Ahorro grupal en WhatsApp 📱💰',
  ['aur', 'ahorro', 'whatsapp']
);

console.log('Post ID:', result.post.id);
```

### Ejemplo (Python)

```python
import requests

def send_post(video_path, caption, tags):
    url = 'https://marketing-machine-lpdtm-production.up.railway.app/api/posts/upload'
    
    files = {'media': open(video_path, 'rb')}
    data = {
        'botId': 'trustapp',
        'platform': 'tiktok',
        'caption': caption,
        'tags': str(tags)  # '["aur","ahorro"]'
    }
    
    response = requests.post(url, files=files, data=data)
    return response.json()

# Uso:
result = send_post('video.mp4', 'Ahorro grupal!', ['aur', 'ahorro'])
print(f"Post ID: {result['post']['id']}")
```

### Respuesta Exitosa

```json
{
  "success": true,
  "post": {
    "id": "a83a52d5-bea2-4f9f-9829-76f82b31a5ef",
    "botId": "trustapp",
    "platform": "tiktok",
    "caption": "Ahorro grupal en WhatsApp 📱💰",
    "tags": ["aur", "ahorro", "whatsapp"],
    "status": "pending",
    "createdAt": "2026-05-01T06:00:00.000Z"
  }
}
```

---

## ⏳ Paso 2: Esperar Aprobación

Consulta el estado del post:

```python
import requests
import time

def wait_for_approval(post_id, timeout=3600):
    """Espera hasta que el post sea aprobado o rechazado"""
    url = f'https://marketing-machine-lpdtm-production.up.railway.app/api/posts/{post_id}'
    start = time.time()
    
    while time.time() - start < timeout:
        response = requests.get(url)
        data = response.json()
        
        if data['status'] == 'approved':
            return 'approved', data
        elif data['status'] == 'rejected':
            return 'rejected', data.get('rejectReason')
        
        time.sleep(30)  # Check cada 30 segundos
    
    return 'timeout', None

# Uso:
status, data = wait_for_approval('a83a52d5-bea2-4f9f-9829-76f82b31a5ef')

if status == 'approved':
    print("✅ Aprobado! Listo para publicar.")
elif status == 'rejected':
    print(f"❌ Rechazado: {data}")
```

---

## 🗑️ Limpieza Automática

**IMPORTANTE:** Los posts se eliminan automáticamente 48 horas después de ser aprobados o rechazados.

- Esto libera espacio en el servidor
- El post queda en la base de datos pero los archivos físicos se borran
- Si necesitas conservar el video, descárgalo antes de las 48 horas

---

## 📤 Paso 3: Publicar

### 📱 TikTok - AUTOMÁTICO (Dashboard publica)

**Los bots NO publican en TikTok.** El usuario publica desde el dashboard.

Flujo:
1. Bot envía contenido via API
2. Usuario aprueba en dashboard
3. Usuario hace click en "Publicar en TikTok"
4. Dashboard publica automáticamente
5. Bot puede consultar el estado via API

```python
def check_publication(post_id):
    """Verifica si el post ya fue publicado"""
    url = f'https://marketing-machine-lpdtm-production.up.railway.app/api/posts/{post_id}'
    response = requests.get(url)
    data = response.json()
    
    if data['status'] == 'published':
        return {
            'url': data['publishedUrl'],
            'views': data['views'],
            'likes': data['likes']
        }
    
    return None
```

### 📸 Instagram - MANUAL (Bot publica)

Para Instagram, el bot debe publicar después de aprobación:

```python
import requests

def mark_as_published(post_id, platform_post_id, url):
    """
    Marca el post como publicado.
    
    Endpoint: PATCH /api/posts/{post_id}
    """
    response = requests.patch(
        f'https://marketing-machine-lpdtm-production.up.railway.app/api/posts/{post_id}',
        json={
            'status': 'published',
            'platformPostId': platform_post_id,
            'publishedUrl': url
        }
    )
    
    return response.json()

# Después de publicar en Instagram:
result = mark_as_published(
    post_id='a83a52d5-bea2-4f9f-9829-76f82b31a5ef',
    platform_post_id='17872345111111111',
    url='https://www.instagram.com/p/C7hXxYZ456/'
)
```

---

## 📊 Paso 4: Actualizar Estadísticas

```python
import requests

def update_stats(post_id, views, likes, shares, comments):
    """Actualiza estadísticas de un post"""
    response = requests.patch(
        f'https://marketing-machine-lpdtm-production.up.railway.app/api/posts/{post_id}',
        json={
            'views': views,
            'likes': likes,
            'shares': shares,
            'comments': comments
        }
    )
    
    return response.json()

# Ejemplo: actualizar cada hora
while True:
    stats = get_stats_from_instagram_api()  # Tu código
    update_stats(post_id, **stats)
    time.sleep(3600)
```

---

## 🔄 Flujo Completo

### TikTok

```python
import requests
import time

BASE_URL = 'https://marketing-machine-lpdtm-production.up.railway.app'
BOT_ID = 'trustapp'
PLATFORM = 'tiktok'

# 1. ENVIAR POST
def create_post(video_path, caption, tags):
    files = {'media': open(video_path, 'rb')}
    data = {
        'botId': BOT_ID,
        'platform': PLATFORM,
        'caption': caption,
        'tags': str(tags)
    }
    
    response = requests.post(f'{BASE_URL}/api/posts/upload', files=files, data=data)
    result = response.json()
    
    if result['success']:
        return result['post']['id']
    
    raise Exception(result.get('error', 'Failed to create post'))

# 2. ESPERAR APROBACIÓN
def wait_approval(post_id):
    for _ in range(720):  # 2 horas (30s * 720)
        response = requests.get(f'{BASE_URL}/api/posts/{post_id}')
        data = response.json()
        
        if data['status'] == 'approved':
            return 'approved', data
        elif data['status'] == 'rejected':
            return 'rejected', data.get('rejectReason')
        
        time.sleep(30)
    
    return 'timeout', None

# 3. ESPERAR PUBLICACIÓN (Dashboard publica)
def wait_publication(post_id):
    for _ in range(1440):  # 12 horas (30s * 1440)
        response = requests.get(f'{BASE_URL}/api/posts/{post_id}')
        data = response.json()
        
        if data['status'] == 'published':
            return data
        
        time.sleep(30)
    
    return None

# EJECUTAR
if __name__ == "__main__":
    # Crear
    post_id = create_post("video.mp4", "Video! 🚀", ["viral"])
    print(f"✅ Post creado: {post_id}")
    
    # Esperar aprobación
    status, data = wait_approval(post_id)
    
    if status == 'approved':
        print("✅ Aprobado! Esperando publicación...")
        
        # TikTok: El dashboard publica
        published = wait_publication(post_id)
        
        if published:
            print(f"✅ Publicado en TikTok: {published['publishedUrl']}")
        else:
            print("⏳ Aún no publicado...")
    
    elif status == 'rejected':
        print(f"❌ Rechazado: {data}")
```

### Instagram

```python
# Instagram: El bot publica manualmente
if __name__ == "__main__":
    post_id = create_post("video.mp4", "Video!", ["viral"])
    
    status, data = wait_approval(post_id)
    
    if status == 'approved':
        # Publicar en Instagram (tu código)
        result = publish_to_instagram('video.mp4')
        
        # Marcar como publicado
        mark_as_published(
            post_id=post_id,
            platform_post_id=result['id'],
            url=result['url']
        )
        
        print("✅ Publicado en Instagram!")
```

---

## 📋 Resumen por Plataforma

| Plataforma | ¿Quién publica? | Flujo del bot |
|------------|-----------------|---------------|
| **TikTok** | Dashboard (automático) | Enviar → Esperar aprobación → Esperar publicación |
| **Instagram** | Bot (manual) | Enviar → Esperar aprobación → Publicar → Marcar publicado |
| **YouTube** | Bot (manual) | Enviar → Esperar aprobación → Publicar → Marcar publicado |
| **Twitter/X** | Bot (manual) | Enviar → Esperar aprobación → Publicar → Marcar publicado |

---

## 🔗 API Endpoints

### POST /api/posts/upload
Sube un nuevo post.

**Body:** `multipart/form-data`
- `botId` (string, required)
- `platform` (string, required)
- `caption` (string, optional)
- `tags` (JSON string, optional)
- `media` (file[], required)

### GET /api/posts/{postId}
Obtiene información de un post.

### GET /api/posts?status=pending
Lista posts por estado (`pending`, `approved`, `rejected`, `published`).

### PATCH /api/posts/{postId}
Actualiza un post (estado, stats, etc.).

**Body:**
```json
{
  "status": "published",
  "platformPostId": "7123456789",
  "publishedUrl": "https://...",
  "views": 12500,
  "likes": 850
}
```

---

## 🗑️ Política de Retención

- **Posts pendientes:** Se eliminan después de 7 días sin aprobación
- **Posts aprobados/rechazados:** Los archivos se eliminan después de 48 horas
- **Posts publicados:** Los archivos se eliminan después de 48 horas
- **Base de datos:** Los registros se conservan indefinidamente

Para descargar un video antes de que se elimine:
```
GET /api/media?path=/app/uploads/{botId}/{platform}/{postId}/video.mp4
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué usar API en lugar de carpetas locales?
El dashboard ahora corre en Railway (cloud), no tiene acceso a tu sistema de archivos local.

### ¿Dónde se guardan los videos?
En el volumen persistente de Railway: `/app/uploads/`

### ¿Cuánto tiempo se conservan los videos?
48 horas después de aprobación/rechazo. Después se eliminan automáticamente.

### ¿Puedo conservar un video más tiempo?
No automáticamente. Descárgalo antes de las 48 horas si lo necesitas.

### ¿Qué pasa si el upload falla?
La API devuelve un error. El bot debe reintentar o registrar el error.

### ¿Hay límite de tamaño?
Sí, el límite está configurado en el servidor. Videos grandes pueden tardar más.

---

**¡Buena suerte! 🚀**