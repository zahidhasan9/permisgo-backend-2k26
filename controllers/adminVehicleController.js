import TeacherProfile from "../models/TeacherProfile.js";
import TeacherVehicle from "../models/TeacherVehicle.js";
import ApiError from "../utils/ApiError.js";
import sendResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const APPROVAL_STATUSES = ["pending", "approved", "rejected"];

const getApprovalFilter = (approvalStatus) => {
  if (!approvalStatus || approvalStatus === "all") return {};

  if (approvalStatus === "approved") {
    return {
      $or: [
        { approvalStatus: "approved" },
        {
          approvalStatus: { $exists: false },
          status: "active",
        },
      ],
    };
  }

  if (approvalStatus === "pending") {
    return {
      $or: [
        { approvalStatus: "pending" },
        {
          approvalStatus: { $exists: false },
          status: { $ne: "active" },
        },
      ],
    };
  }

  return { approvalStatus };
};

export const getAdminTeacherVehicles = asyncHandler(async (req, res) => {
  const approvalStatus = String(req.query.approvalStatus || "all").toLowerCase();

  if (
    approvalStatus !== "all" &&
    !APPROVAL_STATUSES.includes(approvalStatus)
  ) {
    throw new ApiError(400, "Invalid approval status filter.");
  }

  const vehicles = await TeacherVehicle.find(
    getApprovalFilter(approvalStatus),
  )
    .populate("teacher", "name email phone avatar")
    .populate("approvedBy", "name email")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, "Teacher vehicles fetched successfully.", vehicles, {
    total: vehicles.length,
  });
});

export const getAdminTeacherVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await TeacherVehicle.findById(req.params.id)
    .populate("teacher", "name email phone avatar")
    .populate("approvedBy", "name email");

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found.");
  }

  sendResponse(res, 200, "Teacher vehicle fetched successfully.", vehicle);
});

export const updateTeacherVehicleApproval = asyncHandler(async (req, res) => {
  const approvalStatus = String(req.body.approvalStatus || "").toLowerCase();
  const adminNote = String(req.body.adminNote || "").trim();

  if (!APPROVAL_STATUSES.includes(approvalStatus)) {
    throw new ApiError(
      400,
      "Approval status must be pending, approved or rejected.",
    );
  }

  const vehicle = await TeacherVehicle.findById(req.params.id);

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found.");
  }

  vehicle.approvalStatus = approvalStatus;
  vehicle.status = approvalStatus === "approved" ? "active" : "inactive";
  vehicle.adminNote = adminNote;

  if (approvalStatus === "approved") {
    vehicle.approvedBy = req.user._id;
    vehicle.approvedAt = new Date();
  } else {
    vehicle.approvedBy = null;
    vehicle.approvedAt = null;
  }

  await vehicle.save();
  await vehicle.populate("teacher", "name email phone avatar");
  await vehicle.populate("approvedBy", "name email");

  const actionMessage =
    approvalStatus === "approved"
      ? "Vehicle approved successfully."
      : approvalStatus === "pending"
        ? "Vehicle de-approved and moved to pending."
        : "Vehicle rejected successfully.";

  sendResponse(res, 200, actionMessage, vehicle);
});

export const deleteTeacherVehicleByAdmin = asyncHandler(async (req, res) => {
  const vehicle = await TeacherVehicle.findById(req.params.id);

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found.");
  }

  await TeacherProfile.findOneAndUpdate(
    { user: vehicle.teacher },
    { $pull: { vehicles: vehicle._id } },
  );

  await vehicle.deleteOne();

  sendResponse(res, 200, "Vehicle deleted successfully.");
});
