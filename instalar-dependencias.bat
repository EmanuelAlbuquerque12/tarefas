@echo off
cls
color 0B
echo.
echo ============================================================
echo.
echo     Instalar/Atualizar Dependencias
echo.
echo ============================================================
echo.

node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo ERRO: Node.js nao esta instalado!
    echo.
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.
echo Instalando/Atualizando dependencias...
echo.
echo ============================================================
echo.

call npm install

echo.
echo ============================================================
echo.

if errorlevel 1 (
    color 0C
    echo ERRO ao instalar dependencias!
) else (
    color 0A
    echo Dependencias instaladas com sucesso!
)

echo.
pause
