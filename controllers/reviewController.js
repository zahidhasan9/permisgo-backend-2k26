import Review from "../models/Review.js";
import TeacherProfile from "../models/TeacherProfile.js";
import Lesson from "../models/Lesson.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";

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
  const ratedLessons = await Lesson.find({
    teacher: req.params.teacherId,
    status: "completed",
    "lessonProgress.feedbackSubmittedAt": { $ne: null },
    "lessonProgress.rating": { $gte: 1, $lte: 5 },
  })
    .select("student teacher lessonProgress.rating lessonProgress.studentNotes lessonProgress.feedbackSubmittedAt")
    .lean();

  if (ratedLessons.length) {
    await Review.bulkWrite(
      ratedLessons.map((lesson) => ({
        updateOne: {
          filter: { lesson: lesson._id },
          update: {
            $set: {
              student: lesson.student,
              teacher: lesson.teacher,
              rating: lesson.lessonProgress.rating,
              comment: lesson.lessonProgress.studentNotes || "",
              status: "visible",
            },
          },
          upsert: true,
        },
      })),
    );
  }

  const reviews = await Review.find({
    teacher: req.params.teacherId,
    status: "visible",
  })
    .populate("student", "name avatar")
    .sort({ createdAt: -1 });

  const average = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
    : 0;
  await TeacherProfile.findOneAndUpdate(
    { user: req.params.teacherId },
    { $set: { "rating.average": average, "rating.totalReviews": reviews.length } },
  );
  sendResponse(res, 200, "Reviews fetched.", reviews);
});
