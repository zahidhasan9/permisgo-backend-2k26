import TeacherProfile from "../models/TeacherProfile.js";
import TeacherVehicle from "../models/TeacherVehicle.js";
import ApiError from "../utils/ApiError.js";
import sendResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const MAX_VEHICLES_PER_TEACHER = 2;

const toBoolean = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

const getUploadedFileUrl = (file) => file?.url || file?.path || "";

const normalizeRegistrationNumber = (value = "") =>
  String(value).trim().toUpperCase();

const buildVehiclePayload = (body = {}) => {
  const brand = String(body.brand || "").trim();
  const model = String(body.model || "").trim();
  const registrationNumber = normalizeRegistrationNumber(
    body.registrationNumber,
  );
  const modelYear = Number(body.modelYear);
  const vehicleType = String(body.vehicleType || "")
    .trim()
    .toLowerCase();

  if (
    !brand ||
    !model ||
    !registrationNumber ||
    !body.modelYear ||
    !vehicleType
  ) {
    throw new ApiError(
      400,
      "Brand, model, model year, registration number and vehicle type are required.",
    );
  }

  if (!Number.isInteger(modelYear)) {
    throw new ApiError(400, "Model year must be a valid year.");
  }

  return {
    brand,
    model,
    vehicleName: String(body.vehicleName || `${brand} ${model}`).trim(),
    modelYear,
    registrationNumber,
    vehicleType,
    isDefault: toBoolean(body.isDefault),
  };
};

const ensureUniqueRegistrationNumber = async ({
  registrationNumber,
  excludeVehicleId,
}) => {
  const query = { registrationNumber };

  if (excludeVehicleId) {
    query._id = { $ne: excludeVehicleId };
  }

  const existingVehicle = await TeacherVehicle.findOne(query).select("_id");

  if (existingVehicle) {
    throw new ApiError(409, "This vehicle registration number already exists.");
  }
};

const syncTeacherProfileVehicle = async (teacherId, vehicleId) => {
  await TeacherProfile.findOneAndUpdate(
    { user: teacherId },
    {
      $setOnInsert: { user: teacherId },
      $addToSet: { vehicles: vehicleId },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
};

const setDefaultVehicle = async (teacherId, vehicleId) => {
  await TeacherVehicle.updateMany(
    {
      teacher: teacherId,
      _id: { $ne: vehicleId },
      isDefault: true,
    },
    { $set: { isDefault: false } },
  );
};

export const addTeacherVehicle = asyncHandler(async (req, res) => {
  const vehicleCount = await TeacherVehicle.countDocuments({
    teacher: req.user._id,
  });

  if (vehicleCount >= MAX_VEHICLES_PER_TEACHER) {
    throw new ApiError(
      400,
      `You can add a maximum of ${MAX_VEHICLES_PER_TEACHER} vehicles.`,
    );
  }

  const payload = buildVehiclePayload(req.body);

  await ensureUniqueRegistrationNumber({
    registrationNumber: payload.registrationNumber,
  });

  const vehicle = await TeacherVehicle.create({
    ...payload,
    teacher: req.user._id,
    vehicleImage: getUploadedFileUrl(req.file),
    approvalStatus: "pending",
    status: "inactive",
    approvedBy: null,
    approvedAt: null,
    adminNote: "",
  });

  await syncTeacherProfileVehicle(req.user._id, vehicle._id);

  if (vehicle.isDefault) {
    await setDefaultVehicle(req.user._id, vehicle._id);
  }

  sendResponse(
    res,
    201,
    "Vehicle added successfully and sent for admin approval.",
    vehicle,
  );
});

export const getMyTeacherVehicles = asyncHandler(async (req, res) => {
  const vehicles = await TeacherVehicle.find({ teacher: req.user._id })
    .populate("approvedBy", "name email")
    .sort({ isDefault: -1, createdAt: -1 });

  sendResponse(res, 200, "Vehicles fetched successfully.", vehicles);
});

export const getMyTeacherVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await TeacherVehicle.findOne({
    _id: req.params.id,
    teacher: req.user._id,
  }).populate("approvedBy", "name email");

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found.");
  }

  sendResponse(res, 200, "Vehicle fetched successfully.", vehicle);
});

export const updateMyTeacherVehicle = asyncHandler(async (req, res) => {
  const vehicle = await TeacherVehicle.findOne({
    _id: req.params.id,
    teacher: req.user._id,
  });

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found.");
  }

  const effectiveApprovalStatus =
    vehicle.approvalStatus ||
    (vehicle.status === "active" ? "approved" : "pending");

  if (effectiveApprovalStatus === "approved") {
    throw new ApiError(
      403,
      "An approved vehicle cannot be edited. Ask an admin to de-approve it first.",
    );
  }

  const payload = buildVehiclePayload(req.body);

  await ensureUniqueRegistrationNumber({
    registrationNumber: payload.registrationNumber,
    excludeVehicleId: vehicle._id,
  });

  Object.assign(vehicle, payload, {
    approvalStatus: "pending",
    status: "inactive",
    approvedBy: null,
    approvedAt: null,
    adminNote: "",
  });

  const uploadedFileUrl = getUploadedFileUrl(req.file);
  if (uploadedFileUrl) {
    vehicle.vehicleImage = uploadedFileUrl;
  }

  await vehicle.save();

  if (vehicle.isDefault) {
    await setDefaultVehicle(req.user._id, vehicle._id);
  }

  sendResponse(
    res,
    200,
    "Vehicle updated successfully and returned to pending approval.",
    vehicle,
  );
});
