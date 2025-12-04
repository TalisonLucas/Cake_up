# Configuração do Frontend no Vercel com Backend via ngrok

## Visão Geral

Este guia explica como configurar o frontend no Vercel para se conectar ao backend exposto via ngrok.

## Arquitetura

```
Frontend (Vercel) → Backend (ngrok) → Django (localhost:8000)
```

## Passo a Passo

### 1. Expor o Backend via ngrok

```bash
ngrok http 8000
```

Copie a URL gerada (ex: `https://psilotic-sergio-cowardly.ngrok-free.dev`)

### 2. Configurar Variáveis de Ambiente no Vercel

No painel do Vercel:

1. Acesse seu projeto
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```
VITE_API_URL=https://psilotic-sergio-cowardly.ngrok-free.dev/api
VITE_WS_URL=https://psilotic-sergio-cowardly.ngrok-free.dev
```

**Importante**: 
- Use a URL completa do ngrok (com `https://`)
- Não inclua `/api` na URL do WebSocket
- O código detecta automaticamente `wss://` para HTTPS

### 3. Configurar CORS no Backend

No `backend/config/settings.py`, adicione o domínio do Vercel:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    # Adicione a URL do seu projeto Vercel aqui
    "https://seu-projeto.vercel.app",
    # E também o domínio customizado se tiver
    "https://seu-dominio.com",
]
```

### 4. Deploy no Vercel

#### Opção A: Via CLI

```bash
cd frontend
npm install -g vercel
vercel
```

#### Opção B: Via GitHub (Recomendado)

1. Faça push do código para GitHub
2. Conecte o repositório no Vercel
3. Configure as variáveis de ambiente (passo 2)
4. Faça o deploy

### 5. Atualizar Variáveis quando ngrok mudar

⚠️ **IMPORTANTE**: URLs do ngrok mudam a cada reinicialização (plano gratuito).

Quando reiniciar o ngrok:

1. **Obtenha a nova URL do ngrok**
2. **Atualize no Vercel**:
   - Settings → Environment Variables
   - Edite `VITE_API_URL` e `VITE_WS_URL`
   - Use a nova URL do ngrok
3. **Redeploy** (ou aguarde o redeploy automático se configurado)

### 6. Configurar Redeploy Automático (Opcional)

Para facilitar, você pode criar um script que atualiza as variáveis automaticamente:

```bash
# Instalar Vercel CLI
npm install -g vercel

# Configurar variáveis via CLI
vercel env add VITE_API_URL production
vercel env add VITE_WS_URL production
```

## Configuração de Desenvolvimento vs Produção

### Desenvolvimento Local

Crie um arquivo `.env.local` no frontend:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

### Produção (Vercel)

Configure as variáveis no painel do Vercel (passo 2).

## Troubleshooting

### Frontend não conecta ao backend

1. Verifique se o ngrok está rodando: `http://localhost:4040`
2. Verifique se as variáveis de ambiente estão configuradas no Vercel
3. Verifique o console do navegador para erros
4. Verifique se o CORS está configurado corretamente

### WebSocket não conecta

1. Verifique se está usando `https://` na URL (não `http://`)
2. O código converte automaticamente para `wss://`
3. Verifique se o backend está rodando e acessível via ngrok
4. Verifique os logs do ngrok: `http://localhost:4040`

### Erro de CORS

1. Adicione a URL do Vercel ao `CORS_ALLOWED_ORIGINS`
2. Reinicie o servidor Django
3. Verifique se está usando `https://` (não `http://`)

### URLs do ngrok mudam frequentemente

**Solução temporária**: Use o plano pago do ngrok para URLs estáticas.

**Solução alternativa**: Configure um domínio personalizado no ngrok (requer plano pago).

## Estrutura de Arquivos

```
frontend/
  ├── .env.local          # Variáveis locais (não commitado)
  ├── env.example         # Exemplo de variáveis
  └── src/
      └── services/
          ├── api.ts      # Usa VITE_API_URL
          └── websocket.ts # Usa VITE_WS_URL
```

## Checklist de Deploy

- [ ] Backend rodando localmente na porta 8000
- [ ] ngrok expondo o backend (porta 8000)
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] CORS configurado no backend com URL do Vercel
- [ ] Frontend deployado no Vercel
- [ ] Testar conexão API
- [ ] Testar conexão WebSocket
- [ ] Verificar atualizações em tempo real

## Notas Importantes

1. **URLs do ngrok mudam**: Sempre que reiniciar o ngrok, atualize as variáveis no Vercel
2. **Redeploy necessário**: Após atualizar variáveis, pode ser necessário fazer redeploy
3. **CORS**: Sempre adicione novas URLs do Vercel ao CORS
4. **HTTPS**: Vercel sempre usa HTTPS, então o backend via ngrok também deve usar HTTPS

## Exemplo Completo

```bash
# Terminal 1: Backend
cd backend
python manage.py runserver

# Terminal 2: ngrok
ngrok http 8000
# URL gerada: https://abc123.ngrok-free.dev

# Terminal 3: Configurar Vercel
cd frontend
vercel env add VITE_API_URL production
# Digite: https://abc123.ngrok-free.dev/api

vercel env add VITE_WS_URL production
# Digite: https://abc123.ngrok-free.dev

# Deploy
vercel --prod
```

## Próximos Passos

Para uma solução mais permanente, considere:
- Deploy do backend em um serviço como Railway, Render, ou Heroku
- Usar um domínio fixo para o backend
- Configurar um banco de dados remoto

