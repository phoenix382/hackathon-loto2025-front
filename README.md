# Честная лотерея — фронтенд (hackathon-loto2025-front)

Одностраничное приложение на Vue 3 + Vite для прозрачного розыгрыша чисел и аудита случайных последовательностей. Поддерживает онлайн‑прогресс по WebSocket, демонстрацию этапов (энтропия → нормализация → seed → генерация → тесты NIST) и страницу «Паспорт честности» с визуализацией событий.

## Возможности

- Розыгрыш тиража с настраиваемыми источниками энтропии (RSS‑новости, погода, солнечная активность, метеоснимки, системный RNG, микротайминги).
- Онлайн‑прогресс по этапам: сбор энтропии, whitening, формирование seed, генерация, тесты, завершение.
- Показ цифрового слепка (fingerprint) и промежуточных бит; выгрузка `bits.txt`.
- Аудит внешних последовательностей: полный NIST SP 800‑22 для битовой строки, списка чисел или загруженного файла.
- Демонстрационная страница «Паспорт честности» с потоковыми событиями.
- Маршрутизация по страницам: `/draw`, `/verify`, `/passport`.

## Архитектура и стек

- Фреймворк: `Vue 3` + `TypeScript`
- Сборка: `Vite`
- Роутинг: `vue-router`
- Код‑стайл: `ESLint` + `Prettier`
- Live‑каналы: WebSocket (c запасным SSE для демо)
- Основные директории:
  - `src/components` — UI‑компоненты (формы, прогресс, результаты, NIST‑виджеты)
  - `src/pages` — страницы приложения
  - `src/types` — типы данных (`draw`, `audit`)
  - `src/utils` — утилиты (сеть/WS‑база)

## Требования

- Node.js `>=20.19` или `>=22.12` (см. `package.json: engines`)
- npm 9/10/… (входит в состав Node.js)
- Работающий backend API (по умолчанию на `http://localhost:8000`)

## Быстрый старт (локально)

1) Установите зависимости

```bash
npm install
```

2) Запустите дев‑сервер (Vite)

```bash
npm run dev
```

3) Откройте приложение

- По умолчанию: `http://localhost:5173`
- Страницы:
  - `/draw` — розыгрыш тиража (основной флоу, используется `src/pages/DrawPageNew.vue`)
  - `/verify` — аудит NIST внешних последовательностей
  - `/passport` — демонстрация событий (паспорт честности)

Если backend не на `localhost:8000`, задайте переменные окружения (см. ниже).

## Переменные окружения

Фронтенд ожидает два базовых адреса: HTTP (для `/api/*`) и WS.

- `VITE_API_HTTP_BASE` — базовый HTTP‑URL backend для прокси `/api` в дев‑режиме.
- `VITE_API_WS_BASE` — базовый WebSocket‑URL, который использует клиентский код.
- `HMR_CLIENT_PORT` — порт HMR клиента (при запуске в Docker удобно ставить `80`).

Примеры `.env.local` (для локальной разработки):

```ini
VITE_API_HTTP_BASE=http://localhost:8000
VITE_API_WS_BASE=ws://localhost:8000
```

Vite‑прокси (см. `vite.config.ts`) перенаправляет все запросы на `/api/*` к `VITE_API_HTTP_BASE` и удаляет префикс `/api`.

## Запуск в Docker Compose

Проект включает `docker-compose.yml` для быстрого старта в контейнере.

- Запуск:

```bash
docker compose up -d
```

- Остановка:

```bash
docker compose down
```

По умолчанию проксируется порт `80 -> 5173`, то есть фронтенд доступен на `http://localhost`. Внутри контейнера можно задать/переопределить:

- `VITE_API_HTTP_BASE` — HTTP‑база backend (по умолчанию `http://hackathon48.ru:8000` в compose)
- `VITE_API_WS_BASE` — WS‑база (по умолчанию `ws://hackathon48.ru:8000` в compose)
- `HMR_CLIENT_PORT=80` — чтобы HMR корректно работал через порт 80

Если у вас свой backend, задайте собственные значения этих переменных окружения.

## Скрипты npm

- `npm run dev` — дев‑сервер Vite
- `npm run build` — типизация + прод‑сборка
- `npm run preview` — предпросмотр собранного
- `npm run type-check` — проверка типов (`vue-tsc`)
- `npm run lint` — ESLint (с `--fix`)
- `npm run format` — Prettier по `src/`

Makefile:

- `make dev` — `npm run dev`
- `make build` — `docker compose build`
- `make deploy` — `docker compose up -d`
- `make down` — `docker compose down`

## Ожидаемые API эндпоинты (backend)

Розыгрыш тиража:

- `POST /api/draw/start`
  - Тело: `{ sources: string[]; bits: number; numbers: number; max_number: number }`
  - Ответ: `{ job_id: string }`
- `WS  {WS_BASE}/draw/ws/{job_id}` — поток событий: `entropy`, `whitening`, `seed`, `draw`, `tests`, `final`.
- `GET /api/draw/result/{job_id}` — итог `{ draw: number[]; fingerprint: string; ... }`
- `GET /api/draw/bits/{job_id}` — промежуточные биты `{ bits: string; length: number }`

Аудит (NIST SP 800‑22):

- `POST /api/audit/nist/start`
  - Тело: `{ sequence_bits?: string | null; numbers?: number[] | null }`
  - Ответ: `{ job_id: string }`
- `WS  {WS_BASE}/audit/nist/ws/{job_id}` — прогресс: `nist:start`, `nist:eligibility`, `nist:run`, `nist:run:test`, `nist:test`, `nist:summary`, `nist:done`.
- `GET /api/audit/nist/result/{job_id}` — финальный отчёт: список тестов с p‑values и сводкой.

Демо/паспорт честности:

- `WS  {WS_BASE}/demo/ws?scenario={name}` — поток демонстрационных событий
- `SSE /api/demo/stream?scenario={name}` — fallback на SSE

WS‑база определяется функцией `wsBase()` (`src/utils/net.ts`):

- При наличии `VITE_API_WS_BASE` — используется она (с обрезкой завершающего `/`).
- Без неё: локальная разработка — `ws://localhost:8000`; в проде — `ws(s)://{location.host}`.

## Структура UI

- `/draw` (`src/pages/DrawPageNew.vue`)
  - `DrawFormNew` — выбор источников, `bits`, количество чисел и максимум
  - `ProgressDisplay` — визуализация стадий/прогресса
  - `LiveDrawInfo` — текущие числа, fingerprint, сводка тестов
  - Загрузка и сохранение битовой последовательности `bits.txt`
- `/verify` (`src/pages/VerifyPage.vue`)
  - `AuditForm` — ввод бит/чисел/файла и запуск NIST
  - `NistProgress` — прогресс, «PASS/FAIL», p‑values и сводка
- `/passport` (`src/pages/PassportPage.vue`)
  - `DemoStream` — поток событий и карточки с расшифровками

## Советы по разработке

- Рекомендуемые расширения: VS Code + Volar (официальный плагин Vue).
- В браузере установите Vue Devtools для удобной отладки компонентов/состояния.
- Проверяйте типы `npm run type-check`, форматируйте `npm run format`, линт `npm run lint`.
- Сетевые адреса правятся переменными окружения; в дев‑режиме для HTTP используйте `/api/*` (проксируется Vite).

## Типичные проблемы и решения

- CORS/прокси не работает: задайте `VITE_API_HTTP_BASE` и перезапустите дев‑сервер.
- WS не подключается: задайте `VITE_API_WS_BASE` (например, `ws://localhost:8000`).
- Порт 80 занят в Docker: измените маппинг порта в `docker-compose.yml` (например, `8080:5173`).
- HMR в контейнере не коннектится: проверьте `HMR_CLIENT_PORT=80` и `allowedHosts` в `vite.config.ts`.
