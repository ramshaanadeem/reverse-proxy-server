# 🛡️ Reverse Proxy Server

A proxy server built with **Express**, **MongoDB**, **Redis**. It handles reverse proxying, request logging, authentication, caching, and dynamic configuration—all configurable and extensible.

---

## 📦 Features

- **Reverse Proxy**: Forwards any HTTP method (GET, POST, PUT, DELETE, etc.) from `/api/*` endpoints to a configured target (e.g. `https://jsonplaceholder.typicode.com/users`).
- **Request Logging**: Logs metadata (method, path, status, response time, headers, IP, etc.) for each proxied request into **MongoDB**.
- **Caching (Redis)**: Optional caching of GET responses with configurable TTL.
- **Dynamic Configuration**: Control proxy behavior at runtime—toggle caching/logging, manage whitelist/blacklist, set timeout, etc.
- **JWT Authentication**: Secure authentication system backing dashboard and API.
- **POST Proxying**: Supports forwarding POST requests with body, headers, and logging.

---

## 🧱 Getting Started

### Prerequisites

- Docker & Docker Compose
- Or, a local MongoDB and Redis setup
- Node.js (v16+), npm

Create a `.env` file (based on sample) at project root:

MONGODB_URI="mongodb://user:pass@localhost:27017/reverse-proxy"

JWT_SECRET="your_jwt_secret"

JWT_EXPIRES_IN="24h"

---
### Setting up and Installing dependencies
```
git clone https://github.com/ramshaanadeem/reverse-proxy-server.git
cd reverse-proxy-server
npm install
```

### 🚀 Launch With Docker
```
sudo docker-compose up
```

### Start Development Server
```
npm run dev
```


---
