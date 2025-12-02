# 🚀 Configuración para Coolify

## 📋 Resumen del Proyecto

**Proyecto:** Sistema Mise en Place (Full-Stack React + Express)  
**Repositorio:** https://github.com/Drozast/mise-en-place  
**Tipo:** Aplicación Full-Stack con Dockerfile

---

## ⚙️ Configuración en Coolify

### 1. Crear Nueva Aplicación

1. En Coolify, click en **"+ New Resource"**
2. Selecciona **"Application"**
3. Elige **"Public Repository"**

### 2. Configuración del Repositorio

```
Repository URL: https://github.com/Drozast/mise-en-place
Branch: main
Build Pack: Dockerfile
```

### 3. Variables de Entorno

Agrega estas variables de entorno en Coolify:

```bash
NODE_ENV=production
PORT=3001
```

**Opcional:**
```bash
CORS_ORIGIN=*
```

### 4. Configuración de Puerto

```
Internal Port: 3001
```

### 5. Configuración de Volumen (IMPORTANTE para SQLite)

Para persistir la base de datos, agrega un volumen:

```
Source: /data
Destination: /app/data
```

Esto asegura que la base de datos SQLite persista entre deployments.

### 6. Health Check

Coolify detectará automáticamente el health check del Dockerfile:

```
Health Check URL: /api/health
```

---

## 🔧 Información Técnica

### Stack Tecnológico
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (persiste en volumen)
- **Real-time:** Socket.io

### Puertos
- **Puerto interno:** 3001 (el que expone el container)
- **Puerto público:** El que asigne Coolify (usualmente 80/443)

### Build Process
1. **Stage 1 (Builder):**
   - Instala todas las dependencias
   - Compila el frontend con Vite
   - Genera carpeta `dist/`

2. **Stage 2 (Production):**
   - Instala solo dependencias de producción
   - Copia el build del frontend
   - Copia código del servidor
   - Inicia el servidor Node.js

### Comandos
```bash
Build: npm ci && npm run build
Start: npm start
```

---

## 📁 Estructura de Archivos Importantes

```
mise-en-place/
├── Dockerfile              # Multi-stage build configuration
├── .dockerignore          # Files to exclude from Docker
├── docker-compose.yml     # Para testing local
├── .env.example          # Template de variables
├── package.json          # Dependencies y scripts
├── dist/                 # Frontend build (generado)
│   └── index.html
├── server/              # Backend Express
│   ├── index.ts
│   └── ...
└── data/               # SQLite database (volumen)
    └── pizza.db
```

---

## ✅ Checklist de Deployment

- [ ] Repositorio conectado a Coolify
- [ ] Variables de entorno configuradas
- [ ] Volumen `/app/data` configurado para persistencia
- [ ] Puerto 3001 configurado
- [ ] Build Pack: Dockerfile seleccionado
- [ ] Primera build exitosa
- [ ] Health check respondiendo
- [ ] Base de datos creada automáticamente
- [ ] Aplicación accesible vía URL pública

---

## 🧪 Testing Local con Docker

Antes de deployar a Coolify, puedes probar localmente:

```bash
# Build la imagen
docker build -t mise-en-place .

# Run el container
docker run -p 3001:3001 -v $(pwd)/data:/app/data mise-en-place

# O usando docker-compose
docker-compose up
```

Accede a: http://localhost:3001

---

## 🔐 Usuarios por Defecto

La aplicación crea automáticamente usuarios de prueba:

**Chef/Admin:**
- RUT: `11111111-1`
- Password: `1111`

**Empleado:**
- RUT: `22222222-2`
- Password: `2222`

---

## 🐛 Troubleshooting

### Error: Base de datos no persiste
**Solución:** Verifica que el volumen `/app/data` esté configurado

### Error: CORS issues
**Solución:** Asegúrate que `NODE_ENV=production` esté configurado

### Error: Puerto no accesible
**Solución:** Verifica que el puerto interno sea 3001

### Error: Build falla
**Solución:** Revisa los logs de Coolify. Asegúrate que tiene suficiente memoria (mínimo 2GB)

---

## 📊 Monitoreo

Health Check Endpoint: `http://your-app.coolify.app/api/health`

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-11-30T..."
}
```

---

## 🔄 Auto-Deploy Configuration

### Configurar Webhook de GitHub

Para que Coolify detecte automáticamente los cambios en GitHub:

1. **En Coolify:**
   - Ve a tu aplicación
   - Click en la pestaña "Webhooks"
   - Copia el "Webhook URL" que Coolify te proporciona

2. **En GitHub:**
   - Ve a tu repositorio: https://github.com/Drozast/mise-en-place
   - Click en **Settings** → **Webhooks** → **Add webhook**
   - Pega el Webhook URL de Coolify
   - Content type: `application/json`
   - Events: Selecciona "Just the push event"
   - Click en **Add webhook**

3. **Activar Auto-Deploy en Coolify:**
   - En tu aplicación de Coolify
   - Ve a **General** settings
   - Activa la opción **"Auto Deploy"**
   - Selecciona la rama: `main`

### Verificar que funciona:

1. Haz un cambio pequeño en el código
2. `git add . && git commit -m "test auto-deploy" && git push`
3. Ve a Coolify y verifica que se inicie el deploy automáticamente

### Si no funciona:

**Opción A: Re-deployar manualmente**
- Click en "Deploy" en Coolify cada vez que hagas push

**Opción B: Verificar webhook**
- En GitHub → Settings → Webhooks
- Click en el webhook
- Ver "Recent Deliveries" para debug

**Opción C: Usar GitHub Actions** (alternativa más confiable)

Si el webhook directo no funciona, usa GitHub Actions:

1. **Obtener Webhook URL de Coolify:**
   - En Coolify → tu aplicación → Webhooks
   - Copia el "Webhook URL"

2. **Configurar Secret en GitHub:**
   - Ve a tu repo: https://github.com/Drozast/mise-en-place
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `COOLIFY_WEBHOOK_URL`
   - Value: Pega la URL del webhook de Coolify
   - Save

3. **El workflow ya está configurado:**
   - Archivo: `.github/workflows/deploy-coolify.yml`
   - Se ejecuta automáticamente en cada push a `main`

4. **Verificar:**
   - Haz push de cambios
   - Ve a GitHub → Actions
   - Verifica que el workflow se ejecute correctamente

---

## 💾 Backup de Base de Datos

La base de datos está en: `/app/data/pizza.db`

Para hacer backup:
```bash
# Desde Coolify terminal
cp /app/data/pizza.db /app/data/pizza-backup-$(date +%Y%m%d).db
```

---

## 📝 Notas Adicionales

- La aplicación usa SQLite, ideal para operaciones pequeñas/medianas
- Los archivos estáticos del frontend se sirven desde el mismo puerto que la API
- Socket.io está configurado para real-time updates
- La base de datos se inicializa automáticamente en el primer arranque

---

**Documentación completa:** https://github.com/Drozast/mise-en-place
