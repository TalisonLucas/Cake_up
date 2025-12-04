# 🔧 Troubleshooting: ngrok não conecta ao Django

## Problema Comum

O ngrok mostra a URL mas não consegue conectar ao Django rodando em `localhost:8000`.

## ⚠️ Problema Específico do Windows

No Windows, usar `0.0.0.0:8000` pode não funcionar. Se você está no Windows e `0.0.0.0:8000` não funciona, consulte `NGROK_WINDOWS_FIX.md` para uma solução alternativa usando seu IP local.

## Causa Principal

O Django por padrão roda em `127.0.0.1:8000`, que aceita **apenas conexões locais**. O ngrok precisa que o servidor aceite conexões em `0.0.0.0:8000` (todas as interfaces de rede).

## ✅ Solução

### 1. Parar o Django atual

Se o Django estiver rodando, pare-o (Ctrl+C no terminal).

### 2. Iniciar Django em modo externo

Use um destes comandos:

```bash
# Opção 1: Comando direto
python manage.py runserver 0.0.0.0:8000

# Opção 2: Usando Makefile
make run
```

**Diferença importante:**
- `127.0.0.1:8000` ou `localhost:8000` → Apenas conexões locais ❌
- `0.0.0.0:8000` → Aceita conexões externas (ngrok) ✅

### 3. Verificar se está funcionando

Em outro terminal, teste:

```bash
# Deve funcionar localmente
curl http://127.0.0.1:8000/api/health/

# Deve funcionar via IP local (se estiver na mesma rede)
curl http://SEU_IP_LOCAL:8000/api/health/
```

### 4. Iniciar ngrok

```bash
ngrok http 8000
```

### 5. Testar via ngrok

Copie a URL do ngrok (ex: `https://xxxx-xxxx-xxxx.ngrok-free.dev`) e teste:

```bash
curl https://xxxx-xxxx-xxxx.ngrok-free.dev/api/health/
```

Deve retornar:
```json
{
  "status": "ok",
  "message": "Cake Up API is running!",
  "version": "1.0.0"
}
```

## Verificações Adicionais

### Verificar se o Django está acessível externamente

```bash
# Windows PowerShell
Test-NetConnection -ComputerName localhost -Port 8000

# Linux/Mac
netstat -an | grep 8000
# ou
lsof -i :8000
```

### Verificar logs do ngrok

Acesse: http://localhost:4040

Você deve ver:
- Status: **online**
- Forwarding: `https://... → http://localhost:8000`
- Requisições sendo processadas

### Verificar firewall

O Windows Firewall pode estar bloqueando a porta 8000:

1. Abra "Firewall do Windows Defender"
2. Verifique se a porta 8000 está permitida
3. Ou desative temporariamente para teste

### Verificar se outra aplicação está usando a porta 8000

```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 8000

# Linux/Mac
lsof -i :8000
```

Se houver outro processo, pare-o ou use outra porta.

## Erros Comuns

### Erro: "Connection refused"

**Causa**: Django está rodando em `127.0.0.1:8000` (apenas local)

**Solução**: Use `0.0.0.0:8000`

### Erro: "Tunnel not found"

**Causa**: ngrok não está rodando ou foi interrompido

**Solução**: 
1. Verifique se o ngrok está rodando
2. Reinicie o ngrok: `ngrok http 8000`

### Erro: "502 Bad Gateway"

**Causa**: ngrok não consegue conectar ao Django

**Solução**:
1. Verifique se o Django está rodando em `0.0.0.0:8000`
2. Verifique se não há firewall bloqueando
3. Verifique os logs do ngrok em http://localhost:4040

### Erro: "DisallowedHost"

**Causa**: Django está rejeitando o host do ngrok

**Solução**: 
No `backend/config/settings.py`, certifique-se de que:
```python
ALLOWED_HOSTS = ['*']  # Aceita todos os hosts
```

## Checklist de Diagnóstico

- [ ] Django está rodando em `0.0.0.0:8000` (não `127.0.0.1:8000`)
- [ ] ngrok está rodando e mostra status "online"
- [ ] `ALLOWED_HOSTS = ['*']` no settings.py
- [ ] Firewall não está bloqueando a porta 8000
- [ ] Nenhum outro processo está usando a porta 8000
- [ ] Teste local funciona: `curl http://127.0.0.1:8000/api/health/`
- [ ] Teste via ngrok funciona: `curl https://sua-url-ngrok.ngrok-free.dev/api/health/`

## Comandos Rápidos

```bash
# 1. Parar Django (Ctrl+C)

# 2. Iniciar Django em modo externo
python manage.py runserver 0.0.0.0:8000

# 3. Em outro terminal: Iniciar ngrok
ngrok http 8000

# 4. Testar
curl https://sua-url-ngrok.ngrok-free.dev/api/health/
```

## Próximos Passos

Após resolver o problema do ngrok:

1. Configure as variáveis de ambiente no frontend (Vercel)
2. Adicione a URL do Vercel ao `CORS_ALLOWED_ORIGINS`
3. Teste o WebSocket: `wss://sua-url-ngrok.ngrok-free.dev/ws/orders/`

## Documentação Relacionada

- `NGROK_SETUP.md` - Configuração completa do ngrok
- `NGROK_BACKEND_TEST.md` - Testes do backend via ngrok
- `VERCEL_SETUP.md` - Configuração do frontend no Vercel

