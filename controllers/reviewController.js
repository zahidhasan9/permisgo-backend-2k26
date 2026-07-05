import Review from "../models/Review";
import TeacherProfile from "../models/TeacherProfile";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";

export const createReview = asyncHandler(async (req, res) => {
  const review = await Review.create({ ...req.body, student: req.user._id });

  const reviews = await Review.find({
    teacher: review.teacher,
    status: "visible",
  });
  const average =
    reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;

  await TeacherProfile.findOneAndUpdate(
    { user: review.teacher },
    { rating: { average, totalReviews: reviews.length } },
  );

  sendResponse(res, 201, "Review created.", review);
});

export const getTeacherReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    teacher: req.params.teacherId,
    status: "visible",
  }).populate("student", "name avatar");
  sendResponse(res, 200, "Reviews fetched.", reviews);
});
