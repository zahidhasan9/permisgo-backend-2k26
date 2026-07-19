import TeacherAvailability from "../models/TeacherAvailability.js";
import ApiError from "../utils/ApiError.js";
import sendResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { timeToMinutes } from "../utils/bookingAvailability.js";

const validateTimeRanges = (slots = []) => {
  const normalized = slots.map((slot) => ({
    startTime: String(slot.startTime || "").trim(),
    endTime: String(slot.endTime || "").trim(),
  }));

  normalized.forEach((slot) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.startTime)) {
      throw new ApiError(400, "Every start time must use HH:mm format.");
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.endTime)) {
      throw new ApiError(400, "Every end time must use HH:mm format.");
    }
    if (timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime)) {
      throw new ApiError(400, "Availability end time must be after start time.");
    }
  });

  const sorted = [...normalized].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );

  for (let index = 1; index < sorted.length; index += 1) {
    if (
      timeToMinutes(sorted[index].startTime) <
      timeToMinutes(sorted[index - 1].endTime)
    ) {
      throw new ApiError(400, "Availability time ranges cannot overlap.");
    }
  }

  return normalized;
};

const normalizeWeeklySchedule = (weeklySchedule = []) => {
  if (!Array.isArray(weeklySchedule) || weeklySchedule.length !== 7) {
    throw new ApiError(400, "Weekly schedule must contain all 7 days.");
  }

  const dayMap = new Map();
  weeklySchedule.forEach((day) => {
    const dayOfWeek = Number(day.dayOfWeek);
    if (dayOfWeek < 0 || dayOfWeek > 6 || dayMap.has(dayOfWeek)) {
      throw new ApiError(400, "Weekly schedule contains an invalid day.");
    }

    const enabled = Boolean(day.enabled);
    dayMap.set(dayOfWeek, {
      dayOfWeek,
      enabled,
      slots: enabled ? validateTimeRanges(day.slots || []) : [],
    });
  });

  return Array.from({ length: 7 }, (_, dayOfWeek) => dayMap.get(dayOfWeek));
};

export const getMyAvailability = asyncHandler(async (req, res) => {
  let availability = await TeacherAvailability.findOne({
    teacher: req.user._id,
  });

  if (!availability) {
    availability = await TeacherAvailability.create({
      teacher: req.user._id,
    });
  }

  sendResponse(
    res,
    200,
    "Teacher availability fetched successfully.",
    availability,
  );
});

export const updateMyAvailability = asyncHandler(async (req, res) => {
  const weeklySchedule = normalizeWeeklySchedule(req.body.weeklySchedule);
  const bufferMinutes = Number(req.body.bufferMinutes ?? 15);
  const slotIntervalMinutes = Number(req.body.slotIntervalMinutes ?? 30);
  const lessonDurationOptions = Array.isArray(req.body.lessonDurationOptions)
    ? [...new Set(req.body.lessonDurationOptions.map(Number))]
    : [30, 60, 90, 120];

  if (bufferMinutes < 0 || bufferMinutes > 120) {
    throw new ApiError(400, "Buffer time must be between 0 and 120 minutes.");
  }

  if (![15, 30, 45, 60].includes(slotIntervalMinutes)) {
    throw new ApiError(400, "Slot interval must be 15, 30, 45 or 60 minutes.");
  }

  if (
    lessonDurationOptions.some(
      (duration) => !Number.isFinite(duration) || duration < 30 || duration > 240,
    )
  ) {
    throw new ApiError(
      400,
      "Lesson duration options must be between 30 and 240 minutes.",
    );
  }

  const availability = await TeacherAvailability.findOneAndUpdate(
    { teacher: req.user._id },
    {
      $set: {
        timezone: String(req.body.timezone || "Europe/Paris").trim(),
        weeklySchedule,
        bufferMinutes,
        slotIntervalMinutes,
        lessonDurationOptions,
      },
      $setOnInsert: { teacher: req.user._id },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  sendResponse(
    res,
    200,
    "Teacher availability updated successfully.",
    availability,
  );
});
