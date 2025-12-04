# 🔧 Solução para ngrok no Windows

## Problema

No Windows, usar `0.0.0.0:8000` pode não funcionar corretamente com o ngrok. O Django pode não estar acessível externamente mesmo usando `0.0.0.0`.

## Solução: Usar IP Local

### Passo 1: Descobrir seu IP Local

```powershell
# PowerShell
ipconfig | Select-String "IPv4"

# Ou mais específico:
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"}).IPAddress
```

Anote o IP (ex: `192.168.1.100`)

### Passo 2: Rodar Django com IP Local

**Seu IP local detectado: `172.20.32.1`**

```bash
cd backend
python manage.py runserver 172.20.32.1:8000
```

**OU use o script automático:**
```bash
cd backend
start-ngrok.bat
```

Este script:
1. Descobre automaticamente seu IP local
2. Inicia o Django nesse IP
3. Inicia o ngrok

### Passo 3: Testar Localmente

No navegador, acesse:
```
http://SEU_IP_LOCAL:8000/api/health/
```

Deve funcionar!

### Passo 4: Iniciar ngrok

```bash
ngrok http 8000
```

### Passo 5: Testar via ngrok

Use a URL do ngrok:
```
https://sua-url-ngrok.ngrok-free.dev/api/health/
```

## Alternativa: Usar localhost com ngrok configurado

Se o IP local não funcionar, tente esta abordagem:

### Opção A: ngrok com host header

```bash
ngrok http 8000 --host-header=localhost:8000
```

### Opção B: ngrok com inspect desabilitado

```bash
ngrok http 8000 --inspect=false
```

## Verificação

Para verificar se o Django está acessível:

```powershell
# Teste local
Invoke-WebRequest -Uri http://localhost:8000/api/health/

# Teste via IP (substitua pelo seu IP)
Invoke-WebRequest -Uri http://192.168.1.100:8000/api/health/
```

## Script Automático

Crie um arquivo `start-ngrok.bat` na pasta `backend/`:

```batch
@echo off
echo Descobrindo IP local...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%
echo IP Local: %IP%
echo.
echo Iniciando Django em %IP%:8000...
start "Django Server" cmd /k "python manage.py runserver %IP%:8000"
timeout /t 3
echo.
echo Iniciando ngrok...
ngrok http 8000
```

Uso:
```bash
cd backend
start-ngrok.bat
```

## Troubleshooting

### Erro: "That IP address can't be assigned to"

**Causa**: O IP não está correto ou não está na sua rede

**Solução**: 
1. Verifique o IP com `ipconfig`
2. Use um IP da sua rede local (geralmente começa com 192.168.x.x ou 10.x.x.x)

### Erro: "Address already in use"

**Causa**: Outro processo está usando a porta 8000

**Solução**:
```powershell
# Ver processos na porta 8000
Get-NetTCPConnection -LocalPort 8000

# Parar processo (substitua PID pelo número do processo)
Stop-Process -Id PID
```

### ngrok ainda não conecta

1. Verifique se o Django está realmente rodando no IP especificado
2. Teste o IP diretamente no navegador antes de usar ngrok
3. Verifique o firewall do Windows
4. Tente desabilitar temporariamente o firewall para teste

## Configuração do Firewall

Se o firewall estiver bloqueando:

1. Abra "Firewall do Windows Defender"
2. Clique em "Configurações Avançadas"
3. Crie uma regra de entrada para a porta 8000
4. Ou desative temporariamente para teste

## Comandos Rápidos

```powershell
# 1. Descobrir IP
ipconfig | Select-String "IPv4"

# 2. Rodar Django (substitua IP)
python manage.py runserver 192.168.1.100:8000

# 3. Testar
Invoke-WebRequest -Uri http://192.168.1.100:8000/api/health/

# 4. Iniciar ngrok
ngrok http 8000
```

