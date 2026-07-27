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

## Lesson lifecycle policy

The lesson endpoints enforce these production defaults. Override them in `.env`
when the business policy requires different values:

```txt
# Minutes before a new or rescheduled lesson must start.
LESSON_MIN_BOOKING_LEAD_MINUTES=60

# Earliest and latest window in which a teacher can start a lesson.
LESSON_START_EARLY_MINUTES=15
LESSON_START_LATE_MINUTES=60

# Reschedule/cancellation request cutoff and no-show grace period.
LESSON_CHANGE_CUTOFF_MINUTES=1440
LESSON_NO_SHOW_GRACE_MINUTES=15

# Offset of the lesson business timezone from UTC, in minutes.
# Example: UTC+2 = 120. Set this explicitly in production.
LESSON_TIMEZONE_OFFSET_MINUTES=0
```

MongoDB transactions are used when a teacher accepts a booking. Production
MongoDB must therefore run as a replica set (MongoDB Atlas already does).
