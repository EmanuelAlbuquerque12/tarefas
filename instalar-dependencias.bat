@echo off
chcp 65001 >nul
cls

color 0B
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║     Instalar/Atualizar Dependências                          ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:: Verifica se o Node.js está instalado
echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ❌ ERRO: Node.js não está instalado!
    echo.
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js encontrado
echo.

echo Instalando/Atualizando dependências...
echo.
echo ════════════════════════════════════════════════════════════════
echo.

call npm install

echo.
echo ════════════════════════════════════════════════════════════════
echo.

if %errorlevel% equ 0 (
    color 0A
    echo ✓ Dependências instaladas com sucesso!
) else (
    color 0C
    echo ❌ Erro ao instalar dependências!
)

echo.
pause
