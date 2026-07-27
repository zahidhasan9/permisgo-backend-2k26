import mongoose from "mongoose";

import Lesson from "../models/Lesson.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import sendResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const LESSON_STATUSES = [
  "scheduled",
  "in_progress",
  "awaiting_confirmation",
  "completed",
  "cancelled",
  "no_show",
];

const REQUEST_TYPES = ["all", "reschedule", "cancellation"];
const REQUEST_STATUSES = ["all", "none", "pending", "approved", "rejected"];
const LESSON_VIEWS = {
  action: ["in_progress", "awaiting_confirmation"],
  upcoming: ["scheduled"],
  history: ["completed", "cancelled", "no_show"],
};

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getId = (value) => String(value?._id || value?.id || value || "");

const getDayRange = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Invalid date filter.");
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getRoleFilter = (user) => {
  if (user.role === "student") {
    return { student: user._id };
  }

  if (user.role === "teacher") {
    return { teacher: user._id };
  }

  return {};
};

const populateLesson = (query) =>
  query
    .populate("student", "name email phone avatar status role")
    .populate("teacher", "name email phone avatar status role")
    .populate("rescheduleRequest.requestedBy", "name email role")
    .populate("rescheduleRequest.resolvedBy", "name email role")
    .populate("cancellationRequest.requestedBy", "name email role")
    .populate("cancellationRequest.resolvedBy", "name email role")
    .populate({
      path: "booking",
      populate: {
        path: "offer",
        select: "title salePrice category",
      },
    });

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const addDateFilters = (filter, query) => {
  if (!query.dateFrom && !query.dateTo) return;

  filter.lessonDate = {};

  if (query.dateFrom) {
    filter.lessonDate.$gte = getDayRange(query.dateFrom).start;
  }

  if (query.dateTo) {
    filter.lessonDate.$lte = getDayRange(query.dateTo).end;
  }
};

const addRequestFilters = (filter, query) => {
  const requestType = query.requestType || "all";
  const requestStatus = query.requestStatus || "pending";

  if (!REQUEST_TYPES.includes(requestType)) {
    throw new ApiError(400, "Invalid request type.");
  }

  if (!REQUEST_STATUSES.includes(requestStatus)) {
    throw new ApiError(400, "Invalid request status.");
  }

  if (requestType === "all") return;

  const field =
    requestType === "reschedule"
      ? "rescheduleRequest.status"
      : "cancellationRequest.status";

  filter[field] = requestStatus === "all" ? { $ne: "none" } : requestStatus;
};

const addSearchFilter = async (filter, searchValue) => {
  const search = String(searchValue || "")
    .trim()
    .slice(0, 80);

  if (!search) return true;

  const regex = new RegExp(escapeRegex(search), "i");

  const matchedUsers = await User.find({
    $or: [{ name: regex }, { email: regex }, { phone: regex }],
  })
    .select("_id")
    .limit(5000)
    .lean();

  const matchedUserIds = matchedUsers.map((user) => user._id);
  const searchConditions = [];

  if (matchedUserIds.length) {
    searchConditions.push(
      { student: { $in: matchedUserIds } },
      { teacher: { $in: matchedUserIds } },
    );
  }

  if (mongoose.Types.ObjectId.isValid(search)) {
    const objectId = new mongoose.Types.ObjectId(search);
    searchConditions.push({ _id: objectId }, { booking: objectId });
  }

  if (!searchConditions.length) {
    return false;
  }

  filter.$and = [...(filter.$and || []), { $or: searchConditions }];
  return true;
};

/**
 * GET /api/lessons
 *
 * Server-side filters:
 * page, limit, search, status, student, teacher,
 * dateFrom, dateTo, requestType, requestStatus, sortOrder
 */
export const getLessonsPaginated = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = getRoleFilter(req.user);

  const status = req.query.status || "all";
  const view = req.query.view || "";

  if (view) {
    if (!Object.hasOwn(LESSON_VIEWS, view)) {
      throw new ApiError(400, "Invalid lesson view.");
    }
    if (status !== "all") {
      if (!LESSON_VIEWS[view].includes(status)) {
        throw new ApiError(400, "Status does not belong to this lesson view.");
      }
      filter.status = status;
    } else {
      filter.status = { $in: LESSON_VIEWS[view] };
    }
  } else if (status !== "all") {
    if (!LESSON_STATUSES.includes(status)) {
      throw new ApiError(400, "Invalid lesson status filter.");
    }

    filter.status = status;
  }

  if (req.user.role === "admin" && req.query.student) {
    if (!mongoose.Types.ObjectId.isValid(req.query.student)) {
      throw new ApiError(400, "Invalid student filter.");
    }

    filter.student = req.query.student;
  }

  if (req.user.role === "admin" && req.query.teacher) {
    if (!mongoose.Types.ObjectId.isValid(req.query.teacher)) {
      throw new ApiError(400, "Invalid teacher filter.");
    }

    filter.teacher = req.query.teacher;
  }

  addDateFilters(filter, req.query);
  addRequestFilters(filter, req.query);

  const hasSearchMatch = await addSearchFilter(filter, req.query.search);

  if (!hasSearchMatch) {
    return sendResponse(res, 200, "Lessons fetched successfully.", [], {
      page,
      limit,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: page > 1,
    });
  }

  const sortDirection = req.query.sortOrder === "asc" ? 1 : -1;
  const sort = {
    lessonDate: sortDirection,
    startTime: sortDirection,
    _id: sortDirection,
  };

  const [lessons, total] = await Promise.all([
    populateLesson(
      Lesson.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ),
    Lesson.countDocuments(filter),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return sendResponse(res, 200, "Lessons fetched successfully.", lessons, {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  });
});

/**
 * GET /api/lessons/stats
 *
 * Counts are role-aware:
 * Admin gets all lessons, student gets own lessons,
 * teacher gets assigned lessons.
 */
export const getLessonStatsPaginated = asyncHandler(async (req, res) => {
  const filter = getRoleFilter(req.user);

  addDateFilters(filter, req.query);

  const [statusRows, pendingReschedules, pendingCancellations] =
    await Promise.all([
      Lesson.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Lesson.countDocuments({
        ...filter,
        "rescheduleRequest.status": "pending",
      }),
      Lesson.countDocuments({
        ...filter,
        "cancellationRequest.status": "pending",
      }),
    ]);

  const stats = {
    total: 0,
    scheduled: 0,
    in_progress: 0,
    awaiting_confirmation: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
    pendingReschedules,
    pendingCancellations,
    pendingRequests: pendingReschedules + pendingCancellations,
  };

  statusRows.forEach((row) => {
    if (row?._id && Object.hasOwn(stats, row._id)) {
      stats[row._id] = row.count;
      stats.total += row.count;
    }
  });

  return sendResponse(
    res,
    200,
    "Lesson statistics fetched successfully.",
    stats,
  );
});
