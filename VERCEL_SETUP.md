# Configuração do Frontend no Vercel com Backend no Railway

## Visão Geral

O frontend fica na Vercel. A API Django e o PostgreSQL ficam no Railway. O navegador chama a API por HTTPS e o WebSocket por WSS no domínio público do Railway.

## Arquitetura

```
Frontend (Vercel) → Django (Railway) → PostgreSQL (Railway)
```

O desenvolvimento local com Docker Compose e `npm run dev` não muda. Sem `VITE_API_URL`, o frontend usa `http://localhost:8000/api`.

## Passo a Passo

### 1. Publicar o backend no Railway

1. Crie um projeto no Railway e adicione o plugin **PostgreSQL**.
2. Crie um serviço a partir deste repositório.
3. Defina o root directory como `backend` e use o Dockerfile dessa pasta.
4. No serviço do Django, configure:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
SECRET_KEY=<chave-nova-só-no-painel>
DEBUG=False
FRONTEND_URL=https://cake-up.vercel.app
```

`DATABASE_URL` deve referenciar o plugin PostgreSQL. Não commite `SECRET_KEY`.

5. Gere um domínio público, por exemplo `https://cake-up-api.up.railway.app`.
6. No shell do serviço, uma vez:

```bash
python manage.py populate_db
```

O container já roda `migrate` ao iniciar. `populate_db` não entra nesse start, para não redefinir a senha do admin a cada deploy.

7. Confira `GET https://<dominio-railway>/api/health/`.

Mantenha **uma** instância do Django. O chat usa canal em memória e não funciona com mais de um réplica sem Redis.

### 2. Configurar variáveis de ambiente no Vercel

No painel do Vercel:

1. Acesse o projeto
2. Vá em **Settings** → **Environment Variables**
3. Defina:

```
VITE_API_URL=https://<dominio-railway>/api
VITE_WS_URL=https://<dominio-railway>
```

O Vite grava essas URLs no build. Depois de alterar, faça um novo deploy.

- Use a URL completa do Railway, com `https://`
- Não inclua `/api` na URL do WebSocket
- O código converte `https://` em `wss://`

### 3. CORS

Com `DEBUG=False`, o backend aceita `https://cake-up.vercel.app` e o valor de `FRONTEND_URL`. Se o domínio da Vercel mudar, atualize `FRONTEND_URL` no Railway e faça um novo deploy do backend.

### 4. Deploy no Vercel

#### Opção A: Via CLI

```bash
cd frontend
npm install -g vercel
vercel --prod
```

#### Opção B: Via GitHub

1. Faça push do código para o GitHub
2. Conecte o repositório no Vercel
3. Configure as variáveis de ambiente (passo 2)
4. Faça o deploy

A CSP em `frontend/vercel.json` e `frontend/index.html` já permite `https://*.up.railway.app` e `wss://*.up.railway.app`.

## Desenvolvimento local

Crie `frontend/.env.local` só se quiser forçar a URL. Sem esse arquivo, o padrão já é o backend local:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

Sem `DATABASE_URL`, o Django usa SQLite ou as variáveis `DB_*` do Docker Compose.

## Troubleshooting

### Frontend não conecta ao backend

1. Abra `https://<dominio-railway>/api/health/`
2. Confira `VITE_API_URL` e `VITE_WS_URL` na Vercel e faça redeploy
3. Veja o console do navegador
4. Confira se `DEBUG=False` e se `FRONTEND_URL` é a origem da Vercel

### WebSocket não conecta

1. `VITE_WS_URL` deve ser `https://<dominio-railway>`, sem `/api`
2. O serviço no Railway precisa ter um único réplica
3. A CSP precisa incluir `wss://*.up.railway.app` (já está no `vercel.json`)

### Erro de CORS

1. Defina `FRONTEND_URL` com a URL exata do site na Vercel, incluindo `https://`
2. Faça redeploy do backend no Railway

## Checklist de Deploy

- [ ] PostgreSQL criado no Railway
- [ ] Serviço Django com root `backend`, `DATABASE_URL`, `SECRET_KEY`, `DEBUG=False` e `FRONTEND_URL`
- [ ] Domínio público gerado e `/api/health/` respondendo
- [ ] `python manage.py populate_db` executado uma vez
- [ ] `VITE_API_URL` e `VITE_WS_URL` na Vercel, seguidas de redeploy
- [ ] Login com `admin` / `admin123`, `operador` / `operador123` e `cliente1` / `cliente123`
- [ ] Chat ou atualização de pedido conectando em `wss://`
