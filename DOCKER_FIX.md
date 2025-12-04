# 🐳 Correção do Docker para Django Channels

## Problema

O Docker estava falhando porque:
1. O módulo `channels` não estava sendo encontrado
2. O `runserver` do Django não suporta WebSocket (precisa de servidor ASGI)

## Solução Aplicada

### 1. Adicionado `daphne` ao requirements.txt

`daphne` é o servidor ASGI oficial do Django Channels, necessário para WebSocket funcionar.

### 2. Atualizado Dockerfile para usar daphne

O Dockerfile agora usa `daphne` ao invés de `runserver`:
```dockerfile
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

## Como Reconstruir o Docker

### Opção 1: Reconstruir apenas o backend

```bash
docker-compose build backend
docker-compose up backend
```

### Opção 2: Reconstruir tudo (forçado)

```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up
```

### Opção 3: Remover tudo e reconstruir (mais limpo)

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## Verificação

Após reconstruir, verifique:

1. **Logs do backend devem mostrar daphne iniciando:**
   ```
   Starting server at tcp:port=8000:interface=0.0.0.0
   ```

2. **Teste a API:**
   ```bash
   curl http://localhost:8000/api/health/
   ```

3. **Teste WebSocket (se configurado):**
   - Deve estar disponível em `ws://localhost:8000/ws/orders/`

## Diferença: runserver vs daphne

- **runserver**: Servidor de desenvolvimento WSGI, não suporta WebSocket ❌
- **daphne**: Servidor ASGI de produção, suporta HTTP + WebSocket ✅

## Nota sobre Redis

Para desenvolvimento, o Django Channels usa `InMemoryChannelLayer` (já configurado).

Para produção, você pode configurar Redis no docker-compose.yml:

```yaml
  redis:
    image: redis:7-alpine
    container_name: cakeup-redis
    ports:
      - "6379:6379"
    networks:
      - cakeup-network
```

E configurar no backend:
```env
USE_REDIS=True
REDIS_HOST=redis
REDIS_PORT=6379
```

## Troubleshooting

### Erro: "ModuleNotFoundError: No module named 'channels'"

**Solução**: Reconstrua o Docker com `--no-cache`:
```bash
docker-compose build --no-cache backend
```

### Erro: "daphne: command not found"

**Solução**: Verifique se `daphne==4.0.0` está no `requirements.txt` e reconstrua.

### WebSocket não conecta

1. Verifique se está usando `daphne` (não `runserver`)
2. Verifique os logs do container: `docker-compose logs backend`
3. Teste a conexão WebSocket localmente primeiro

