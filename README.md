# Event Processing System

Комплексна система обробки подій, побудована на NestJS, NATS JetStream та PostgreSQL, яка обробляє webhook-події з декількох джерел (Facebook та TikTok), обробляє їх через колектори та надає детальні звіти.

## Що це за додаток?

Event Processing System - це розподілена система для збору, обробки та аналізу подій з соціальних мереж. Система призначена для:

- **Збору подій**: Прийом webhook-подій від Facebook та TikTok через єдиний Gateway API
- **Асинхронної обробки**: Використання NATS JetStream для надійної доставки повідомлень між сервісами
- **Збереження даних**: Структуроване зберігання подій та користувацьких даних в PostgreSQL
- **Аналітики**: Генерація звітів про події, доходи та демографічні дані
- **Моніторингу**: Відстеження метрик через Prometheus та візуалізація в Grafana

### Основні компоненти

1. **Gateway** - API endpoint для прийому webhook-подій
2. **Facebook Collector** - Обробник подій від Facebook
3. **TikTok Collector** - Обробник подій від TikTok  
4. **Reporter** - API для генерації аналітичних звітів
5. **Publisher** - Docker образ для генерації тестових подій

## Швидкий старт

### Передумови
- Docker та Docker Compose
- 4GB вільної оперативної пам'яті
- Порти 3000-3004, 4222, 5432, 9090 повинні бути вільними

### Запуск системи

1. **Клонуйте репозиторій**:
```bash
git clone <repository>
cd event-processing-system
```

2. **Використайте скрипт автоматичного запуску**:
```bash
chmod +x start.sh
./start.sh
```

Скрипт автоматично:
- Зупинить існуючі контейнери
- Запустить інфраструктурні сервіси (PostgreSQL, NATS)
- Запустить додаток в правильному порядку
- Перевірить готовність кожного сервісу
- Запустить моніторинг та publisher

### Альтернативний ручний запуск

Якщо автоматичний скрипт не працює:

```bash
# Запуск інфраструктури
docker-compose up -d postgres nats
sleep 10

# Запуск gateway
docker-compose up -d gateway
sleep 10

# Запуск колекторів
docker-compose up -d fb-collector ttk-collector

# Запуск reporter
docker-compose up -d reporter

# Запуск моніторингу
docker-compose up -d prometheus grafana

# Запуск publisher (генератор подій)
docker-compose up -d publisher
```

### Перевірка стану системи

```bash
# Використайте скрипт перевірки
chmod +x healthcheck.sh
./healthcheck.sh

# Або перевірте вручну
docker-compose ps
```

## Доступ до сервісів

- **Gateway API**: http://localhost:3001/api
- **Reporter API**: http://localhost:3004/api
- **Grafana**: http://localhost:3000 (логін: admin/admin)
- **Prometheus**: http://localhost:9090
- **PostgreSQL**: localhost:5432 (користувач: postgres, пароль: postgres)
- **NATS**: localhost:4222

## API Endpoints

### Gateway (порт 3001)
- `POST /events` - Прийом webhook-подій
- `GET /health/live` - Перевірка життєздатності
- `GET /health/ready` - Перевірка готовності
- `GET /metrics` - Prometheus метрики

### Reporter (порт 3004)
- `GET /reports/events` - Статистика подій з фільтрами
- `GET /reports/revenue` - Дані про доходи від транзакційних подій
- `GET /reports/demographics` - Демографічна інформація користувачів
- `GET /health/live` - Перевірка життєздатності
- `GET /health/ready` - Перевірка готовності
- `GET /metrics` - Prometheus метрики

### Приклади запитів

```bash
# Отримати статистику подій
curl "http://localhost:3004/reports/events?source=facebook&from=2024-01-01"

# Отримати дані про доходи
curl "http://localhost:3004/reports/revenue?source=tiktok"

# Отримати демографічні дані
curl "http://localhost:3004/reports/demographics"
```

## Архітектура

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Publisher  │────▶│   Gateway   │────▶│    NATS     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                    ┌───────────────────────────┴────────────────────────┐
                    │                                                    │
                    ▼                                                    ▼
         ┌──────────────────┐                                ┌──────────────────┐
         │  FB Collector    │                                │  TTK Collector   │
         └────────┬─────────┘                                └────────┬─────────┘
                  │                                                    │
                  └──────────────────┐      ┌──────────────────────────┘
                                     ▼      ▼
                                ┌──────────────┐
                                │  PostgreSQL  │
                                └──────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │   Reporter   │
                                └──────────────┘
```

## Конфігурація

### Змінні середовища

Створіть файл `.env` на основі `.env.example`:

```bash
cp .env.example .env
```

Основні змінні:
- `DATABASE_URL` - Рядок підключення до PostgreSQL
- `NATS_URL` - URL сервера NATS
- `LOG_LEVEL` - Рівень логування (info, debug, error)
- `BODY_SIZE_LIMIT` - Максимальний розмір тіла запиту (за замовчуванням: 50mb)

## Розробка

### Локальна розробка

```bash
# Встановити залежності
npm install

# Запустити в режимі розробки
npm run start:dev

# Запустити тести
npm test
npm run test:e2e
npm run test:cov
```

### База даних

```bash
# Виконати міграції
npm run migrate

# Згенерувати Prisma клієнт
npm run db:generate

# Доступ до PostgreSQL
docker-compose exec postgres psql -U postgres -d eventdb
```

## Моніторинг

### Grafana дашборди

1. Відкрийте http://localhost:3000
2. Увійдіть з admin/admin
3. Перейдіть до дашборду "Event Processing System"

Доступні метрики:
- Прийняті події (за джерелом)
- Оброблені події (за сервісом)
- Невдалі події (з типом помилки)
- Швидкість обробки подій
- Затримка генерації звітів

### Prometheus запити

Приклади корисних запитів:
- `rate(events_accepted_total[5m])` - Швидкість прийому подій
- `events_failed_total` - Загальна кількість невдалих подій
- `histogram_quantile(0.95, report_duration_seconds_bucket)` - 95-й перцентиль часу генерації звітів

### Контейнери не запускаються

Використайте скрипт запуску або запустіть вручну в правильному порядку.

### Перегляд логів

```bash
# Всі сервіси
docker-compose logs -f

# Конкретний сервіс
docker-compose logs -f gateway
```

## Масштабування

Система підтримує горизонтальне масштабування:

```bash
# Запустити кілька екземплярів колекторів
docker-compose up -d --scale fb-collector=3 --scale ttk-collector=3
```

## Безпека

- Використовуються UUID для первинних ключів
- Валідація всіх вхідних даних через Zod схеми
- Структуроване логування з correlation ID
- Graceful shutdown для всіх сервісів
- Обмеження розміру запитів
