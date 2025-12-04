@echo off
echo ========================================
echo Cake Up - Iniciar Django + ngrok
echo ========================================
echo.

REM Descobrir IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%
echo IP Local encontrado: %IP%
echo.

echo Iniciando Django em %IP%:8000...
echo (Pressione Ctrl+C para parar)
echo.
start "Django Server" cmd /k "cd /d %~dp0 && python manage.py runserver %IP%:8000"

timeout /t 3 /nobreak >nul

echo.
echo Django iniciado! Agora iniciando ngrok...
echo.
ngrok http 8000

