# Product Catalog + Cart Assessment

Full-stack React + Node.js implementation of the take-home task. It includes user registration/login, hashed passwords, JWT sessions, backend-enforced admin routes, account-scoped carts, server-calculated totals, product search/filter/sort, out-of-stock handling, validation, centralized JSON errors, and seeded data.

## Tech Stack

- Frontend: React 19, Vite, custom responsive CSS
- Backend: Node.js, Express 5
- Auth: bcrypt password hashing, JWT bearer sessions
- Data: MongoDB with Mongoose

## Project Structure

```text
client/
  index.html
  src/
    main.jsx
    styles.css
server/
  src/
    auth.js
    cart.js
    config.js
    db.js
    errors.js
    index.js
    models.js
    routes.js
    seed.js
    seedData.js
    validators.js
scripts/
  dev.mjs
```

## Setup

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

Add your MongoDB connection string to `MONGO_URL` in `.env` before seeding or starting the API.
On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp .env.example .env`.

Frontend: `http://127.0.0.1:5173`

Backend: `http://127.0.0.1:4000`

## Admin Login

- Email: `admin@example.com`
- Password: `Admin@12345`

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products?search=&minPrice=&maxPrice=&sort=price-asc`
- `POST /api/products` admin only
- `PATCH /api/products/:id` admin only
- `DELETE /api/products/:id` admin only
- `GET /api/cart` logged-in users only
- `POST /api/cart` logged-in users only
- `PATCH /api/cart/:id` logged-in users only
- `DELETE /api/cart/:id` logged-in users only

## Notes

The app requires `MONGO_URL` in `.env`. Do not commit the real `.env` file; `.env.example` is only a template.

## Requirement Coverage

- Must-have API endpoints are implemented under `/api`.
- Passwords are hashed with bcrypt.
- JWT-protected routes return `401` when missing or invalid.
- Admin product writes are enforced on the backend and return `403` for regular users.
- Cart items are always queried with the logged-in user's id.
- Cart totals are calculated on the server.
- Product search, price filtering, and sorting are handled by the backend.
- Backend validation returns clear `400` responses for bad input.
- Duplicate registration emails return `409`.
- Out-of-stock products are disabled in the UI and rejected by the API.

Submission items still need to be completed outside the app code: push to a public GitHub repository and deploy to a live host.
