# Homework 9 — Announcements REST API

RESTful API для дошки оголошень. Сервер віддає **виключно JSON** —
жодного рендерингу HTML. Реалізовано повний CRUD з пошуком,
сортуванням, пагінацією, серверною валідацією через `celebrate`
та автоматичною документацією через Swagger.

## Стек

| Технологія | Версія | Призначення |
|------------|--------|-------------|
| Node.js | ≥ 18 | Середовище виконання |
| Express | 5.2 | Веб-фреймворк (async error handling) |
| Prisma | 7.4 | ORM (better-sqlite3 adapter) |
| SQLite | — | Локальна БД |
| celebrate | 15 | Валідація через Joi |
| swagger-jsdoc | 6.2 | Генерація OpenAPI 3.0 з JSDoc |
| swagger-ui-express | 5 | Інтерактивна документація `/api-docs` |

## Структура проєкту

```
homework9/
├── prisma/
│   ├── schema.prisma                # модель Announcement
│   ├── client.js                    # експорт Prisma Client
│   └── migrations/                  # застосована міграція
├── src/
│   ├── controllers/
│   │   └── announcement.controller.js   # бізнес-логіка (5 контролерів)
│   ├── routes/
│   │   └── announcement.routes.js       # маршрути + JSDoc Swagger
│   └── validators/
│       └── announcement.validator.js    # celebrate-схеми
├── app.js                           # точка входу, middleware, error handler
├── prisma.config.ts                 # DATABASE_URL для Prisma 7
├── requests.http                    # 12 запитів для REST Client
├── .env                             # DATABASE_URL="file:./dev.db"
└── package.json
```

## Швидкий старт

```bash
cd /home/saniksin/education/node_js/homework9

# 1. Встановити залежності
npm install

# 2. Створити .env (якщо ще нема)
cp .env.example .env

# 3. Застосувати міграції та створити БД
npm run prisma:migrate
npm run prisma:generate

# 4. Запустити сервер
npm run dev          # з hot reload
# або
npm start            # звичайний запуск
```

Сервер стартує на **http://localhost:3000**.
Swagger UI: **http://localhost:3000/api-docs**.

## Перевірка критеріїв оцінювання (20 балів)

Усі тести нижче можна виконувати з терміналу через `curl` або
відкрити `requests.http` у VS Code (розширення REST Client) і клацати
"Send Request" над кожним блоком. Альтернативно — Swagger UI.

> **Перед перевіркою**: запустіть сервер (`npm run dev`) і створіть
> декілька оголошень через POST з пункту 4 нижче, щоб мати дані.

---

### Критерій 1 — Схема БД та міграція (2 бали)

**Що перевіряється:** правильна модель `Announcement` з усіма
полями (включаючи `updatedAt`), таблиця створена в БД.

```bash
# Побачити модель
cat prisma/schema.prisma

# Перевірити що таблицю створено
sqlite3 dev.db ".schema Announcement"
```

Очікуваний вивід `.schema`:
```sql
CREATE TABLE "Announcement" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" REAL NOT NULL,
  "category" TEXT NOT NULL,
  "contactInfo" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
```

---

### Критерій 2 — GET /announcements (4 бали)

**2.1. Структура відповіді `{data, pagination}` (1 бал)**

```bash
curl -s http://localhost:3000/announcements
```

Відповідь має містити поля `data` (масив) та `pagination` з ключами
`total`, `page`, `totalPages`, `perPage`.

**2.2. Пошук по `title` нечутливий до регістру (1 бал)**

```bash
curl -s "http://localhost:3000/announcements?search=asus"
curl -s "http://localhost:3000/announcements?search=ASUS"
curl -s "http://localhost:3000/announcements?search=Asus"
```

Усі три варіанти повертають однакові результати (для ASCII текстів —
гарантовано через дефолтну поведінку SQLite `LIKE`).

**2.3. Сортування `newest` / `oldest` (1 бал)**

```bash
# default == newest, DESC за createdAt
curl -s "http://localhost:3000/announcements?sort=newest"

# найстаріші перші
curl -s "http://localhost:3000/announcements?sort=oldest"
```

**2.4. Пагінація — 10 на сторінку (1 бал)**

Створіть 14 записів циклом, потім:
```bash
curl -s "http://localhost:3000/announcements?page=1"   # 10 записів
curl -s "http://localhost:3000/announcements?page=2"   # 4 записи, totalPages=2
```

---

### Критерій 3 — GET /announcements/:id (1 бал)

```bash
# Існуючий ID → 200 + повний об'єкт
curl -s -i http://localhost:3000/announcements/1

# Неіснуючий ID → 404
curl -s -i http://localhost:3000/announcements/99999
```

---

### Критерій 4 — POST /announcements (3 бали)

**4.1. Celebrate-валідація (1 бал)**

```bash
# Невалідні дані → 400
curl -s -i -X POST http://localhost:3000/announcements \
  -H "Content-Type: application/json" \
  -d '{"title":"abc","description":"short","price":-5,"category":"invalid","contactInfo":"x"}'
```

**4.2. 400 зі зрозумілим повідомленням (1 бал)**

Відповідь celebrate повертає JSON виду:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "validation": {
    "body": {
      "source": "body",
      "keys": ["title"],
      "message": "\"title\" length must be at least 5 characters long"
    }
  }
}
```

**4.3. Успіх → 201 + створений об'єкт (1 бал)**

```bash
curl -s -i -X POST http://localhost:3000/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Продам ноутбук ASUS",
    "description": "Відмінний стан, 16GB RAM, SSD 512GB",
    "price": 18000,
    "category": "sale",
    "contactInfo": "0991234567"
  }'
```

Відповідь — статус **201** + JSON з `id`, `createdAt`, `updatedAt`.

---

### Критерій 5 — PATCH /announcements/:id (3 бали)

**5.1. Валідація: усі опціональні, але хоча б одне поле (1 бал)**

```bash
# Порожнє тіло → 400
curl -s -i -X PATCH http://localhost:3000/announcements/1 \
  -H "Content-Type: application/json" -d '{}'
```

**5.2. Оновлюються лише передані поля + `updatedAt` змінюється (1 бал)**

```bash
# Зміна тільки price
curl -s http://localhost:3000/announcements/2          # запам'ятати updatedAt
curl -s -X PATCH http://localhost:3000/announcements/2 \
  -H "Content-Type: application/json" -d '{"price":999}'
# title/category/description не змінилися; price=999; updatedAt новий
```

**5.3. Неіснуючий id → 404 (1 бал)**

```bash
curl -s -i -X PATCH http://localhost:3000/announcements/99999 \
  -H "Content-Type: application/json" -d '{"title":"Новий заголовок"}'
```

---

### Критерій 6 — DELETE /announcements/:id (1 бал)

```bash
# Існуючий → 204 без тіла відповіді
curl -s -i -X DELETE http://localhost:3000/announcements/1

# Неіснуючий → 404
curl -s -i -X DELETE http://localhost:3000/announcements/99999
```

---

### Критерій 7 — Архітектура (2 бали)

```bash
# Три рівні в src/
ls src/
# controllers  routes  validators

# Routes — лише визначення, без бізнес-логіки
grep -E "^router\." src/routes/announcement.routes.js

# Controllers — лише обробники, без визначень router.get/post
grep -E "router\.(get|post|patch|delete)" src/controllers/announcement.controller.js
# (порожньо — це правильно)

# Validators — окремі celebrate-схеми
grep -E "^export const" src/validators/announcement.validator.js
```

---

### Критерій 8 — Swagger документація (4 бали)

**8.1. Усі 5 маршрутів задокументовані (2 бали)**

Відкрийте у браузері: <http://localhost:3000/api-docs>

Має відображатися 5 операцій з тегом `Announcements`:
`GET /announcements`, `POST /announcements`, `GET /announcements/{id}`,
`PATCH /announcements/{id}`, `DELETE /announcements/{id}`.

**8.2. summary / parameters / requestBody / responses (1 бал)**

Кожен маршрут у Swagger UI має:
- `summary` (опис українською)
- `parameters` (для GET зі search/sort/page та для маршрутів з `:id`)
- `requestBody` (для POST та PATCH) з посиланням на схему
- `responses` з кодами `200/201/204/400/404` та посиланням на схеми
  `Announcement`, `ValidationError`, `NotFoundError`

**8.3. `/api-docs` відкривається (1 бал)**

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/api-docs/
# HTTP 200
```

---

## Файл `requests.http`

У корені є `requests.http` з 12 запитами (усі обов'язкові кейси з ТЗ
плюс PATCH з порожнім тілом для демонстрації валідації). Відкрийте у
VS Code з розширенням **REST Client** і клацайте "Send Request".

Покриті кейси:
1. GET `/announcements` без параметрів
2. GET `/announcements?search=ASUS`
3. GET `/announcements?sort=oldest&page=2`
4. GET `/announcements/:id` з існуючим ID
5. GET `/announcements/:id` з неіснуючим ID → 404
6. POST з валідними даними → 201
7. POST з невалідними даними → 400
8. PATCH з частковими даними → 200
9. PATCH з порожнім тілом → 400
10. PATCH неіснуючого ID → 404
11. DELETE існуючого → 204
12. DELETE неіснуючого → 404

## Скрипти npm

| Команда | Що робить |
|---------|-----------|
| `npm start` | Запуск сервера (`node app.js`) |
| `npm run dev` | Запуск з `--watch` (auto-restart при змінах) |
| `npm run prisma:migrate` | Створити/застосувати міграцію |
| `npm run prisma:generate` | Згенерувати Prisma Client |

## Технічні нотатки

- **Async errors** — Express 5 автоматично передає помилки з async
  функцій у error handler, тому `try/catch` у контролерах не потрібен.
- **404 через P2025** — Prisma кидає код `P2025` при `findUniqueOrThrow`,
  `update` або `delete` неіснуючого запису. Error handler в `app.js`
  ловить його і повертає 404.
- **`updatedAt`** — оновлюється Prisma автоматично через директиву
  `@updatedAt` при кожному виклику `update()`.
- **Promise.all** — `findMany` та `count` для пагінації виконуються
  паралельно (вдвічі швидше за послідовні `await`).
- **DATABASE_URL у Prisma 7** — у `prisma/schema.prisma` поле
  `url = env("DATABASE_URL")` більше **не підтримується** в datasource.
  URL читається з `prisma.config.ts` (для CLI) та з `.env` через
  `dotenv` у `prisma/client.js` (для рантайму).

## Залежності

Усі залежності прописані в `package.json` і встановлюються одним
`npm install`. Жодних глобальних утиліт встановлювати не потрібно.
