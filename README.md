# EventHub – Event Planning & Management Platform

A complete MERN MVP aligned with the supplied EventHub problem description.

## Features
- Student, Organizer and Admin roles
- Register / Login with JWT
- Organizer event creation and management
- Event discovery, search and category filtering
- Event details with date, time, location and capacity
- Registration with duplicate and capacity protection
- My Registrations
- Organizer participant management API
- Admin statistics and event moderation API
- MongoDB Atlas + Mongoose
- REST APIs
- Responsive professional frontend

## Run in VS Code

### 1. Backend
Open terminal:
```bash
cd server
copy .env.example .env
npm install
npm run dev
```
Edit `server/.env` and add your MongoDB Atlas URI.

### 2. Frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev
```

Open the Vite URL shown in terminal, normally:
http://localhost:5173

Backend:
http://localhost:5000

## Demo flow
1. Register an Organizer account.
2. Create an event.
3. Logout.
4. Register a Student account.
5. Discover the event and register.
6. Login as Organizer and view the event dashboard.

## Important
Never commit `server/.env`. It is ignored by Git.
