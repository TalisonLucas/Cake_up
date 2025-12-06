# 🔧 Como Ativar o Ambiente Virtual (venv)

## Problema

Erro: `ModuleNotFoundError: No module named 'django'`

**Causa**: O ambiente virtual não está ativado.

## Solução: Ativar o venv

### Windows PowerShell

```powershell
cd backend
.\venv\Scripts\Activate.ps1
```

Se der erro de política de execução:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

### Windows CMD

```cmd
cd backend
venv\Scripts\activate.bat
```

### Linux/Mac

```bash
cd backend
source venv/bin/activate
```

## Como Saber se Está Ativado

Quando ativado, você verá `(venv)` no início do prompt:

```
(venv) C:\Projetos_curso_dev\Cake_up\backend>
```

## Depois de Ativar

Agora você pode rodar os comandos do Django:

```bash
# Iniciar servidor
python manage.py runserver 0.0.0.0:8000

# Ou usar o script
start-ngrok.bat
```

## Atalho Rápido

Crie um arquivo `ativar.bat` na pasta `backend/`:

```batch
@echo off
cd /d %~dp0
call venv\Scripts\activate.bat
cmd /k
```

Depois é só dar duplo clique ou executar:
```bash
cd backend
ativar.bat
```


