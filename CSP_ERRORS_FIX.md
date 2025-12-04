# 🔒 Correção de Erros de Content Security Policy (CSP)

## Problema

Os erros de CSP ocorrem porque o ngrok tenta carregar recursos (fontes e imagens) que violam a política de segurança do Vercel.

## Erros Comuns

```
Loading the font '<URL>' violates the following Content Security Policy directive
Loading the image 'https://ngrok.com/assets/favicon.ico' violates the following Content Security Policy directive
```

## Soluções Implementadas

### 1. Arquivo `vercel.json` (Recomendado)

Criado `frontend/vercel.json` com headers CSP que permitem:
- Recursos do ngrok (`*.ngrok-free.dev`, `*.ngrok.io`)
- WebSockets seguros (`wss://`)
- Fontes e imagens do ngrok
- Scripts e estilos necessários

### 2. Meta Tag no HTML (Fallback)

Adicionada meta tag CSP no `index.html` como fallback caso o `vercel.json` não seja aplicado.

## O que foi permitido

- ✅ Domínios ngrok (`*.ngrok-free.dev`, `*.ngrok.io`)
- ✅ WebSockets seguros (`wss://`)
- ✅ Fontes do ngrok
- ✅ Imagens do ngrok
- ✅ Scripts inline (necessário para React/Vite)
- ✅ Estilos inline (necessário para Tailwind)

## Próximos Passos

1. **Faça commit e push**:
   ```bash
   git add frontend/vercel.json frontend/index.html
   git commit -m "Fix: Adiciona CSP para permitir recursos do ngrok"
   git push
   ```

2. **Aguarde o redeploy no Vercel** (automático após push)

3. **Teste novamente** - Os erros devem desaparecer

## Alternativa: Remover Aviso do ngrok

Se os erros persistirem, você pode remover o aviso do ngrok:

### Opção 1: Header no Backend

No `backend/config/settings.py`, adicione middleware para remover o aviso:

```python
MIDDLEWARE = [
    # ... outros middlewares ...
    'django.middleware.common.CommonMiddleware',
    # Adicione após CommonMiddleware
]

# Adicionar header para pular aviso do ngrok
def skip_ngrok_warning(get_response):
    def middleware(request):
        response = get_response(request)
        response['ngrok-skip-browser-warning'] = 'true'
        return response
    return middleware
```

### Opção 2: Plano Pago do ngrok

Upgrade para plano pago do ngrok para remover avisos automaticamente.

## Verificação

Após o deploy, verifique no console do navegador:
- ✅ Sem erros de CSP relacionados ao ngrok
- ✅ WebSocket conecta normalmente
- ✅ Recursos carregam corretamente

## Troubleshooting

### Erros persistem após deploy

1. Verifique se o `vercel.json` está na raiz do `frontend/`
2. Verifique se o Vercel detectou o arquivo (veja logs de build)
3. Limpe o cache do navegador (Ctrl+Shift+R)

### CSP muito restritivo

Se precisar permitir mais recursos, ajuste o `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
        }
      ]
    }
  ]
}
```

⚠️ **Atenção**: Isso é menos seguro, use apenas para desenvolvimento.

