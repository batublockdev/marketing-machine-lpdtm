# Marketing Machine LPDTM - Documentación

## Arquitectura del Sistema

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│    BOTS     │────▶│    INBOX     │◀────│  DASHBOARD  │
│  (creadores)│     │  (archivos)  │     │   (web UI)  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                      │
                           ▼                      │
                    ┌──────────────┐            │
                    │   WATCHER    │────────────┘
                    │ (procesador) │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   DATABASE   │
                    │   (SQLite)   │
                    └──────────────┘
```

## Estructura de Directorios

```
marketing-machine-lpdtm/
├── inbox/                          # Entrada de contenido
│   ├── bot-1/
│   │   ├── tiktok/
│   │   │   └── post-001/
│   │   │       ├── video.mp4       # Archivo de media
│   │   │       ├── meta.json       # Metadata del post
│   │   │       ├── response.json   # Respuesta (aprobado/rechazado)
│   │   │       └── published.json   # Confirmación de publicación
│   │   └── instagram/
│   ├── bot-2/
│   └── bot-3/
├── approved/                       # Posts aprobados (movidos aquí)
├── rejected/                       # Posts rechazados (movidos aquí)
├── published/                      # Posts publicados (logs)
├── stats/                          # Estadísticas por bot
│   ├── bot-1.json
│   ├── bot-2.json
│   └── bot-3.json
└── dashboard/                       # Aplicación web
    ├── src/
    ├── watcher/
    └── prisma/
```

## Flujo de Trabajo

### 1. Envío de contenido (Bot → Plataforma)

El bot crea una carpeta con archivos:

```bash
mkdir -p inbox/bot-1/tiktok/post-001/
cp video.mp4 inbox/bot-1/tiktok/post-001/
echo '{"caption": "Mi video!", "tags": ["viral"]}' > inbox/bot-1/tiktok/post-001/meta.json
```

### 2. Procesamiento automático

El **watcher** detecta el `meta.json` y:
- Registra el post en la base de datos
- Lo marca como `pending`
- Lo muestra en el dashboard

### 3. Aprobación/Rechazo (Dashboard → Bot)

Cuando el humano aprueba o rechaza:

```json
// response.json (aprobado)
{
  "status": "approved",
  "postId": "uuid",
  "approvedAt": "2026-04-30T03:00:00Z"
}

// response.json (rechazado)
{
  "status": "rejected",
  "postId": "uuid",
  "rejectReason": "El texto no se lee bien"
}
```

### 4. Publicación (Bot → Red social)

El bot detecta `response.json` con `status: "approved"`:
1. Lee el archivo de media
2. Publica en la red social usando sus credenciales
3. Escribe `published.json`:

```json
{
  "status": "published",
  "postId": "uuid",
  "publishedAt": "2026-04-30T03:30:00Z",
  "platformPostId": "7123456789",
  "url": "https://tiktok.com/@user/video/7123456789"
}
```

### 5. Estadísticas

El bot actualiza periódicamente `stats/bot-1.json`:

```json
{
  "botId": "bot-1",
  "tiktok": {
    "posts": 15,
    "views": 125000,
    "likes": 8500,
    "shares": 320,
    "comments": 450
  },
  "instagram": {
    "posts": 8,
    "views": 45000,
    "likes": 3200,
    "shares": 120,
    "comments": 180
  }
}
```

## API REST

### Obtener posts pendientes
```
GET /api/posts?status=pending
```

### Obtener posts aprobados
```
GET /api/posts?status=approved
```

### Aprobar post
```
PATCH /api/posts/:id
{
  "status": "approved"
}
```

### Rechazar post
```
PATCH /api/posts/:id
{
  "status": "rejected",
  "rejectReason": "Motivo del rechazo"
}
```

### Obtener media
```
GET /api/media?path=/absolute/path/to/file.mp4
```

## Comandos

### Iniciar dashboard
```bash
cd dashboard
npm run dev
# Dashboard disponible en http://localhost:3000
```

### Iniciar watcher
```bash
cd dashboard
npm run watcher
# Monitorea inbox/ para nuevos posts
```

### Iniciar tunnel (Cloudflare)
```bash
cloudflared tunnel --url http://localhost:3000
# URL pública disponible para acceso remoto
```

## Formato de Archivos

### meta.json (obligatorio)
```json
{
  "caption": "Texto del post #hashtag",
  "tags": ["tag1", "tag2"],
  "type": "video",           // "video" o "carousel"
  "mediaCount": 5,           // solo para carousel
  "scheduled_time": null     // opcional
}
```

### response.json (generado por la plataforma)
```json
{
  "status": "approved" | "rejected",
  "postId": "uuid",
  "approvedAt": "ISO-date",
  "rejectReason": "texto"    // solo si rejected
}
```

### published.json (generado por el bot)
```json
{
  "status": "published",
  "postId": "uuid",
  "publishedAt": "ISO-date",
  "platformPostId": "id-en-plataforma",
  "url": "https://..."
}
```

## Próximos Pasos

1. **Integración TikTok API** - Conectar con la API oficial de TikTok para publicación directa
2. **Integración Instagram API** - Conectar con Instagram Graph API
3. **Autenticación de bots** - Sistema de tokens para identificar bots
4. **Webhooks** - Notificaciones HTTP en lugar de polling de archivos
5. **Cola de publicación** - Programar publicaciones en horarios específicos