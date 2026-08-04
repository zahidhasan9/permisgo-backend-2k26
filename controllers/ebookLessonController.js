import mongoose from "mongoose";
import EbookCourse from "../models/EbookCourse.js";
import EbookTopic from "../models/EbookTopic.js";
import EbookLesson from "../models/EbookLesson.js";
import EbookLessonProgress from "../models/EbookLessonProgress.js";
import {
  deleteStoredFile,
  getUploadedFileUrl,
} from "../utils/uploadHelpers.js";

const files = (req, name) =>
  Array.isArray(req.files)
    ? req.files.filter((file) => file.fieldname === name)
    : [];
const one = (req, name) => files(req, name)[0] || null;
const json = (value) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const assertStructure = async (courseId, topicId) => {
  if (!validId(courseId) || !validId(topicId)) return null;
  const [course, topic] = await Promise.all([
    EbookCourse.findById(courseId),
    EbookTopic.findOne({ _id: topicId, course: courseId }),
  ]);
  return course && topic ? { course, topic } : null;
};

const lessonPayload = (req, existing = null) => {
  const blockFiles = files(req, "blockImages");
  const materialFiles = files(req, "materials");
  const cover = one(req, "coverImage");
  const blocks = json(req.body.contentBlocks).map((block) => ({
    title: String(block.title || "").trim(),
    image:
      getUploadedFileUrl(blockFiles[Number(block.fileIndex)]) ||
      block.image ||
      "",
    description: String(block.description || "").trim(),
    bulletPoints: Array.isArray(block.bulletPoints)
      ? block.bulletPoints.map(String).filter(Boolean)
      : [],
    footerText: String(block.footerText || "").trim(),
  }));
  const materialMeta = json(req.body.materialMeta);
  const retained = json(req.body.existingMaterials);
  return {
    title: String(req.body.title || "").trim(),
    subtitle: String(req.body.subtitle || "").trim(),
    coverImage: getUploadedFileUrl(cover) || existing?.coverImage || "",
    contentBlocks: blocks,
    videos: json(req.body.videos).filter((item) => item.title && item.url),
    materials: [
      ...retained,
      ...materialFiles.map((file, index) => ({
        title: materialMeta[index]?.title || file.originalname,
        readMinutes: Number(materialMeta[index]?.readMinutes) || 0,
        fileUrl: getUploadedFileUrl(file),
      })),
    ],
    order: Number(req.body.order) || 0,
    status: ["draft", "active", "inactive"].includes(req.body.status)
      ? req.body.status
      : "draft",
  };
};

export const listAdminLessons = async (req, res) => {
  try {
    const {
      courseId,
      topicId,
      page = 1,
      limit = 10,
      search = "",
      status = "",
    } = req.query;
    const filter = {};
    if (validId(courseId)) filter.course = courseId;
    if (validId(topicId)) filter.topic = topicId;
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: "i" };
    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const [items, total] = await Promise.all([
      EbookLesson.find(filter)
        .populate("course topic", "title")
        .sort({ order: 1, createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      EbookLesson.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          pages: Math.max(Math.ceil(total / pageSize), 1),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminLesson = async (req, res) => {
  const lesson = validId(req.params.lessonId)
    ? await EbookLesson.findById(req.params.lessonId).populate(
        "course topic",
        "title",
      )
    : null;
  if (!lesson)
    return res
      .status(404)
      .json({ success: false, message: "Lesson not found." });
  res.json({ success: true, data: lesson });
};

export const createLesson = async (req, res) => {
  try {
    const structure = await assertStructure(
      req.body.courseId,
      req.body.topicId,
    );
    if (!structure)
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid course and topic are required.",
        });
    const payload = lessonPayload(req);
    if (!payload.title || !payload.coverImage)
      return res
        .status(400)
        .json({
          success: false,
          message: "Lesson title and cover image are required.",
        });
    const lesson = await EbookLesson.create({
      ...payload,
      course: structure.course._id,
      topic: structure.topic._id,
      createdBy: req.userId,
    });
    res
      .status(201)
      .json({ success: true, message: "Lesson created.", data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLesson = async (req, res) => {
  try {
    const lesson = validId(req.params.lessonId)
      ? await EbookLesson.findById(req.params.lessonId)
      : null;
    if (!lesson)
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found." });
    const structure = await assertStructure(
      req.body.courseId || lesson.course,
      req.body.topicId || lesson.topic,
    );
    if (!structure)
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid course and topic are required.",
        });
    const oldCover = lesson.coverImage;
    Object.assign(lesson, lessonPayload(req, lesson), {
      course: structure.course._id,
      topic: structure.topic._id,
    });
    if (!lesson.title)
      return res
        .status(400)
        .json({ success: false, message: "Lesson title is required." });
    await lesson.save();
    if (oldCover && oldCover !== lesson.coverImage)
      await deleteStoredFile(oldCover).catch(() => null);
    res.json({ success: true, message: "Lesson updated.", data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLesson = async (req, res) => {
  const lesson = validId(req.params.lessonId)
    ? await EbookLesson.findById(req.params.lessonId)
    : null;
  if (!lesson)
    return res
      .status(404)
      .json({ success: false, message: "Lesson not found." });
  lesson.status = "inactive";
  await lesson.save();
  res.json({ success: true, message: "Lesson deactivated." });
};

export const permanentlyDeleteLesson = async (req, res) => {
  try {
    const lesson = validId(req.params.lessonId)
      ? await EbookLesson.findById(req.params.lessonId)
      : null;
    if (!lesson)
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found." });

    const storedFiles = [
      lesson.coverImage,
      ...(lesson.contentBlocks || []).map((block) => block.image),
      ...(lesson.materials || []).map((material) => material.fileUrl),
      ...(lesson.videos || []).map((video) => video.thumbnail),
    ].filter(Boolean);

    await Promise.all([
      lesson.deleteOne(),
      EbookLessonProgress.deleteMany({ lesson: lesson._id }),
    ]);
    await Promise.all(
      [...new Set(storedFiles)].map((file) =>
        deleteStoredFile(file).catch(() => null),
      ),
    );

    res.json({
      success: true,
      message: "Lesson permanently deleted.",
      data: { id: req.params.lessonId },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listStudentLessons = async (req, res) => {
  try {
    const structure = await assertStructure(
      req.params.courseId,
      req.params.topicId,
    );
    if (
      !structure ||
      structure.course.status !== "active" ||
      structure.topic.status !== "active"
    )
      return res
        .status(404)
        .json({ success: false, message: "Course topic not found." });
    const lessons = await EbookLesson.find({
      course: structure.course._id,
      topic: structure.topic._id,
      status: "active",
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    const progressList = await EbookLessonProgress.find({
      student: req.userId,
      lesson: { $in: lessons.map((lesson) => lesson._id) },
    }).lean();
    const progressByLesson = new Map(
      progressList.map((progress) => [String(progress.lesson), progress]),
    );
    res.json({
      success: true,
      data: lessons.map((lesson) => ({
        ...lesson,
        progress: progressByLesson.get(String(lesson._id)) || null,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentLesson = async (req, res) => {
  const lesson = validId(req.params.lessonId)
    ? await EbookLesson.findOne({ _id: req.params.lessonId, status: "active" })
        .populate("course topic", "title status")
        .lean()
    : null;
  if (
    !lesson ||
    lesson.course?.status !== "active" ||
    lesson.topic?.status !== "active"
  )
    return res
      .status(404)
      .json({ success: false, message: "Lesson not found." });
  const progress = await EbookLessonProgress.findOne({
    student: req.userId,
    lesson: lesson._id,
  }).lean();
  res.json({ success: true, data: { ...lesson, progress: progress || null } });
};

export const updateStudentLessonProgress = async (req, res) => {
  try {
    const lesson = validId(req.params.lessonId)
      ? await EbookLesson.findOne({
          _id: req.params.lessonId,
          status: "active",
        })
      : null;
    if (!lesson)
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found." });

    const requestedPercent = Math.max(
      0,
      Math.min(Number(req.body.readPercent) || 0, 100),
    );
    const completed =
      req.body.status === "completed" || requestedPercent >= 100;
    const current = await EbookLessonProgress.findOne({
      student: req.userId,
      lesson: lesson._id,
    });
    const readPercent = completed
      ? 100
      : Math.max(Number(current?.readPercent || 0), requestedPercent);

    const progress = await EbookLessonProgress.findOneAndUpdate(
      { student: req.userId, lesson: lesson._id },
      {
        $set: {
          status: completed
            ? "completed"
            : readPercent > 0
              ? "in-progress"
              : "not-started",
          readPercent,
          lastViewedAt: new Date(),
          completedAt: completed ? current?.completedAt || new Date() : null,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    res.json({
      success: true,
      message: completed ? "Lesson completed." : "Lesson progress updated.",
      data: progress,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
