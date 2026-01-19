# 🚀 Быстрая настройка Railway

## Важно! Использование правильных Dockerfiles

Railway запускает build из корня проекта. Для каждого сервиса используйте соответствующий Dockerfile.

### 1. API Service

1. В Railway Dashboard создайте новый сервис из GitHub репозитория
2. **Settings** → **Build**
3. В разделе **Builder** выберите "Dockerfile"
4. **Custom Build Command**: оставьте пустым
5. В разделе **Deploy** → **Custom Start Command**: 
   ```
   uvicorn app.main_api:app --host 0.0.0.0 --port $PORT
   ```
6. **Settings** → **General** → **Dockerfile Path**: `Dockerfile.api`
7. Сохраните изменения

### 2. Bot Service

1. Создайте еще один сервис из того же GitHub репозитория
2. **Settings** → **Build**
3. В разделе **Builder** выберите "Dockerfile"
4. **Settings** → **General** → **Dockerfile Path**: `Dockerfile.bot`
5. **Deploy** → **Custom Start Command**: 
   ```
   python -m app.main_bot
   ```
6. Сохраните изменения

### 3. Frontend Service

1. Создайте третий сервис из того же GitHub репозитория
2. **Settings** → **Build**
3. В разделе **Builder** выберите "Dockerfile"
4. **Settings** → **General** → **Dockerfile Path**: `Dockerfile.frontend`
5. **Custom Start Command**: оставьте пустым (используется из Dockerfile)
6. Сохраните изменения

## Переменные окружения

### API Service
- `DATABASE_URL` - автоматически от Railway Postgres (подключите сервис к базе)
- `PORT` - автоматически от Railway

### Bot Service
- `DATABASE_URL` - автоматически от Railway Postgres (подключите сервис к базе)
- `BOT_TOKEN` - добавьте вручную (ваш токен от @BotFather)

### Frontend Service
- `NEXT_PUBLIC_API_URL` - URL вашего API сервиса
  - Получите его из **Settings** → **Networking** → **Public Networking** вашего API сервиса
  - Пример: `https://tabs-tg-api-production.up.railway.app`

## Подключение к PostgreSQL

Для каждого backend сервиса (API и Bot):

1. Откройте сервис в Railway
2. **Settings** → **Service**
3. Найдите раздел **Service Variables** или **Connect**
4. Нажмите **+ Variable Reference**
5. Выберите вашу PostgreSQL базу данных
6. Выберите переменную `DATABASE_URL`

Railway автоматически добавит правильный `DATABASE_URL` для подключения.

## После настройки

Railway автоматически пересоберет сервисы с правильными Dockerfiles.

Подробная инструкция: [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)

