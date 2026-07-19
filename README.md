# 🚀 Project Atlas

Backend платформы для поиска подработки и временной занятости.

Project Atlas — REST API, разработанный на FastAPI с использованием современной backend-архитектуры, Docker, PostgreSQL и Redis.

---

# ✨ Возможности

- 👤 JWT Authentication
- 👥 Пользователи
- 💼 Вакансии
- 📄 Заявки
- ⭐ Отзывы
- 💬 WebSocket Chat
- 📂 Категории
- 🖼 Загрузка файлов в MinIO
- 🔄 Redis Pub/Sub
- 📖 Swagger/OpenAPI
- 🐳 Docker
- 🌐 Nginx
- ✅ GitHub Actions CI
- 🧪 Автоматические тесты

---

# 🛠 Tech Stack

## Backend

- Python 3.13
- FastAPI
- SQLAlchemy
- Alembic
- Pydantic

## Database

- PostgreSQL

## Cache

- Redis

## Storage

- MinIO (S3)

## Infrastructure

- Docker
- Docker Compose
- Nginx

## Testing

- Pytest
- pytest-asyncio
- HTTPX

---

# 📁 Project Structure

```text
project_atlas/

├── app/
│   ├── api/
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── repositories/
│   ├── schemas/
│   ├── services/
│   ├── websocket/
│   └── main.py
│
├── tests/
│
├── docker/
│
├── nginx/
│
├── migrations/
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

# 🚀 Run with Docker

```bash
docker compose up --build
```

Swagger:

```
http://localhost/docs
```

MinIO:

```
http://localhost:9001
```

---

# 🧪 Run Tests

```bash
pytest
```

---

# 📖 API Documentation

Swagger UI

```
http://localhost/docs
```

ReDoc

```
http://localhost/redoc
```

---

# 🐳 Docker Services

- FastAPI
- PostgreSQL
- Redis
- MinIO
- Nginx

---

# 🔐 Authentication

Используется JWT Authentication.

---

# 🧪 Tests

В проекте реализовано:

- Unit Tests
- Integration Tests

Всего:

```
51 tests
```

---

# ⚙ CI/CD

GitHub Actions автоматически:

- устанавливает зависимости;
- запускает PostgreSQL;
- создает тестовую базу;
- запускает pytest.

---

# 📌 Roadmap

- [x] Authentication
- [x] Jobs
- [x] Applications
- [x] Reviews
- [x] Categories
- [x] WebSocket Chat
- [x] Redis
- [x] MinIO
- [x] Docker
- [x] Nginx
- [x] GitHub Actions
- [ ] Coverage
- [ ] Production Deploy
- [ ] Monitoring
- [ ] Grafana
- [ ] Prometheus

---

# 👨‍💻 Author

**Айтбек Аскеров**

Python Backend Developer

---

# ⭐ Project Status

🚀 Active Development
