# Tabs TG - Telegram Mini App для сохранения постов

Веб-приложение для сохранения и организации постов из Telegram с поддержкой вкладок, drag-and-drop и медиа-контента.

## 🚀 Технологии

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, aiogram (Telegram Bot)
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion
- **Deployment**: Docker, Railway

## 📋 Возможности

- 🔐 Авторизация через Telegram Bot
- 📝 Сохранение текстовых постов и медиа (фото, видео)
- 🗂️ Организация постов по вкладкам
- 🎯 Drag-and-drop для перемещения постов
- 🔗 Превью ссылок (YouTube, веб-сайты)
- 📱 Адаптивный дизайн

## 🛠️ Локальная разработка

### Требования

- Docker и Docker Compose
- Node.js 20+ (для разработки frontend без Docker)
- Python 3.11+ (для разработки backend без Docker)

### Быстрый старт

1. **Клонируйте репозиторий**
```bash
git clone <your-repo-url>
cd tabs-tg
```

2. **Создайте `.env` файл**
```bash
cp .env.example .env
```

Заполните переменные окружения:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=tabs_tg
BOT_TOKEN=your_telegram_bot_token
```

3. **Запустите с Docker Compose**
```bash
docker-compose up --build
```

Сервисы будут доступны:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5433

### Разработка без Docker

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main_api:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🚂 Деплой на Railway

Подробная инструкция: [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)

### Краткая инструкция

1. **Создайте проект на Railway**
   - Перейдите на [railway.app](https://railway.app)
   - Создайте новый проект

2. **Добавьте PostgreSQL**
   - Add service → Database → PostgreSQL

3. **Создайте три сервиса из GitHub репозитория:**
   - **API Service**: команда `uvicorn app.main_api:app --host 0.0.0.0 --port $PORT`
   - **Bot Service**: команда `python -m app.main_bot`
   - **Frontend Service**: использует Dockerfile автоматически

4. **Настройте переменные окружения** (см. [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md))

5. **Deploy!** 🎉

## 📝 Переменные окружения

### Backend (API + Bot)
- `DATABASE_URL` - URL подключения к PostgreSQL (автоматически из Railway Postgres)
- `BOT_TOKEN` - токен Telegram бота от [@BotFather](https://t.me/botfather)
- `PORT` - порт для API (автоматически от Railway)

### Frontend
- `NEXT_PUBLIC_API_URL` - URL вашего API сервиса на Railway

## 🏗️ Архитектура

```
tabs-tg/
├── backend/              # FastAPI приложение
│   ├── app/
│   │   ├── main_api.py   # REST API
│   │   ├── main_bot.py   # Telegram Bot
│   │   └── db/           # Модели и база данных
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # Next.js приложение
│   ├── src/
│   │   ├── app/          # Pages и layouts
│   │   └── components/   # React компоненты
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml    # Локальная разработка
└── railway.toml          # Railway конфигурация
```

## 🤝 Contributing

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT License

## 🐛 Troubleshooting

### Проблемы с базой данных
- Убедитесь что PostgreSQL запущен
- Проверьте `DATABASE_URL` в переменных окружения
- Для Railway: проверьте что сервис подключен к PostgreSQL

### Frontend не подключается к API
- Проверьте `NEXT_PUBLIC_API_URL`
- Убедитесь что API сервис запущен
- Проверьте CORS настройки в `main_api.py`

### Telegram Bot не отвечает
- Проверьте `BOT_TOKEN`
- Убедитесь что bot сервис запущен
- Для Railway: используйте polling, не webhook (уже настроено)
