# AI Medical Portal (Vite + React + Express + MongoDB Atlas)

This is a full-stack healthcare web portal with modular architecture:

- `client/`: Vite + React multi-page portal
- `server/`: Express API for symptom extraction and disease prediction

## Important Notice

This project is an educational prototype and not a real medical diagnosis system.
Always consult qualified healthcare professionals for clinical decisions.

## Project Structure

```text
AiMedical/
  client/   # Vite React frontend portal
  server/   # Node/Express backend API
  server/db.json  # optional local fallback datastore for development
```

## Run Locally

1. Install frontend dependencies:

```bash
cd client
npm install
```

2. Install backend dependencies:

```bash
cd ../server
npm install
```

3. Configure server environment:

```bash
cd server
cp .env.example .env
```

Set `MONGODB_URI` to your Atlas connection string.

4. Start backend (Terminal 1):

```bash
cd server
npm run dev
```

5. Start frontend (Terminal 2):

```bash
cd client
npm run dev
```

6. Open the app:

- `http://localhost:5173`

The Vite dev server proxies `/api` to the backend on port `5000`.

## Route Map

- `/auth/login` - role selection login screen
- `/auth/login/admin` - admin login
- `/auth/login/doctor` - doctor login
- `/auth/login/patient` - patient login
- `/auth/register` - register page
- `/auth/forgot-password` - forgot password flow
- `/app` - dashboard
- `/app/diagnosis-chat` - AI diagnosis chatbot module
- `/app/appointments` - appointments module
- `/app/live-sessions` - live video/chat session module
- `/app/doctors` - doctors module (doctor/admin)
- `/app/patients` - patients module (doctor/admin)
- `/app/medical-records` - records module
- `/app/reports` - analytics module
- `/app/roles-permissions` - admin role and permission management
- `/app/profile` - user profile
- `/app/change-password` - change password page
- `/app/settings` - settings module
- `/app/signout` - secure signout flow

## Current Features

- Multi-page healthcare portal with `Sidebar` + `Topbar`
- JWT authentication with backend validation (`/api/auth/login`, `/api/auth/register`, `/api/auth/me`)
- Role-aware modules (`doctor`, `patient`, `admin`) with route-level guards
- RBAC permission model for resources: `doctor`, `patient`, `appointment`
- CRUD APIs and UI flows for:
  - Doctor management
  - Patient management
  - Appointment management
- Doctor and patient-specific login entry points
- Registration flow with role selection
- Protected routing and role-based module guards
- Profile and signout support
- Diagnosis chat module with:
  - Natural language symptom input
  - NLP-style symptom extraction
  - Disease scoring and recommendation output
- Live session module with doctor/patient room, chat timeline, and session controls
- Reports analytics dashboard with chart widgets, predictive cards, and CSV/PDF export
- MongoDB Atlas-backed persistent data for core modules

## MongoDB Atlas Setup (Required)

1. Create an Atlas cluster and database user.
2. Allow your hosting IP(s) in Atlas Network Access.
3. Copy the connection string into `MONGODB_URI` in `server/.env`.
4. Set `MONGODB_DB_NAME` (default: `ai_medical_portal`).
5. Set strong `JWT_SECRET` and production `CORS_ORIGIN`.
6. Start server. Health endpoint will show storage mode:
   - `GET /api/health` -> `storage: "mongodb-atlas"` when connected.

### Required Environment Values For You To Provide

- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGIN` (your deployed frontend URL, comma-separated if multiple)
- `INIT_ADMIN_EMAIL` (for first admin bootstrap)
- `INIT_ADMIN_PASSWORD` (for first admin bootstrap)

Optional:
- `MONGODB_DB_NAME`
- `PORT`
- `TOKEN_EXPIRY`
- `INIT_ADMIN_NAME`

## Deploy Frontend On Vercel

1. Push repo to GitHub.
2. Create a new Vercel project from `client/`.
3. Build settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   - `VITE_API_BASE_URL=https://<your-render-backend>.onrender.com/api`
5. Deploy and copy your Vercel domain.

## Deploy Backend On Render

1. Create a new Render Web Service from `server/`.
2. Runtime: `Node`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables in Render:
   - `NODE_ENV=production`
   - `PORT=10000` (or leave Render default)
   - `MONGODB_URI=<atlas-uri>`
   - `MONGODB_DB_NAME=ai_medical_portal`
   - `JWT_SECRET=<strong-secret>`
   - `CORS_ORIGIN=https://<your-vercel-domain>`
   - `INIT_ADMIN_EMAIL=<admin-email>`
   - `INIT_ADMIN_PASSWORD=<admin-password>`
   - `INIT_ADMIN_NAME=<admin-name>` (optional)
6. Deploy backend and verify:
   - `GET https://<your-render-backend>.onrender.com/api/health`
   - response should include `storage: "mongodb-atlas"`.

## First Production Login

Use the bootstrap admin credentials you set in Render:

- `INIT_ADMIN_EMAIL`
- `INIT_ADMIN_PASSWORD`

## Real-World Expansion Plan

1. Production authentication (`JWT`, refresh tokens, RBAC permissions).
2. Persistent database (`PostgreSQL`) for users, appointments, records.
3. Microservice split for chat inference, EMR, notifications, reporting.
4. Secure file/document store for prescriptions and lab results.
5. Audit logs, consent management, and compliance controls.
6. Monitoring stack, CI/CD, autoscaling, and disaster recovery.
