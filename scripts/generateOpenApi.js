import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routesDir = path.join(root, "routes");
const output = path.join(root, "docs", "openapi.json");

const mounts = {
  authRoutes: "/api/auth",
  adminRoutes: "/api/admin",
  quizRoutes: "/api/quizzes",
  learningContentRoutes: "/api/learning",
  lessonRoutes: "/api/lessons",
  studentRoutes: "/api/students",
  teacherRoutes: "/api/teachers",
  offerRoutes: "/api/offers",
  bookingRoutes: "/api/bookings",
  documentRoutes: "/api/documents",
  blogRoutes: "/api/blogs",
  faqRoutes: "/api/faqs",
  testimonialRoutes: "/api/testimonials",
  referralRoutes: "/api/referrals",
  examRoutes: "/api/exams",
  chatRoutes: "/api/chat",
};

const schemas = {
  ApiError: {
    type: "object",
    required: ["success", "message"],
    properties: {
      success: { type: "boolean", example: false },
      message: { type: "string", example: "Validation failed." },
      stack: { type: "string", description: "Development only" },
    },
  },
  PaginationMeta: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 10 },
      total: { type: "integer", example: 42 },
      totalPages: { type: "integer", example: 5 },
    },
  },
  User: {
    type: "object",
    properties: {
      _id: { type: "string", example: "66b1f1234567890abcdef123" },
      name: { type: "string", example: "Alex Martin" },
      email: { type: "string", format: "email" },
      phone: { type: "string" },
      role: { type: "string", enum: ["student", "teacher", "admin"] },
      avatar: { type: "string", format: "uri" },
      status: { type: "string", enum: ["active", "inactive", "blocked"] },
      isEmailVerified: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  RegisterInput: {
    type: "object",
    required: ["name", "email", "password", "role"],
    properties: {
      name: { type: "string", example: "Alex Martin" },
      email: { type: "string", format: "email", example: "alex@example.com" },
      phone: { type: "string", example: "+33612345678" },
      password: {
        type: "string",
        format: "password",
        minLength: 6,
        example: "StrongPass123",
      },
      role: {
        type: "string",
        enum: ["student", "teacher"],
        example: "student",
      },
    },
  },
  LoginInput: {
    type: "object",
    required: ["email", "password", "expectedRole"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", format: "password" },
      expectedRole: { type: "string", enum: ["student", "teacher", "admin"] },
    },
  },
  AuthResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      message: { type: "string" },
      data: {
        type: "object",
        properties: {
          token: { type: "string", description: "JWT Bearer token" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
    },
  },
  Offer: {
    type: "object",
    required: ["title", "category", "regularPrice", "salePrice"],
    properties: {
      _id: { type: "string", readOnly: true },
      title: { type: "string", example: "Manual Zen Permit" },
      category: {
        type: "string",
        enum: ["cpf", "to drive", "accompanied", "code", "other"],
      },
      transmission: {
        type: "string",
        enum: ["manual", "automatic", "both"],
        default: "both",
      },
      description: { type: "string" },
      regularPrice: { type: "number", example: 699 },
      salePrice: { type: "number", example: 599 },
      hourOptions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string", example: "20 hr" },
            value: { type: "number", example: 20 },
          },
        },
      },
      features: { type: "array", items: { type: "string" } },
      isFeatured: { type: "boolean" },
      status: { type: "string", enum: ["active", "inactive"] },
    },
  },
  BookingInput: {
    type: "object",
    required: ["teacherId", "locationId", "bookingDate", "startTime"],
    properties: {
      teacherId: { type: "string" },
      locationId: { type: "string" },
      vehicleId: { type: "string" },
      bookingDate: { type: "string", format: "date", example: "2026-08-15" },
      startTime: { type: "string", example: "10:00" },
      duration: { type: "integer", example: 60 },
      vehicleType: { type: "string", enum: ["manual", "automatic"] },
      notes: { type: "string" },
    },
  },
  LocationInput: {
    type: "object",
    required: ["name", "address", "latitude", "longitude"],
    properties: {
      name: { type: "string" },
      address: { type: "string" },
      city: { type: "string" },
      postalCode: { type: "string" },
      latitude: { type: "number", example: 48.8566 },
      longitude: { type: "number", example: 2.3522 },
      serviceRadiusKm: { type: "number", example: 10 },
      locationType: {
        type: "string",
        enum: ["teacher_location", "student_pickup", "both"],
      },
      status: { type: "string", enum: ["active", "inactive"] },
    },
  },
  AvailabilityInput: {
    type: "object",
    properties: {
      timezone: { type: "string", example: "Europe/Paris" },
      slotDurationMinutes: { type: "integer", enum: [15, 30, 45, 60] },
      weeklySchedule: {
        type: "array",
        items: {
          type: "object",
          properties: {
            dayOfWeek: { type: "integer", minimum: 0, maximum: 6 },
            enabled: { type: "boolean" },
            ranges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  start: { type: "string", example: "09:00" },
                  end: { type: "string", example: "17:00" },
                },
              },
            },
          },
        },
      },
    },
  },
  FAQInput: {
    type: "object",
    required: ["section", "category", "question", "answer"],
    properties: {
      section: { type: "string" },
      category: { type: "string" },
      question: { type: "string" },
      answer: { type: "string" },
      order: { type: "integer" },
      status: { type: "string", enum: ["active", "inactive"] },
    },
  },
  ExamInput: {
    type: "object",
    required: ["examType"],
    properties: {
      examType: { type: "string" },
      preferredDate: { type: "string", format: "date" },
      notes: { type: "string" },
      status: { type: "string" },
    },
  },
  ProfileInput: {
    type: "object",
    properties: {
      name: { type: "string" },
      phone: { type: "string" },
      gender: { type: "string", enum: ["", "male", "female", "other"] },
      dateOfBirth: { type: "string", format: "date" },
      address: { type: "string" },
      city: { type: "string" },
      country: { type: "string" },
      language: { type: "string" },
      bio: { type: "string", maxLength: 500 },
    },
  },
  GenericInput: {
    type: "object",
    additionalProperties: true,
    description:
      "Endpoint-specific JSON fields. Expand the endpoint description and example before sending.",
  },
  GenericSuccess: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      message: { type: "string", example: "Request completed successfully." },
      data: {
        nullable: true,
        oneOf: [
          { type: "object", additionalProperties: true },
          {
            type: "array",
            items: { type: "object", additionalProperties: true },
          },
        ],
      },
      meta: { $ref: "#/components/schemas/PaginationMeta" },
    },
  },
};

const publicOperations = new Set([
  "POST /api/auth/register",
  "POST /api/auth/login",
  "GET /api/teachers/public",
  "GET /api/offers",
  "GET /api/offers/{id}",
  "GET /api/blogs",
  "GET /api/blogs/{slug}",
  "GET /api/faqs",
  "GET /api/testimonials",
  "GET /api/quizzes",
  "GET /api/quizzes/{quizId}",
  "GET /api/quizzes/road-signs/list",
  "GET /api/bookings/available-slots",
]);

const bodySchemaFor = (method, apiPath) => {
  if (method === "GET" || method === "DELETE") return null;
  if (apiPath === "/api/auth/register") return "RegisterInput";
  if (apiPath === "/api/auth/login") return "LoginInput";
  if (apiPath.includes("/offers")) return "Offer";
  if (apiPath === "/api/bookings") return "BookingInput";
  if (apiPath.includes("/teachers/locations")) return "LocationInput";
  if (apiPath.includes("/teachers/availability")) return "AvailabilityInput";
  if (apiPath.includes("/faqs")) return "FAQInput";
  if (apiPath.includes("/exams")) return "ExamInput";
  if (apiPath.endsWith("/profile")) return "ProfileInput";
  return "GenericInput";
};

const summaryFor = (method, apiPath) => {
  const words = apiPath
    .replace(/^\/api\//, "")
    .replace(/\{[^}]+\}/g, "record")
    .split(/[\/-]/)
    .filter(Boolean);
  return `${method[0] + method.slice(1).toLowerCase()} ${words.join(" ")}`;
};

const paths = {};
for (const [routeName, prefix] of Object.entries(mounts)) {
  const filename = `${routeName}.js`;
  const raw = fs.readFileSync(path.join(routesDir, filename), "utf8");
  const source = raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const regex = /router\.(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/g;
  for (const match of source.matchAll(regex)) {
    const method = match[1].toUpperCase();
    const routePath = match[2] === "/" ? "" : match[2];
    const apiPath = `${prefix}${routePath}`.replace(
      /:([A-Za-z0-9_]+)/g,
      "{$1}",
    );
    const key = `${method} ${apiPath}`;
    const parameters = [...apiPath.matchAll(/\{([^}]+)\}/g)].map((item) => ({
      name: item[1],
      in: "path",
      required: true,
      schema: { type: "string" },
      example: "66b1f1234567890abcdef123",
    }));
    if (method === "GET" && !parameters.length)
      parameters.push(
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
        {
          name: "status",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
      );
    const bodySchema = bodySchemaFor(method, apiPath);
    paths[apiPath] ||= {};
    paths[apiPath][method.toLowerCase()] = {
      tags: [prefix.split("/").pop()],
      summary: summaryFor(method, apiPath),
      description: `Source: routes/${filename}. Use the Authorize button for protected endpoints.`,
      operationId: `${routeName}_${method.toLowerCase()}_${apiPath.replace(/[^A-Za-z0-9]+/g, "_")}`,
      ...(publicOperations.has(key)
        ? {}
        : { security: [{ bearerAuth: [] }, { cookieAuth: [] }] }),
      ...(parameters.length ? { parameters } : {}),
      ...(bodySchema
        ? {
            requestBody: {
              required: method === "POST",
              content: {
                "application/json": {
                  schema: { $ref: `#/components/schemas/${bodySchema}` },
                },
              },
            },
          }
        : {}),
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema:
                apiPath === "/api/auth/login"
                  ? { $ref: "#/components/schemas/AuthResponse" }
                  : { $ref: "#/components/schemas/GenericSuccess" },
            },
          },
        },
        ...(method === "POST"
          ? {
              201: {
                description: "Created successfully",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/GenericSuccess" },
                  },
                },
              },
            }
          : {}),
        400: {
          description: "Invalid input",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        401: {
          description: "Authentication required or token invalid",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        403: {
          description: "Role is not allowed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        404: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
      },
    };
  }
}

const document = {
  openapi: "3.0.3",
  info: {
    title: "PermisGo Backend API",
    version: "2.0.0",
    description:
      "Interactive API reference generated from the active Express routes. Authenticate with a JWT from POST /api/auth/login, then click Authorize and enter the token.",
  },
  servers: [
    { url: "/", description: "Current server" },
    { url: "http://localhost:5000", description: "Local development" },
  ],
  tags: Object.values(mounts).map((prefix) => ({
    name: prefix.split("/").pop(),
  })),
  paths,
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      cookieAuth: { type: "apiKey", in: "cookie", name: "token" },
    },
    schemas,
  },
};

fs.writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`);
console.log(
  `OpenAPI generated: ${Object.keys(paths).length} paths -> ${output}`,
);
