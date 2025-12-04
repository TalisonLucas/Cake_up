# Configuração do ngrok para WebSocket em Tempo Real

## Visão Geral

Para usar o sistema de atualizações em tempo real via WebSocket através do ngrok, você precisa expor o **backend** (obrigatório). O frontend pode ser exposto separadamente ou acessado localmente.

## ⚠️ Importante: Por que o backend precisa ser exposto?

O WebSocket precisa de uma conexão **direta** com o servidor Django (backend). Não é possível usar apenas o frontend porque:

1. O WebSocket é uma conexão **persistente** entre o navegador e o servidor
2. O navegador faz a conexão WebSocket **diretamente** com o backend
3. Se o backend estiver apenas em `localhost`, não será acessível via internet
4. Navegadores bloqueiam conexões mistas (HTTPS → HTTP)

**Solução**: Expor o backend via ngrok é **obrigatório** para WebSocket funcionar via internet.

## Passo a Passo

### 1. Expor o Backend (Django - Porta 8000)

O backend precisa ser exposto porque o WebSocket se conecta diretamente ao servidor Django.

```bash
# Terminal 1 - Backend
ngrok http 8000
```

Isso gerará uma URL como: `https://xxxx-xxxx-xxxx.ngrok-free.dev`

### 2. Expor o Frontend (Vite - Porta 5173) - OPCIONAL

O frontend pode ser exposto via ngrok OU acessado localmente:

**Opção A: Expor via ngrok (recomendado para testes remotos)**
```bash
# Terminal 2 - Frontend
ngrok http 5173
```
Isso gerará uma URL como: `https://yyyy-yyyy-yyyy.ngrok-free.dev`

**Opção B: Acessar localmente**
- Se você estiver testando na mesma máquina, pode acessar `http://localhost:5173`
- O frontend se conectará ao backend via ngrok normalmente

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `frontend/` (copie de `frontend/env.example`):

```env
VITE_API_URL=https://xxxx-xxxx-xxxx.ngrok-free.dev/api
VITE_WS_URL=https://xxxx-xxxx-xxxx.ngrok-free.dev
```

**Importante**: 
- O código detecta automaticamente se deve usar `ws://` ou `wss://` baseado na URL fornecida
- Você pode usar `https://` ou `wss://` - ambos funcionam
- Use a mesma URL do backend para o WebSocket
- Não inclua `/api` na URL do WebSocket

### 4. Remover Aviso do ngrok (Opcional)

Para remover a página de aviso do ngrok, você pode:

#### Opção A: Adicionar header no frontend (Recomendado)

Atualize o `frontend/src/services/websocket.ts` para incluir o header:

```typescript
const wsUrl = `${this.url}?token=${token}`;
this.ws = new WebSocket(wsUrl, [], {
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});
```

**Nota**: WebSocket não suporta headers customizados diretamente. Use a query string ou configure no backend.

#### Opção B: Configurar no Backend Django

Adicione ao `backend/config/settings.py`:

```python
# Permitir ngrok
ALLOWED_HOSTS = ['*']  # Já está configurado

# Headers para ngrok
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
```

#### Opção C: Usar ngrok com domínio personalizado (Pago)

Upgrade para plano pago do ngrok para usar domínio personalizado sem avisos.

### 5. Configurar CORS no Backend

Certifique-se de que o backend permite conexões do frontend via ngrok:

```python
# backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    # Adicione a URL do ngrok do frontend aqui
    "https://yyyy-yyyy-yyyy.ngrok-free.dev",
]
```

### 6. Testar a Conexão

1. Inicie o backend Django:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. Inicie o frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Acesse o frontend através da URL do ngrok
4. Faça login e verifique se o WebSocket conecta (veja o console do navegador)

## Troubleshooting

### WebSocket não conecta

1. Verifique se está usando `wss://` (não `ws://`) para HTTPS
2. Verifique se a URL do WebSocket aponta para o backend (não o frontend)
3. Verifique os logs do ngrok para ver se há erros
4. Verifique o console do navegador para erros de conexão

### Erro de CORS

1. Adicione a URL do ngrok do frontend ao `CORS_ALLOWED_ORIGINS`
2. Reinicie o servidor Django

### Aviso do ngrok aparece

- Use um plano pago do ngrok
- Ou aceite o aviso (aparece apenas uma vez por visitante)

## Exemplo de Configuração Completa

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver
# Em outro terminal:
ngrok http 8000
# Copie a URL: https://abc123.ngrok-free.dev

# Terminal 2 - Frontend  
cd frontend
# Crie .env com (copie de env.example):
# VITE_API_URL=https://abc123.ngrok-free.dev/api
# VITE_WS_URL=https://abc123.ngrok-free.dev
# (O código detecta automaticamente wss:// para HTTPS)
npm run dev
# Em outro terminal:
ngrok http 5173
# Copie a URL: https://xyz789.ngrok-free.dev

# Acesse: https://xyz789.ngrok-free.dev
```

## Nota Importante

As URLs do ngrok mudam a cada reinicialização (no plano gratuito). Você precisará atualizar o arquivo `.env` sempre que reiniciar o ngrok do backend.

## Erros Comuns

### Erro: "The endpoint is already online" (ERR_NGROK_334)

Este erro significa que você já tem um túnel ngrok rodando com essa URL.

**Solução 1: Parar o túnel existente (Recomendado)**

1. Encontre o processo do ngrok:
   ```bash
   # Windows (PowerShell)
   Get-Process ngrok
   
   # Linux/Mac
   ps aux | grep ngrok
   ```

2. Pare o processo:
   ```bash
   # Windows (PowerShell)
   Stop-Process -Name ngrok
   
   # Linux/Mac
   killall ngrok
   # ou
   pkill ngrok
   ```

3. Ou simplesmente feche o terminal onde o ngrok está rodando (Ctrl+C)

4. Inicie novamente:
   ```bash
   ngrok http 8000
   ```

**Solução 2: Usar pooling (para múltiplos túneis)**

Se você realmente precisa de múltiplos túneis na mesma URL:

```bash
ngrok http 8000 --pooling-enabled
```

**Solução 3: Verificar túneis ativos**

Acesse o dashboard do ngrok para ver túneis ativos:
- Abra: http://localhost:4040 (interface web do ngrok)
- Ou use a API: `curl http://localhost:4040/api/tunnels`

**Solução 4: Usar porta diferente**

Se você precisa rodar múltiplos túneis, use portas diferentes:

```bash
# Terminal 1
ngrok http 8000

# Terminal 2 (se precisar de outro túnel)
ngrok http 3000
```

## Configuração Mínima (Apenas Backend Exposto)

Se você quiser testar apenas expondo o backend e acessar o frontend localmente:

1. **Expor apenas o backend:**
   ```bash
   ngrok http 8000
   # Copie a URL: https://abc123.ngrok-free.dev
   ```

2. **Configurar `.env` no frontend:**
   ```env
   VITE_API_URL=https://abc123.ngrok-free.dev/api
   VITE_WS_URL=https://abc123.ngrok-free.dev
   ```

3. **Acessar frontend localmente:**
   ```bash
   cd frontend
   npm run dev
   # Acesse: http://localhost:5173
   ```

4. **Adicionar localhost ao CORS (se necessário):**
   O CORS já está configurado para localhost, então deve funcionar.

**Vantagem**: Mais simples, não precisa expor o frontend.

**Desvantagem**: Só funciona se você estiver na mesma máquina ou rede local.

