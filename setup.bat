@echo off
chcp 65001 >nul
echo ========================================
echo   RestaurantOS — Установка
echo ========================================
echo.

REM Проверка Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Node.js не найден. Установите Node.js 18+
    pause
    exit /b 1
)
echo [OK] Node.js найден

REM Проверка npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] npm не найден
    pause
    exit /b 1
)
echo [OK] npm найден

echo.
echo --- Установка зависимостей backend ---
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] npm install backend
    pause
    exit /b 1
)
echo [OK] Зависимости backend установлены

echo.
echo --- Установка зависимостей frontend ---
cd ..\frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] npm install frontend
    pause
    exit /b 1
)
echo [OK] Зависимости frontend установлены

echo.
echo --- Применение миграций БД ---
cd ..\backend
call npx prisma migrate deploy
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Миграция БД. Убедитесь, что PostgreSQL запущен
    echo         и строка подключения в backend/.env верная
    pause
    exit /b 1
)
echo [OK] Миграции применены

echo.
echo --- Заполнение БД тестовыми данными ---
call npx prisma db seed
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Seed
    pause
    exit /b 1
)
echo [OK] Тестовые данные загружены

echo.
echo ========================================
echo   Установка завершена!
echo.
echo   Запуск:
echo     Backend:  cd backend ^&^& npm run dev
echo     Frontend: cd frontend ^&^& npm run dev
echo.
echo   Войти: admin@restaurant.com / admin123
echo ========================================
pause
