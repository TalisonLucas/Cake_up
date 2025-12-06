@echo off
REM Ativar ambiente virtual do Django
cd /d %~dp0
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo.
    echo Ambiente virtual ativado! (venv)
    echo.
    cmd /k
) else (
    echo.
    echo ERRO: Ambiente virtual não encontrado!
    echo.
    echo Para criar o ambiente virtual:
    echo   python -m venv venv
    echo   venv\Scripts\activate.bat
    echo   pip install -r requirements.txt
    echo.
    pause
)


