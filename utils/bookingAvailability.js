import ApiError from "./ApiError.js";

export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"];

export const getId = (value) => String(value?._id || value || "");

export const parseBookingDate = (value) => {
  if (!value) {
    throw new ApiError(400, "Booking date is required.");
  }

  const text = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00.000Z`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Invalid booking date.");
  }

  return date;
};

export const getUtcDayRange = (value) => {
  const date = parseBookingDate(value);
  const start = new Date(date);
  const end = new Date(date);

  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);

  return { date: start, start, end };
};

export const normalizeTime = (value, label = "Time") => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new ApiError(400, `${label} must use HH:mm format.`);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new ApiError(400, `Invalid ${label.toLowerCase()}.`);
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export const timeToMinutes = (value) => {
  const [hour, minute] = String(value).split(":").map(Number);
  return hour * 60 + minute;
};

export const minutesToTime = (value) => {
  const minutes = Math.max(0, Math.min(1439, Number(value) || 0));
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const dateKey = (value) => {
  const date = parseBookingDate(value);
  return date.toISOString().slice(0, 10);
};

export const getTeacherWorkingSlots = (availability, bookingDate) => {
  const date = parseBookingDate(bookingDate);
  const key = dateKey(date);

  const exception = availability?.dateExceptions?.find(
    (item) => dateKey(item.date) === key,
  );

  if (exception) {
    if (exception.unavailable) return [];
    return Array.isArray(exception.slots) ? exception.slots : [];
  }

  const day = date.getUTCDay();
  const scheduleDay = availability?.weeklySchedule?.find(
    (item) => Number(item.dayOfWeek) === day,
  );

  if (!scheduleDay?.enabled) return [];
  return Array.isArray(scheduleDay.slots) ? scheduleDay.slots : [];
};

export const isTimeInsideWorkingSlots = ({
  availability,
  bookingDate,
  startTime,
  endTime,
}) => {
  // Teachers without a saved schedule remain bookable for backward compatibility.
  if (!availability) return true;

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const workingSlots = getTeacherWorkingSlots(availability, bookingDate);

  return workingSlots.some((slot) => {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    return start >= slotStart && end <= slotEnd;
  });
};

export const hasOccupiedConflict = ({
  startTime,
  endTime,
  occupiedSlots = [],
  bufferMinutes = 0,
}) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const buffer = Number(bufferMinutes) || 0;

  return occupiedSlots.some((slot) => {
    const occupiedStart = timeToMinutes(slot.startTime) - buffer;
    const occupiedEnd = timeToMinutes(slot.endTime) + buffer;
    return start < occupiedEnd && end > occupiedStart;
  });
};

export const buildAvailableSlots = ({
  availability,
  bookingDate,
  duration,
  occupiedSlots = [],
}) => {
  const safeDuration = Number(duration);
  if (!safeDuration || safeDuration < 30 || safeDuration > 240) {
    throw new ApiError(400, "Duration must be between 30 and 240 minutes.");
  }

  const workingSlots = availability
    ? getTeacherWorkingSlots(availability, bookingDate)
    : [{ startTime: "08:00", endTime: "20:00" }];

  const interval = Number(availability?.slotIntervalMinutes) || 30;
  const buffer = Number(availability?.bufferMinutes) || 0;
  const result = [];

  workingSlots.forEach((workingSlot) => {
    const workStart = timeToMinutes(workingSlot.startTime);
    const workEnd = timeToMinutes(workingSlot.endTime);

    for (
      let cursor = workStart;
      cursor + safeDuration <= workEnd;
      cursor += interval
    ) {
      const startTime = minutesToTime(cursor);
      const endTime = minutesToTime(cursor + safeDuration);

      if (
        !hasOccupiedConflict({
          startTime,
          endTime,
          occupiedSlots,
          bufferMinutes: buffer,
        })
      ) {
        result.push({ startTime, endTime, duration: safeDuration });
      }
    }
  });

  return result;
};

export const haversineDistanceKm = (lat1, lng1, lat2, lng2) => {
  const toRadians = (value) => (Number(value) * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(Number(lat2) - Number(lat1));
  const dLng = toRadians(Number(lng2) - Number(lng1));

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
