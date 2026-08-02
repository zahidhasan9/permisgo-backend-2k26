import EbookCourse from "../models/EbookCourse.js";
import EbookTopic from "../models/EbookTopic.js";
import EbookLesson from "../models/EbookLesson.js";
import {
  deleteStoredFile,
  getUploadedFileUrl,
} from "../utils/uploadHelpers.js";

const clean = (value) => String(value || "").trim();
const courseImage = (req) => {
  if (!Array.isArray(req.files)) return null;
  return req.files.find((file) => file.fieldname === "coverImage") || null;
};

export const listCourses = async (req, res) => {
  try {
    const filter = req.user?.role === "admin" ? {} : { status: "active" };
    const courses = await EbookCourse.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .lean();
    const data = await Promise.all(
      courses.map(async (course) => ({
        ...course,
        topicCount: await EbookTopic.countDocuments({ course: course._id }),
        lessonCount: await EbookLesson.countDocuments({ course: course._id }),
      })),
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const title = clean(req.body.title);
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "Course title is required." });
    const image = courseImage(req);
    if (!image)
      return res
        .status(400)
        .json({ success: false, message: "Course cover image is required." });
    const course = await EbookCourse.create({
      title,
      description: clean(req.body.description),
      coverImage: getUploadedFileUrl(image),
      order: Number(req.body.order) || 0,
      status: req.body.status || "active",
      createdBy: req.userId,
    });
    res
      .status(201)
      .json({ success: true, message: "Course created.", data: course });
  } catch (error) {
    res
      .status(error?.code === 11000 ? 409 : 500)
      .json({
        success: false,
        message:
          error?.code === 11000 ? "Course already exists." : error.message,
      });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await EbookCourse.findById(req.params.courseId);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    const oldCover = course.coverImage;
    const image = courseImage(req);
    if (req.body.title !== undefined) course.title = clean(req.body.title);
    if (req.body.description !== undefined)
      course.description = clean(req.body.description);
    if (image) course.coverImage = getUploadedFileUrl(image);
    if (req.body.order !== undefined)
      course.order = Number(req.body.order) || 0;
    if (req.body.status !== undefined) course.status = req.body.status;
    await course.save();
    if (image && oldCover && oldCover !== course.coverImage)
      await deleteStoredFile(oldCover).catch(() => null);
    res.json({ success: true, message: "Course updated.", data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const topics = await EbookTopic.countDocuments({
      course: req.params.courseId,
    });
    if (topics)
      return res
        .status(409)
        .json({
          success: false,
          message: "Delete this course's topics first.",
        });
    const course = await EbookCourse.findByIdAndDelete(req.params.courseId);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    if (course.coverImage)
      await deleteStoredFile(course.coverImage).catch(() => null);
    res.json({ success: true, message: "Course deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listTopics = async (req, res) => {
  try {
    const course = await EbookCourse.findById(req.params.courseId).lean();
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    const filter = {
      course: course._id,
      ...(req.user?.role === "admin" ? {} : { status: "active" }),
    };
    const topics = await EbookTopic.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .lean();
    const data = await Promise.all(
      topics.map(async (topic) => ({
        ...topic,
        lessonCount: await EbookLesson.countDocuments({ topic: topic._id }),
      })),
    );
    res.json({ success: true, data: { course, topics: data } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTopic = async (req, res) => {
  try {
    const course = await EbookCourse.findById(req.params.courseId);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    const title = clean(req.body.title);
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "Topic title is required." });
    const topic = await EbookTopic.create({
      course: course._id,
      title,
      description: clean(req.body.description),
      order: Number(req.body.order) || 0,
      status: req.body.status || "active",
      createdBy: req.userId,
    });
    res
      .status(201)
      .json({ success: true, message: "Topic created.", data: topic });
  } catch (error) {
    res
      .status(error?.code === 11000 ? 409 : 500)
      .json({
        success: false,
        message:
          error?.code === 11000
            ? "Topic already exists in this course."
            : error.message,
      });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const topic = await EbookTopic.findById(req.params.topicId).populate(
      "course",
    );
    if (!topic)
      return res
        .status(404)
        .json({ success: false, message: "Topic not found." });
    if (req.body.title !== undefined) topic.title = clean(req.body.title);
    if (req.body.description !== undefined)
      topic.description = clean(req.body.description);
    if (req.body.order !== undefined) topic.order = Number(req.body.order) || 0;
    if (req.body.status !== undefined) topic.status = req.body.status;
    await topic.save();
    res.json({ success: true, message: "Topic updated.", data: topic });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTopic = async (req, res) => {
  try {
    const topic = await EbookTopic.findById(req.params.topicId).populate(
      "course",
    );
    if (!topic)
      return res
        .status(404)
        .json({ success: false, message: "Topic not found." });
    const lessons = await EbookLesson.countDocuments({ topic: topic._id });
    if (lessons)
      return res
        .status(409)
        .json({
          success: false,
          message: "Delete this topic's lessons first.",
        });
    await topic.deleteOne();
    res.json({ success: true, message: "Topic deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
