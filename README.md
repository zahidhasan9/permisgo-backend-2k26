# PermisGo Backend

Backend API and real-time communication server for the PermisGo driving-school platform. It serves the public website, student portal, teacher portal, and admin dashboard.

## Technology stack

- Node.js with ES modules
- Express 5
- MongoDB and Mongoose
- JWT authentication through HTTP-only cookies and Bearer tokens
- Socket.IO for real-time chat, presence, and calling signals
- Redis adapter support for horizontally scaled Socket.IO deployments
- Multer and Cloudinary for media/document uploads
- Nodemailer for transactional email
- Swagger/OpenAPI documentation
- Helmet, CORS, compression, logging, and API rate limiting

## Requirements

- Node.js 20 or later
- npm
- MongoDB (local instance or MongoDB Atlas)
- Redis for multi-instance real-time chat; optional for a single local instance
- Cloudinary account when `UPLOAD_STORAGE=cloudinary`

## Local setup

```bash
cd permisgo-backend
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux, replace the copy command with `cp .env.example .env`.

The default server URL is `http://localhost:5000`. The root endpoint, `GET /`, confirms that the API is running. All application endpoints use the `/api` prefix.

## Environment variables

Never commit real credentials. Start from `.env.example`.

| Variable | Purpose | Example/default |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | HTTP server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/permisgo` |
| `JWT_SECRET` | Secret used to sign access tokens | Required |
| `JWT_EXPIRES_IN` | JWT lifetime | `7d` |
| `CLIENT_URL` | Allowed frontend origin | `http://localhost:3000` |
| `ADMIN_CLIENT_URL`, `ADMIN_URL` | Additional allowed admin origins | Optional |
| `API_RATE_LIMIT` | Maximum requests per 15-minute window | `500` |
| `SMTP_HOST`, `SMTP_PORT` | SMTP server configuration | Required for email |
| `SMTP_USER`, `SMTP_PASS` | SMTP credentials | Required for email |
| `MAIL_FROM` | Sender name/address | Required for email |
| `UPLOAD_STORAGE` | Upload driver | `cloudinary` or local |
| `UPLOAD_DIR` | Local upload directory | `uploads` |
| `UPLOAD_MAX_FILE_SIZE_MB` | Upload size limit | Optional |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Required for Cloudinary |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Required for Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Required for Cloudinary |
| `CLOUDINARY_FOLDER` | Root media folder | `permisgo` |
| `REDIS_URL` | Redis connection URL | Optional locally |
| `METERED_DOMAIN` | Metered TURN service domain | Optional |
| `METERED_SECRET_KEY` | Metered TURN service key | Optional |

Lesson lifecycle rules can be configured with `LESSON_MIN_BOOKING_LEAD_MINUTES`, `LESSON_START_EARLY_MINUTES`, `LESSON_START_LATE_MINUTES`, `LESSON_CHANGE_CUTOFF_MINUTES`, `LESSON_NO_SHOW_GRACE_MINUTES`, and `LESSON_TIMEZONE_OFFSET_MINUTES`.

## npm commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the server with Nodemon |
| `npm start` | Start the production server |
| `npm run docs:generate` | Regenerate OpenAPI files |
| `npm run seed:admin` | Create/update the initial admin account |
| `npm run seed:simple-series` | Import the twenty simple quiz series |
| `npm run seed:french-simple-series` | Import French simple series |
| `npm run seed:thematic-crash` | Import thematic series and crash tests |
| `npm run seed:code-ebooks` | Import standard code ebooks |
| `npm run seed:road-signs` | Import road signs |
| `npm run seed:live-replays` | Import live replay content |
| `npm run seed:e-learning-videos` | Import e-learning videos |
| `npm run seed:blogs` | Seed blogs |
| `npm run seed:faqs` | Seed FAQs |
| `npm run seed:offers` | Seed offers |
| `npm run seed:testimonials` | Seed testimonials |
| `npm run seed:demo-teachers` | Seed demonstration teachers |

Migration and media scripts are also declared in `package.json`. Review their input data and environment configuration before running them against production.

## Application flow

```text
Client request
  -> Express security/CORS/body/rate-limit middleware
  -> /api/<module> route
  -> authentication and role authorization middleware
  -> controller/business logic
  -> Mongoose model
  -> MongoDB
  -> JSON response or centralized error handler
```

Authentication accepts the signed token from the `token` cookie or an `Authorization: Bearer <token>` header. Protected users are rejected when their account is inactive or blocked. Public registration only permits student and teacher accounts; admin accounts are created through the admin seeder or trusted administration flows.

## API modules

The following route groups are mounted by `server.js`:

| Prefix | Responsibility |
| --- | --- |
| `/api/auth` | Registration, login, logout, current user, profile, password |
| `/api/admin` | Dashboard, users, settings, approvals, administrative data |
| `/api/students` | Student dashboard, profile, favourites, booklet skills |
| `/api/teachers` | Teacher profile, students, vehicles, locations, availability |
| `/api/quizzes` | Quiz catalogue, questions, attempts, answers, results, retakes, road signs |
| `/api/learning` | Learning content, progress, ebook courses/topics/lessons |
| `/api/bookings` | Available slots and student/teacher booking workflow |
| `/api/lessons` | Lesson lifecycle and attendance |
| `/api/offers` | Public offers and admin offer management |
| `/api/documents` | Document upload, review, status, and deletion |
| `/api/blogs` | Public blog and admin CRUD |
| `/api/faqs` | Public FAQs and admin CRUD |
| `/api/testimonials` | Public testimonials and admin CRUD |
| `/api/reviews` | Teacher reviews |
| `/api/referrals` | Student referral information |
| `/api/exams` | Student exam requests and admin updates |
| `/api/exam-questions` | Exam question management |
| `/api/chat` | Contacts, message history, attachments, ICE configuration |
| `/api/contact` | Public contact submission and admin workflow |
| `/api/appointments` | Public appointment submission and admin workflow |

`paymentRoutes.js`, `supportRoutes.js`, and `notificationRoutes.js` exist but are currently commented out in `server.js`; their endpoints are not available until explicitly mounted.

Swagger UI and generated specifications are available at:

| URL | Purpose |
| --- | --- |
| `/api-docs` | Interactive Swagger UI |
| `/docs` | Redirect to Swagger UI |
| `/swagger` | Redirect to Swagger UI |
| `/openapi.json` | Raw OpenAPI 3.0 specification |
| `/api-docs.json` | Backward-compatible raw specification URL |

For example, after deployment open `https://<your-vercel-domain>/api-docs`. The documentation generator reads every route group mounted by `server.js` and writes synchronized `docs/openapi.json`, `docs/api-docs.json`, and `docs/api-docs.md` files.

## Data model groups

- Identity: `User`, `StudentProfile`, `TeacherProfile`
- Teacher operations: `TeacherAvailability`, `TeacherLocation`, `TeacherVehicle`
- Driving operations: `Booking`, `Lesson`, `Appointment`, `Exam`, `ExamQuestion`
- Code learning: `Quiz`, `Question`, `QuizAttempt`, `QuizRetakePermission`, `RoadSign`
- Ebook learning: `EbookCourse`, `EbookTopic`, `EbookLesson`, `EbookLessonProgress`
- General learning: `LearningContent`, `LearningProgress`
- Commerce: `Offer`, `Package`, `Payment`, `Invoice`, `Referral`
- Communication: `Conversation`, `ChatMessage`, `Notification`, `SupportTicket`, `ContactSubmission`
- Content and trust: `Blog`, `FAQ`, `Testimonial`, `Review`, `Document`, `Setting`
- Student evaluation: `StudentSkillAssessment`

## Project structure (A–Z)

```text
permisgo-backend/
|-- .env.example                 # Safe environment template
|-- api/                         # Platform/serverless API compatibility files
|-- config/
|   |-- cloudinary.js            # Cloudinary client
|   |-- db.js                    # MongoDB connection
|   |-- siteSettings.js          # Site-setting defaults/helpers
|   `-- swagger.js               # Swagger UI mounting
|-- controllers/                 # HTTP handlers and business operations
|   |-- adminController.js
|   |-- adminVehicleController.js
|   |-- appointmentController.js
|   |-- authController.js
|   |-- blogController.js
|   |-- bookingController.js
|   |-- chatController.js
|   |-- contactController.js
|   |-- documentController.js
|   |-- ebookLessonController.js
|   |-- ebookStructureController.js
|   |-- examController.js
|   |-- examQuestionController.js
|   |-- faqController.js
|   |-- learningContentController.js
|   |-- lessonController.js
|   |-- lessonQueryController.js
|   |-- notificationController.js
|   |-- offerController.js
|   |-- paymentController.js
|   |-- quizController.js
|   |-- referralController.js
|   |-- reviewController.js
|   |-- studentController.js
|   |-- supportController.js
|   |-- teacherAvailabilityController.js
|   |-- teacherController.js
|   |-- teacherLocationController.js
|   |-- teacherVehicleController.js
|   `-- testimonialController.js
|-- docs/                        # Generated Markdown/OpenAPI documentation
|-- lib/                         # Backend library integration area
|-- middlewares/                 # Auth, validation, errors, and upload handlers
|-- models/                      # Mongoose schemas (listed by domain above)
|-- routes/                      # Express routers for every API module
|-- scripts/
|   `-- generateOpenApi.js       # API documentation generator
|-- seeders/                     # Data import, seed, and media migration scripts
|-- services/
|   `-- chatService.js           # Reusable chat operations
|-- socket/
|   `-- chatSocket.js            # Socket.IO presence/chat/call events
|-- utils/                       # API response, errors, token, email, pagination,
|                                # booking availability, referral, upload helpers
|-- package.json                 # Dependencies and commands
|-- server.js                    # Main Express/HTTP/Socket.IO entry point
`-- vercel.json                  # Vercel deployment configuration
```

Generated/runtime folders such as `node_modules/`, local uploads, and log files are intentionally omitted from the structure.

## Quiz/code-challenge lifecycle

1. The student requests available quizzes.
2. Starting a quiz creates or resumes a `QuizAttempt`.
3. The server returns safe question data without exposing correct answers.
4. Each submitted answer is validated server-side and persisted with timing data.
5. The response returns per-question feedback and explanation media.
6. Finishing the attempt calculates the final result and enables history, mistakes, and admin review screens.
7. Controlled retakes use `QuizRetakePermission` and admin endpoints.

## Real-time chat

`server.js` creates an HTTP server and passes it to `initializeChatSocket`. Socket authentication uses the same user identity model. REST endpoints provide contacts, history, attachments, and ICE configuration; Socket.IO provides presence, messages, typing/call signalling, and live updates. Configure Redis when multiple backend instances must share events.

## Uploads and media

Upload middlewares are separated by content type. `createUploadMiddleware.js` is the reusable factory; profile, blog, testimonial, and vehicle middlewares apply domain rules. Files may use local storage or Cloudinary depending on environment configuration. Never trust only the client-provided MIME type; retain server-side size/type validation when extending uploads.

## Deployment notes

- Configure every production origin in the CORS allow-list variables.
- Use a long, random `JWT_SECRET` and production SMTP/Cloudinary credentials.
- Production cookies use `Secure` and `SameSite=None`, so deploy frontend and API over HTTPS.
- MongoDB transactions used by booking acceptance require a replica set; MongoDB Atlas supports this.
- Configure Redis for Socket.IO when deploying more than one API instance.
- Regenerate and review OpenAPI docs after endpoint changes.

## Development conventions

- Keep routes thin and move domain logic into controllers/services.
- Protect private routes with `protect` before `authorize(...)`.
- Return consistent JSON and pass unexpected errors to the centralized handler.
- Add or update Mongoose validation whenever request rules change.
- Never expose password hashes, reset tokens, correct quiz answers, or service credentials.
- Update this README, `.env.example`, and API docs when configuration or endpoints change.
