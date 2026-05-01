# Bot Upload API

Los bots deben enviar contenido al dashboard usando este endpoint:

## Endpoint

```
POST /api/posts/upload
```

## Parámetros (multipart/form-data)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `botId` | string | ✅ | ID del bot (ej: "trustapp", "bot-1") |
| `platform` | string | ✅ | Plataforma (ej: "tiktok", "instagram") |
| `caption` | string | ❌ | Caption del post |
| `tags` | string | ❌ | JSON array de tags (ej: '["aur","ahorro"]') |
| `media` | File[] | ✅ | Archivos de video/imagen (puede ser múltiple) |

## Ejemplo (curl)

```bash
curl -X POST https://marketing-machine-lpdtm-production.up.railway.app/api/posts/upload \
  -F "botId=trustapp" \
  -F "platform=tiktok" \
  -F "caption=Ahorro grupal en WhatsApp 📱💰" \
  -F 'tags=["aur","ahorro","whatsapp"]' \
  -F "media=@/path/to/video.mp4"
```

## Ejemplo (Node.js)

```javascript
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

async function uploadPost(videoPath: string, caption: string) {
  const form = new FormData();
  form.append('botId', 'trustapp');
  form.append('platform', 'tiktok');
  form.append('caption', caption);
  form.append('tags', JSON.stringify(['aur', 'ahorro']));
  form.append('media', fs.createReadStream(videoPath));

  const response = await axios.post(
    'https://marketing-machine-lpdtm-production.up.railway.app/api/posts/upload',
    form,
    { headers: form.getHeaders() }
  );

  return response.data;
}
```

## Respuesta

```json
{
  "success": true,
  "post": {
    "id": "uuid",
    "botId": "trustapp",
    "platform": "tiktok",
    "caption": "...",
    "tags": ["aur", "ahorro"],
    "status": "pending",
    "createdAt": "2026-05-01T06:00:00.000Z"
  }
}
```

## Flujo

1. Bot genera contenido (video/imagen)
2. Bot envía POST a `/api/posts/upload`
3. Dashboard guarda archivo en `/app/uploads/{botId}/{platform}/{postId}/`
4. Dashboard guarda metadata en PostgreSQL
5. Dashboard muestra post como "pendiente"
6. Usuario aprueba/rechaza en el dashboard
7. Si se aprueba y es TikTok → usuario publica desde dashboard