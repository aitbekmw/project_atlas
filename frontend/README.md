# Atlas Frontend

React + TypeScript клиент для FastAPI backend Atlas.

## Стек

- Vite
- React 19
- TypeScript
- Tailwind CSS
- React Router
- Axios
- TanStack Query
- React Hook Form + Zod
- shadcn/ui
- Lucide

## Запуск

```bash
npm install
npm run dev
```

Приложение: http://localhost:5173 (и `http://<LAN-IP>:5173` с телефона в той же сети).

API и WebSocket идут на текущий origin: `/api` и `ws://<host>/ws/...`.
Vite проксирует их на `http://127.0.0.1:8001`.

Через Docker (`docker compose up -d`) тот же origin на порту 80:

`http://<LAN-IP>/` → nginx → SPA, `/api`, `/ws`.

Переменные в `.env`:

```
# По умолчанию не задавайте абсолютный URL — клиент использует /api.
# VITE_API_URL=/api
# VITE_WS_URL=
VITE_2GIS_API_KEY=
```

Абсолютный `VITE_API_URL` нужен только если API на другом хосте.

## Сборка

```bash
npm run build
```
