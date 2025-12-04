# 🧪 Testando Backend com ngrok

## Verificação Rápida

### 1. Verificar se o Django está rodando

```bash
# Teste local
curl http://127.0.0.1:8000/api/health/
```

Deve retornar:
```json
{
  "status": "ok",
  "message": "Cake Up API is running!",
  "version": "1.0.0"
}
```

### 2. Verificar ngrok

Acesse: http://localhost:4040 (Interface web do ngrok)

Você deve ver:
- Status: **online**
- URL: `https://psilotic-sergio-cowardly.ngrok-free.dev`
- Forwarding: `https://... → http://localhost:8000`

### 3. Testar via ngrok

Substitua `YOUR_NGROK_URL` pela URL do seu ngrok:

```bash
# Health Check
curl https://psilotic-sergio-cowardly.ngrok-free.dev/api/health/

# Documentação da API
# Abra no navegador:
https://psilotic-sergio-cowardly.ngrok-free.dev/api/docs/
```

### 4. Endpoints Disponíveis

- **Health Check**: `/api/health/`
- **Documentação Swagger**: `/api/docs/`
- **Documentação ReDoc**: `/api/redoc/`
- **Schema JSON**: `/api/schema/`
- **Admin**: `/admin/`
- **Auth**: `/api/auth/`
- **Products**: `/api/products/`
- **Orders**: `/api/orders/`
- **Chat**: `/api/chat/`
- **Reports**: `/api/reports/`

### 5. Testar Login

```bash
curl -X POST https://psilotic-sergio-cowardly.ngrok-free.dev/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 6. Configurar CORS para Vercel

No `backend/config/settings.py`, adicione a URL do seu projeto Vercel:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://seu-projeto.vercel.app",  # ← Adicione aqui
]
```

**Importante**: Reinicie o Django após alterar o CORS!

### 7. Verificar WebSocket

O WebSocket está disponível em:
```
wss://psilotic-sergio-cowardly.ngrok-free.dev/ws/orders/
```

## Troubleshooting

### Erro 404 na raiz `/`

✅ **Normal!** O Django não tem rota na raiz. Use `/api/docs/` ou `/api/health/`

### ngrok mostra "offline"

1. Verifique se o Django está rodando: `python manage.py runserver`
2. Verifique se está na porta 8000
3. Reinicie o ngrok

### CORS bloqueando requisições

1. Adicione a URL do Vercel ao `CORS_ALLOWED_ORIGINS`
2. Reinicie o Django
3. Verifique se está usando `https://` (não `http://`)

### WebSocket não conecta

1. Verifique se o ngrok está usando HTTPS
2. Use `wss://` (não `ws://`)
3. Verifique os logs do ngrok: http://localhost:4040

## Checklist

- [ ] Django rodando em `http://localhost:8000`
- [ ] ngrok expondo a porta 8000
- [ ] Health check funcionando via ngrok
- [ ] CORS configurado com URL do Vercel
- [ ] Variáveis de ambiente no Vercel atualizadas
- [ ] Frontend no Vercel conectando ao backend

