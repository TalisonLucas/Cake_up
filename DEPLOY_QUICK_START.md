# 🚀 Quick Start: Vercel + ngrok

## Setup Rápido

### 1. Backend (ngrok)
```bash
# Terminal 1
cd backend
python manage.py runserver

# Terminal 2
ngrok http 8000
# Copie a URL: https://psilotic-sergio-cowardly.ngrok-free.dev
```

### 2. Frontend (Vercel)

#### Via Painel Web:
1. Acesse: https://vercel.com
2. Vá em: **Settings** → **Environment Variables**
3. Adicione:
   - `VITE_API_URL` = `https://psilotic-sergio-cowardly.ngrok-free.dev/api`
   - `VITE_WS_URL` = `https://psilotic-sergio-cowardly.ngrok-free.dev`

#### Via CLI:
```bash
cd frontend
vercel env add VITE_API_URL production
# Digite: https://psilotic-sergio-cowardly.ngrok-free.dev/api

vercel env add VITE_WS_URL production
# Digite: https://psilotic-sergio-cowardly.ngrok-free.dev

vercel --prod
```

### 3. CORS (Backend)

Edite `backend/config/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://seu-projeto.vercel.app",  # ← Adicione aqui
]
```

Reinicie o Django.

### 4. Testar

1. Acesse seu projeto no Vercel
2. Faça login
3. Abra o console do navegador (F12)
4. Verifique: `WebSocket conectado` ✅

## ⚠️ Quando ngrok mudar a URL

1. Atualize as variáveis no Vercel
2. Faça redeploy (ou aguarde automático)

## 📚 Documentação Completa

- `VERCEL_SETUP.md` - Guia completo
- `NGROK_SETUP.md` - Configuração do ngrok

