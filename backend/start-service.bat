@echo off
echo ========================================
echo Cake Up - Iniciar Django Local
echo ========================================
echo.

REM Ativar ambiente virtual
cd /d %~dp0
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo Ambiente virtual ativado!
    echo.
) else (
    echo ERRO: Ambiente virtual não encontrado!
    echo.
    echo Para criar o ambiente virtual:
    echo   python -m venv venv
    echo   venv\Scripts\activate.bat
    echo   pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo Iniciando Django com Daphne (ASGI) em http://localhost:8000...
echo Daphne suporta WebSocket - necessário para atualizações em tempo real
echo (Pressione Ctrl+C para parar)
echo.

daphne -b 0.0.0.0 -p 8000 config.asgi:application

