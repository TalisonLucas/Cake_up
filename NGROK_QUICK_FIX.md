# ⚡ Solução Rápida: Aviso do ngrok

## Problema

O ngrok mostra página de aviso ao invés de retornar JSON da API.

## Solução Imediata

### Opção 1: Adicionar header no curl/PowerShell

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://psilotic-sergio-cowardly.ngrok-free.dev/api/auth/profile/" -Headers @{"ngrok-skip-browser-warning"="true"}
```

**Bash/curl:**
```bash
curl -H "ngrok-skip-browser-warning: true" https://psilotic-sergio-cowardly.ngrok-free.dev/api/auth/profile/
```

### Opção 2: Configurar ngrok (Recomendado)

Atualize o script `start-ngrok.bat` ou inicie ngrok com:

```bash
ngrok http 8000 --request-header-add "ngrok-skip-browser-warning: true"
```

Isso faz com que **todas** as requisições pulem o aviso automaticamente.

### Opção 3: Frontend já configurado ✅

O frontend no Vercel já adiciona o header automaticamente. Apenas requisições manuais (curl) precisam do header.

## Teste Rápido

```powershell
# Com header
Invoke-WebRequest -Uri "https://psilotic-sergio-cowardly.ngrok-free.dev/api/health/" -Headers @{"ngrok-skip-browser-warning"="true"}

# Deve retornar JSON, não HTML
```

## Próximos Passos

1. Use a Opção 2 para configurar ngrok permanentemente
2. Ou sempre adicione o header ao usar curl/Invoke-WebRequest
3. O frontend no Vercel já funciona automaticamente


