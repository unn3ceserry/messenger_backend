# Fluent Backend

Backend-часть мессенджера **Fluent** — REST API + WebSocket сервер на NestJS.

Поддерживает регистрацию и авторизацию, личные чаты, обмен сообщениями в реальном времени и статус онлайн.

---

## Стек

| | |
|---|---|
| **NestJS** | основной фреймворк |
| **PostgreSQL + Prisma** | база данных и ORM |
| **WebSocket** | события реального времени |
| **Redis** | сессии и кэш |
| **Argon2** | хэширование паролей |
| **Docker** | контейнеризация |

---

## Структура

```
src/
├── core/          # Prisma, Redis, глобальные модули
├── modules/       # Фичи: auth, chats, messages, users...
└── main.ts

prisma/
├── schema.prisma
└── generated/
```
