# 🔧 Como Pular o Aviso do ngrok (ERR_NGROK_6024)

## Problema

O ngrok mostra uma página de aviso quando você tenta acessar a URL, bloqueando requisições automáticas da API.

**Erro**: `ERR_NGROK_6024` - "You are about to visit..."

## Soluções Implementadas

### ✅ Solução 1: Middleware no Django (Backend)

Criado middleware `NgrokSkipBrowserWarningMiddleware` que adiciona automaticamente o header necessário em todas as respostas.

**Arquivo**: `backend/config/middleware.py`

**Já configurado em**: `backend/config/settings.py`

**Como funciona**: O middleware adiciona o header `ngrok-skip-browser-warning: true` em todas as respostas HTTP, fazendo com que o ngrok pule o aviso.

### ✅ Solução 2: Header no Frontend (API Requests)

O interceptor do axios agora adiciona automaticamente o header quando detecta URLs do ngrok.

**Arquivo**: `frontend/src/services/api.ts`

**Como funciona**: Detecta se a URL contém `ngrok-free.dev` ou `ngrok.io` e adiciona o header automaticamente.

## Como Aplicar

### 1. Reiniciar o Django

Após as mudanças, reinicie o servidor Django:

```bash
# Parar o Django (Ctrl+C)
# Reiniciar
python manage.py runserver 0.0.0.0:8000
```

### 2. Testar

Agora as requisições devem funcionar sem o aviso:

```bash
# Teste direto
curl https://psilotic-sergio-cowardly.ngrok-free.dev/api/health/

# Ou no navegador
https://psilotic-sergio-cowardly.ngrok-free.dev/api/auth/profile/
```

## Solução Alternativa: Configurar ngrok

Se ainda não funcionar, você pode configurar o ngrok para pular o aviso globalmente:

### Opção A: Usar flag no ngrok

```bash
ngrok http 8000 --request-header-add "ngrok-skip-browser-warning: true"
```

### Opção B: Configurar no ngrok.yml

Crie/edite `~/.ngrok2/ngrok.yml` (Linux/Mac) ou `%USERPROFILE%\.ngrok\ngrok.yml` (Windows):

```yaml
version: "2"
authtoken: SEU_TOKEN
tunnels:
  backend:
    proto: http
    addr: 8000
    request_header:
      add:
        - "ngrok-skip-browser-warning: true"
```

Depois inicie com:
```bash
ngrok start backend
```

### Opção C: Plano Pago do ngrok

Upgrade para plano pago do ngrok para remover avisos automaticamente.

## Para WebSocket

O WebSocket não suporta headers customizados diretamente. O middleware do Django deve resolver isso, mas se ainda houver problemas:

1. **Use o middleware** (já implementado) - deve funcionar
2. **Configure o ngrok** com a flag `--request-header-add` (Opção A acima)
3. **Use plano pago** do ngrok

## Verificação

Após aplicar as mudanças:

1. ✅ Requisições HTTP devem funcionar sem aviso
2. ✅ WebSocket deve conectar sem aviso
3. ✅ API deve responder normalmente

## Troubleshooting

### Ainda mostra aviso

1. Verifique se o middleware está no `settings.py`
2. Reinicie o Django
3. Limpe o cache do navegador (Ctrl+Shift+R)
4. Tente a Opção A ou B acima

### WebSocket ainda bloqueado

1. Configure o ngrok com `--request-header-add`
2. Ou use plano pago do ngrok

## Nota Importante

O aviso do ngrok aparece apenas **uma vez por visitante**. Se você já viu o aviso, pode precisar:
- Limpar cookies do navegador
- Usar modo anônimo
- Ou aguardar alguns minutos

