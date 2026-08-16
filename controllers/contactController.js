import ContactSubmission from "../models/ContactSubmission.js";
import Setting from "../models/Setting.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import sendResponse from "../utils/ApiResponse.js";
import sendEmail from "../utils/sendEmail.js";
import {
  buildSiteSettings,
  SITE_SETTING_KEYS,
} from "../config/siteSettings.js";

const clean = (value) => String(value || "").trim();
const escapeHtml = (value) =>
  clean(value).replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ],
  );

export const createContactSubmission = asyncHandler(async (req, res) => {
  const payload = {
    firstName: clean(req.body.firstName),
    lastName: clean(req.body.lastName),
    email: clean(req.body.email).toLowerCase(),
    phone: clean(req.body.phone),
    subject: clean(req.body.subject),
    location: clean(req.body.location),
    description: clean(req.body.description),
  };
  if (Object.values(payload).some((value) => !value))
    throw new ApiError(400, "All contact fields are required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))
    throw new ApiError(400, "Please enter a valid email address.");

  const submission = await ContactSubmission.create(payload);
  const recipientSetting = await Setting.findOne({
    key: "contactRecipientEmail",
  }).lean();
  const recipient = clean(
    recipientSetting?.value ||
      process.env.CONTACT_RECIPIENT_EMAIL ||
      process.env.SMTP_USER,
  );
  if (recipient) {
    sendEmail({
      to: recipient,
      subject: `New contact request: ${payload.subject}`,
      text: `${payload.firstName} ${payload.lastName}\n${payload.email}\n${payload.phone}\n${payload.location}\n\n${payload.description}`,
      html: `<h2>New website contact request</h2><p><strong>Name:</strong> ${escapeHtml(payload.firstName)} ${escapeHtml(payload.lastName)}</p><p><strong>Email:</strong> ${escapeHtml(payload.email)}</p><p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p><p><strong>Subject:</strong> ${escapeHtml(payload.subject)}</p><p><strong>Location:</strong> ${escapeHtml(payload.location)}</p><p><strong>Description:</strong><br>${escapeHtml(payload.description).replace(/\n/g, "<br>")}</p>`,
    }).catch((error) =>
      console.error("Contact notification email failed:", error.message),
    );
  }
  sendResponse(res, 201, "Your message has been sent successfully.", {
    id: submission._id,
  });
});

export const getPublicContactConfig = asyncHandler(async (req, res) => {
  const settings = await Setting.find({
    key: { $in: SITE_SETTING_KEYS },
  }).lean();
  sendResponse(
    res,
    200,
    "Public contact configuration fetched.",
    buildSiteSettings(settings),
  );
});

export const getContactSubmissions = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const filter =
    req.query.status && req.query.status !== "all"
      ? { status: req.query.status }
      : {};
  const [items, total] = await Promise.all([
    ContactSubmission.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ContactSubmission.countDocuments(filter),
  ]);
  sendResponse(res, 200, "Contact submissions fetched.", {
    items,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

export const updateContactStatus = asyncHandler(async (req, res) => {
  if (!["new", "read", "resolved"].includes(req.body.status))
    throw new ApiError(400, "Invalid contact status.");
  const item = await ContactSubmission.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { returnDocument: "after", runValidators: true },
  );
  if (!item) throw new ApiError(404, "Contact submission not found.");
  sendResponse(res, 200, "Contact status updated.", item);
});
