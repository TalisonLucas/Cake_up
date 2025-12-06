@echo off
echo ========================================
echo Cake Up - Iniciar Django + ngrok
echo ========================================
echo.

REM Ativar ambiente virtual
cd /d %~dp0
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo Ambiente virtual ativado!
) else (
    echo AVISO: Ambiente virtual não encontrado!
    echo Execute: python -m venv venv
    echo Depois: pip install -r requirements.txt
    pause
    exit /b 1
)

REM Descobrir IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%
echo IP Local encontrado: %IP%
echo.

echo Iniciando Django com Daphne (ASGI) em %IP%:8000...
echo Daphne suporta WebSocket - necessário para atualizações em tempo real
echo (Pressione Ctrl+C para parar)
echo.
start "Django Server" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && daphne -b 0.0.0.0 -p 8000 config.asgi:application"

timeout /t 3 /nobreak >nul

echo.
echo Django iniciado! Agora iniciando ngrok...
echo (com header para pular aviso)
echo.
ngrok http 8000 --request-header-add "ngrok-skip-browser-warning: true"

