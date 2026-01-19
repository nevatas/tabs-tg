# 🚀 Быстрая настройка Railway

## Важно! Настройка Root Directory

Railway требует ручной настройки Root Directory для каждого сервиса.

### 1. API Service

1. В Railway Dashboard откройте ваш API сервис
2. **Settings** → **Source**
3. **Root Directory**: `/backend`
4. **Start Command**: `uvicorn app.main_api:app --host 0.0.0.0 --port $PORT`
5. Сохраните изменения

### 2. Bot Service

1. Откройте Bot сервис
2. **Settings** → **Source**
3. **Root Directory**: `/backend`
4. **Start Command**: `python -m app.main_bot`
5. Сохраните изменения

### 3. Frontend Service

1. Откройте Frontend сервис
2. **Settings** → **Source**
3. **Root Directory**: `/frontend`
4. **Start Command**: (оставьте пустым, используется из Dockerfile)
5. Сохраните изменения

## Переменные окружения

### API Service
- `DATABASE_URL` - автоматически от Railway Postgres
- `PORT` - автоматически от Railway

### Bot Service
- `DATABASE_URL` - автоматически от Railway Postgres
- `BOT_TOKEN` - добавьте вручную (ваш токен от @BotFather)

### Frontend Service
- `NEXT_PUBLIC_API_URL` - URL вашего API сервиса (например: `https://api-production-xxxx.up.railway.app`)

## После настройки

Railway автоматически пересоберет сервисы с правильными путями.

Подробная инструкция: [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)
