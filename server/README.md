# EventHub Backend

## Setup
1. Copy `.env.example` to `.env`.
2. Put your MongoDB Atlas URI and JWT secret in `.env`.
3. Run `npm install`.
4. Run `npm run dev` or `npm start`.

API: http://localhost:5000

Health: GET /api/health

Auth:
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me

Events:
GET /api/events
GET /api/events/:id
GET /api/events/mine
POST /api/events
PUT /api/events/:id
DELETE /api/events/:id

Registrations:
POST /api/registrations/:eventId
GET /api/registrations/mine
DELETE /api/registrations/:eventId
GET /api/registrations/event/:eventId/participants

Admin:
GET /api/admin/dashboard
GET /api/admin/users
GET /api/admin/events
DELETE /api/admin/events/:id
