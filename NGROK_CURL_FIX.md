# 🔧 Como Testar API via ngrok com curl

## Problema

Ao fazer requisições com `curl` para a URL do ngrok, você recebe a página HTML de aviso ao invés da resposta JSON da API.

## Solução: Adicionar Header na Requisição

O ngrok precisa do header `ngrok-skip-browser-warning` na **requisição**, não na resposta.

### Para curl (Testes Manuais)

Adicione o header `-H` na requisição:

```bash
# Com header do ngrok
curl -H "ngrok-skip-browser-warning: true" https://psilotic-sergio-cowardly.ngrok-free.dev/api/auth/profile/

# Com autenticação também
curl -H "ngrok-skip-browser-warning: true" \
     -H "Authorization: Bearer SEU_TOKEN" \
     https://psilotic-sergio-cowardly.ngrok-free.dev/api/auth/profile/
```

### Para PowerShell (Invoke-WebRequest)

```powershell
$headers = @{
    "ngrok-skip-browser-warning" = "true"
    "Authorization" = "Bearer SEU_TOKEN"  # Se necessário
}

Invoke-WebRequest -Uri "https://psilotic-sergio-cowardly.ngrok-free.dev/api/auth/profile/" -Headers $headers
```

### Para o Frontend (Já Configurado)

O axios já está configurado para adicionar o header automaticamente quando detecta URLs do ngrok.

**Arquivo**: `frontend/src/services/api.ts`

## Exemplos de Teste

### Health Check (sem autenticação)

```bash
curl -H "ngrok-skip-browser-warning: true" \
     https://psilotic-sergio-cowardly.ngrok-free.dev/api/health/
```

**Resposta esperada**:
```json
{
  "status": "ok",
  "message": "Cake Up API is running!",
  "version": "1.0.0"
}
```

### Login

```bash
curl -X POST \
     -H "ngrok-skip-browser-warning: true" \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}' \
     https://psilotic-sergio-cowardly.ngrok-free.dev/api/auth/login/
```

### Profile (com token)

```bash
# Primeiro fazer login para obter token
TOKEN=$(curl -X POST \
  -H "ngrok-skip-browser-warning: true" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  https://psilotic-sergio-cowardly.ngrok-free.dev/api/auth/login/ | jq -r '.access')

# Depois usar o token
curl -H "ngrok-skip-browser-warning: true" \
     -H "Authorization: Bearer $TOKEN" \
     https://psilotic-sergio-cowardly.ngrok-free.dev/api/auth/profile/
```

## Verificação

Se funcionar corretamente, você deve receber JSON, não HTML:

✅ **Sucesso**: Recebe JSON da API
```json
{
  "id": 1,
  "username": "admin",
  ...
}
```

❌ **Falha**: Recebe HTML do ngrok
```html
<!DOCTYPE html>
<html>
  ...
```

## Por que isso acontece?

O ngrok intercepta a requisição **antes** de chegar ao Django. Por isso:
- O header precisa estar na **requisição do cliente**
- Não adianta adicionar na resposta do servidor
- O middleware do Django não resolve (ngrok intercepta antes)

## Soluções Automáticas

### Frontend
✅ Já configurado - o axios adiciona o header automaticamente

### Scripts de Teste
Crie aliases ou scripts que sempre incluem o header:

**Linux/Mac** (`~/.bashrc` ou `~/.zshrc`):
```bash
alias curl-ngrok='curl -H "ngrok-skip-browser-warning: true"'
```

**Windows PowerShell** (`$PROFILE`):
```powershell
function curl-ngrok {
    param($url, $headers = @{})
    $headers["ngrok-skip-browser-warning"] = "true"
    Invoke-WebRequest -Uri $url -Headers $headers
}
```

## Alternativa: Configurar ngrok

Você também pode configurar o ngrok para sempre pular o aviso:

```bash
ngrok http 8000 --request-header-add "ngrok-skip-browser-warning: true"
```

Ou criar arquivo de configuração (ver `NGROK_SKIP_WARNING_FIX.md`).


