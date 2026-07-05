# PermisGo Backend MVC Starter

Professional backend starter for the PermisGo driving school platform using **Node.js**, **Express.js**, **MongoDB**, **Mongoose**, and a clean **MVC Pattern**.

## Why MVC Pattern?

This backend is separated into clear layers:

```txt
Model       = MongoDB/Mongoose database schema
Controller  = Request/response handling and business actions
Routes      = API endpoint definitions
Middleware  = Auth, role, validation, upload, error handling
Utils       = Reusable helpers
Config      = Database and environment setup
```

## Main Features Included

- Authentication: Register, Login, Forgot Password, Reset Password, Current User
- Role-based access: Admin, Student, Teacher, Support
- Student profile and dashboard
- Teacher profile, vehicles, locations and dashboard
- Offers and packages
- Booking system
- Lesson system
- Attendance confirmation notification logic
- Payment and invoice structure
- Document upload and review
- Blog, FAQ, testimonials
- Support tickets
- Quiz, road signs and exam request structure
- Admin dashboard and user management

## Folder Structure

```txt
permisgo-backend-mvc/
├── src/
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── seeders/
│   ├── uploads/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── docs/
├── .env.example
├── package.json
└── README.md
```

## Installation

```bash
npm install
```

Copy `.env.example` and create `.env`:

```bash
cp .env.example .env
```

For Windows, manually duplicate `.env.example` and rename it to `.env`.

## Run Development Server

```bash
npm run dev
```

Server will run at:

```txt
http://localhost:5000
```

Health check:

```txt
GET /api/health
```

## Create Admin User

Add to `.env`:

```txt
ADMIN_EMAIL=admin@permisgo.com
ADMIN_PASSWORD=admin12345
```

Then run:

```bash
npm run seed:admin
```

## Important API Prefix

All APIs start with:

```txt
/api
```

Example:

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/offers
```

## Development Order

Recommended build order:

1. Auth and role system
2. Student and Teacher profile
3. Offers and packages
4. Booking and lesson system
5. Payment and invoice system
6. Document upload
7. Support system
8. Admin dashboard
9. Quiz, exam and advanced features

## Notes

This is a professional starter foundation. Payment gateway, exam API, SMS, live chat, and production file storage can be connected later.
