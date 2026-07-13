// import mongoose from "mongoose";
// import LearningContent from "../models/LearningContent.js";
// import LearningProgress from "../models/LearningProgress.js";

// const getFilePath = (file) => {
//   if (!file) return "";
//   return `/uploads/${file.filename}`;
// };

// const getSingleFile = (req, fieldName) => {
//   if (!req.files) return null;

//   if (Array.isArray(req.files)) {
//     return req.files.find((file) => file.fieldname === fieldName) || null;
//   }

//   return req.files[fieldName]?.[0] || null;
// };

// const parseTags = (tags) => {
//   if (!tags) return [];

//   if (Array.isArray(tags)) return tags;

//   return tags
//     .split(",")
//     .map((tag) => tag.trim())
//     .filter(Boolean);
// };

// // Admin: create content
// export const createLearningContent = async (req, res) => {
//   try {
//     const imageFile = getSingleFile(req, "image");
//     const file = getSingleFile(req, "file");

//     const {
//       title,
//       type,
//       subtitle,
//       category,
//       topicCode,
//       difficulty,
//       description,
//       content,
//       videoUrl,
//       tags,
//       order,
//       status,
//       isFeatured,
//     } = req.body;

//     if (!title || !type) {
//       return res.status(400).json({
//         success: false,
//         message: "Title and type are required",
//       });
//     }

//     const learningContent = await LearningContent.create({
//       title,
//       type,
//       subtitle,
//       category,
//       topicCode,
//       difficulty,
//       description,
//       content,
//       videoUrl,
//       tags: parseTags(tags),
//       order: Number(order || 0),
//       status: status || "active",
//       isFeatured: isFeatured === "true" || isFeatured === true,
//       image: getFilePath(imageFile),
//       fileUrl: getFilePath(file),
//       createdBy: req.userId,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Learning content created successfully",
//       data: learningContent,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Admin: get all content
// export const getAdminLearningContents = async (req, res) => {
//   try {
//     const { type, status, search } = req.query;

//     const filter = {};

//     if (type) filter.type = type;
//     if (status) filter.status = status;

//     if (search) {
//       filter.$or = [
//         { title: { $regex: search, $options: "i" } },
//         { subtitle: { $regex: search, $options: "i" } },
//         { category: { $regex: search, $options: "i" } },
//       ];
//     }

//     const contents = await LearningContent.find(filter).sort({
//       order: 1,
//       createdAt: -1,
//     });

//     res.status(200).json({
//       success: true,
//       data: contents,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Admin: update content
// export const updateLearningContent = async (req, res) => {
//   try {
//     const contentItem = await LearningContent.findById(req.params.id);

//     if (!contentItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Learning content not found",
//       });
//     }

//     const imageFile = getSingleFile(req, "image");
//     const file = getSingleFile(req, "file");

//     const updateData = {
//       ...req.body,
//     };

//     if (req.body.tags) {
//       updateData.tags = parseTags(req.body.tags);
//     }

//     if (imageFile) {
//       updateData.image = getFilePath(imageFile);
//     }

//     if (file) {
//       updateData.fileUrl = getFilePath(file);
//     }

//     if (req.body.order) {
//       updateData.order = Number(req.body.order);
//     }

//     if (req.body.isFeatured !== undefined) {
//       updateData.isFeatured =
//         req.body.isFeatured === "true" || req.body.isFeatured === true;
//     }

//     const updated = await LearningContent.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true },
//     );

//     res.status(200).json({
//       success: true,
//       message: "Learning content updated successfully",
//       data: updated,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Admin: inactive content
// export const deleteLearningContent = async (req, res) => {
//   try {
//     const contentItem = await LearningContent.findById(req.params.id);

//     if (!contentItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Learning content not found",
//       });
//     }

//     contentItem.status = "inactive";
//     await contentItem.save();

//     res.status(200).json({
//       success: true,
//       message: "Learning content inactive successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Student: get active content
// export const getLearningContents = async (req, res) => {
//   try {
//     const { type, category, topicCode, search } = req.query;

//     const filter = {
//       status: "active",
//     };

//     if (type) filter.type = type;
//     if (category) filter.category = category;
//     if (topicCode) filter.topicCode = topicCode;

//     if (search) {
//       filter.$or = [
//         { title: { $regex: search, $options: "i" } },
//         { subtitle: { $regex: search, $options: "i" } },
//         { category: { $regex: search, $options: "i" } },
//       ];
//     }

//     const contents = await LearningContent.find(filter).sort({
//       order: 1,
//       createdAt: -1,
//     });

//     const progressList = await LearningProgress.find({
//       student: req.userId,
//       content: { $in: contents.map((item) => item._id) },
//     });

//     const progressMap = new Map(
//       progressList.map((progress) => [progress.content.toString(), progress]),
//     );

//     const finalData = contents.map((item) => {
//       const obj = item.toObject();
//       obj.progress = progressMap.get(item._id.toString()) || null;
//       return obj;
//     });

//     res.status(200).json({
//       success: true,
//       data: finalData,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Student: update progress
// export const updateLearningProgress = async (req, res) => {
//   try {
//     const contentItem = await LearningContent.findById(req.params.id);

//     if (!contentItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Learning content not found",
//       });
//     }

//     const { status, readPercent, watchedSeconds, score } = req.body;

//     const updateData = {
//       contentType: contentItem.type,
//       lastViewedAt: new Date(),
//     };

//     if (status) updateData.status = status;
//     if (readPercent !== undefined) updateData.readPercent = Number(readPercent);
//     if (watchedSeconds !== undefined)
//       updateData.watchedSeconds = Number(watchedSeconds);
//     if (score !== undefined) updateData.score = Number(score);

//     if (status === "completed") {
//       updateData.readPercent = 100;
//       updateData.completedAt = new Date();
//     }

//     const progress = await LearningProgress.findOneAndUpdate(
//       {
//         student: req.userId,
//         content: contentItem._id,
//       },
//       {
//         $set: updateData,
//       },
//       {
//         new: true,
//         upsert: true,
//         setDefaultsOnInsert: true,
//       },
//     );

//     res.status(200).json({
//       success: true,
//       message: "Progress updated",
//       data: progress,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Student: favorite
// export const toggleLearningFavorite = async (req, res) => {
//   try {
//     const contentItem = await LearningContent.findById(req.params.id);

//     if (!contentItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Learning content not found",
//       });
//     }

//     let progress = await LearningProgress.findOne({
//       student: req.userId,
//       content: contentItem._id,
//     });

//     if (!progress) {
//       progress = await LearningProgress.create({
//         student: req.userId,
//         content: contentItem._id,
//         contentType: contentItem.type,
//         isFavorite: true,
//       });
//     } else {
//       progress.isFavorite = !progress.isFavorite;
//       await progress.save();
//     }

//     res.status(200).json({
//       success: true,
//       message: "Favorite updated",
//       data: progress,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Student: progress summary
// export const getLearningSummary = async (req, res) => {
//   try {
//     const types = ["road-sign", "code-ebook", "knowledge-sheet", "live-replay"];

//     const summary = [];

//     for (const type of types) {
//       const total = await LearningContent.countDocuments({
//         type,
//         status: "active",
//       });

//       const completed = await LearningProgress.countDocuments({
//         student: req.userId,
//         contentType: type,
//         status: "completed",
//       });

//       summary.push({
//         type,
//         total,
//         completed,
//         percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: summary,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

import LearningContent from "../models/LearningContent.js";
import LearningProgress from "../models/LearningProgress.js";

import {
  deleteStoredFile,
  getUploadedFileUrl,
} from "../utils/uploadHelpers.js";

const getFilePath = (file) => {
  return getUploadedFileUrl(file);
};

const getSingleFile = (req, fieldName) => {
  if (!req.files) return null;

  if (Array.isArray(req.files)) {
    return req.files.find((file) => file.fieldname === fieldName) || null;
  }

  return req.files[fieldName]?.[0] || null;
};

const parseTags = (tags) => {
  if (!tags) return [];

  if (Array.isArray(tags)) return tags;

  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const normalizeRelatedQuiz = (value) => {
  if (!value || value === "null" || value === "undefined") return null;
  return value;
};

// Admin: create content
export const createLearningContent = async (req, res) => {
  try {
    const imageFile = getSingleFile(req, "image");
    const file = getSingleFile(req, "file");

    const {
      title,
      type,
      subtitle,
      category,
      topicCode,
      difficulty,
      description,
      content,
      videoUrl,
      relatedQuiz,
      tags,
      order,
      status,
      isFeatured,
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: "Title and type are required",
      });
    }

    const learningContent = await LearningContent.create({
      title,
      type,
      subtitle: subtitle || "",
      category: category || "",
      topicCode: topicCode || "",
      difficulty: difficulty || "beginner",
      description: description || "",
      content: content || "",
      videoUrl: videoUrl || "",
      relatedQuiz: normalizeRelatedQuiz(relatedQuiz),
      tags: parseTags(tags),
      order: Number(order || 0),
      status: status || "active",
      isFeatured: isFeatured === "true" || isFeatured === true,
      image: getFilePath(imageFile),
      fileUrl: getFilePath(file),
      createdBy: req.userId,
    });

    res.status(201).json({
      success: true,
      message: "Learning content created successfully",
      data: learningContent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin: get all content
export const getAdminLearningContents = async (req, res) => {
  try {
    const { type, status, search } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const contents = await LearningContent.find(filter)
      .populate(
        "relatedQuiz",
        "title type totalQuestions passingScore durationMinutes",
      )
      .sort({
        order: 1,
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      data: contents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin: update content
export const updateLearningContent = async (req, res) => {
  try {
    const contentItem = await LearningContent.findById(req.params.id);

    if (!contentItem) {
      return res.status(404).json({
        success: false,
        message: "Learning content not found",
      });
    }

    const imageFile = getSingleFile(req, "image");

    const file = getSingleFile(req, "file");

    const oldImageUrl = contentItem.image || "";
    const oldFileUrl = contentItem.fileUrl || "";

    const updateData = {
      title: req.body.title,
      type: req.body.type,
      subtitle: req.body.subtitle,
      category: req.body.category,
      topicCode: req.body.topicCode,
      difficulty: req.body.difficulty,
      description: req.body.description,
      content: req.body.content,
      videoUrl: req.body.videoUrl,
      status: req.body.status,
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    if (req.body.relatedQuiz !== undefined) {
      updateData.relatedQuiz = normalizeRelatedQuiz(req.body.relatedQuiz);
    }

    if (req.body.tags !== undefined) {
      updateData.tags = parseTags(req.body.tags);
    }

    if (req.body.order !== undefined) {
      updateData.order = Number(req.body.order || 0);
    }

    if (req.body.isFeatured !== undefined) {
      updateData.isFeatured =
        req.body.isFeatured === "true" || req.body.isFeatured === true;
    }

    if (imageFile) {
      updateData.image = getUploadedFileUrl(imageFile);
    }

    if (file) {
      updateData.fileUrl = getUploadedFileUrl(file);
    }

    const updated = await LearningContent.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).populate(
      "relatedQuiz",
      "title type totalQuestions passingScore durationMinutes",
    );

    /*
    Database update সফল হওয়ার পর
    পুরোনো files delete হবে।
    */
    if (imageFile && oldImageUrl && oldImageUrl !== updated.image) {
      await deleteStoredFile(oldImageUrl);
    }

    if (file && oldFileUrl && oldFileUrl !== updated.fileUrl) {
      await deleteStoredFile(oldFileUrl);
    }

    return res.status(200).json({
      success: true,
      message: "Learning content updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin: inactive content
export const deleteLearningContent = async (req, res) => {
  try {
    const contentItem = await LearningContent.findById(req.params.id);

    if (!contentItem) {
      return res.status(404).json({
        success: false,
        message: "Learning content not found",
      });
    }

    contentItem.status = "inactive";
    await contentItem.save();

    res.status(200).json({
      success: true,
      message: "Learning content inactive successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Student: get active content
export const getLearningContents = async (req, res) => {
  try {
    const { type, category, topicCode, search } = req.query;

    const filter = {
      status: "active",
    };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (topicCode) filter.topicCode = topicCode;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const contents = await LearningContent.find(filter)
      .populate(
        "relatedQuiz",
        "title type totalQuestions passingScore durationMinutes",
      )
      .sort({
        order: 1,
        createdAt: -1,
      });

    const progressList = await LearningProgress.find({
      student: req.userId,
      content: { $in: contents.map((item) => item._id) },
    });

    const progressMap = new Map(
      progressList.map((progress) => [progress.content.toString(), progress]),
    );

    const finalData = contents.map((item) => {
      const obj = item.toObject();
      obj.progress = progressMap.get(item._id.toString()) || null;
      return obj;
    });

    res.status(200).json({
      success: true,
      data: finalData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Student: update progress
export const updateLearningProgress = async (req, res) => {
  try {
    const contentItem = await LearningContent.findById(req.params.id);

    if (!contentItem) {
      return res.status(404).json({
        success: false,
        message: "Learning content not found",
      });
    }

    const { status, readPercent, watchedSeconds, score } = req.body;

    const updateData = {
      contentType: contentItem.type,
      lastViewedAt: new Date(),
    };

    if (status) updateData.status = status;

    if (readPercent !== undefined) {
      const value = Number(readPercent);
      updateData.readPercent = Math.min(Math.max(value, 0), 100);
    }

    if (watchedSeconds !== undefined) {
      updateData.watchedSeconds = Number(watchedSeconds);
    }

    if (score !== undefined) {
      updateData.score = Number(score);
    }

    if (status === "completed") {
      updateData.readPercent = 100;
      updateData.completedAt = new Date();
    }

    const progress = await LearningProgress.findOneAndUpdate(
      {
        student: req.userId,
        content: contentItem._id,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Progress updated",
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Student: favorite
export const toggleLearningFavorite = async (req, res) => {
  try {
    const contentItem = await LearningContent.findById(req.params.id);

    if (!contentItem) {
      return res.status(404).json({
        success: false,
        message: "Learning content not found",
      });
    }

    let progress = await LearningProgress.findOne({
      student: req.userId,
      content: contentItem._id,
    });

    if (!progress) {
      progress = await LearningProgress.create({
        student: req.userId,
        content: contentItem._id,
        contentType: contentItem.type,
        isFavorite: true,
      });
    } else {
      progress.isFavorite = !progress.isFavorite;
      await progress.save();
    }

    res.status(200).json({
      success: true,
      message: "Favorite updated",
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Student: progress summary
export const getLearningSummary = async (req, res) => {
  try {
    const types = ["road-sign", "code-ebook", "knowledge-sheet", "live-replay"];

    const summary = [];

    for (const type of types) {
      const total = await LearningContent.countDocuments({
        type,
        status: "active",
      });

      const completed = await LearningProgress.countDocuments({
        student: req.userId,
        contentType: type,
        status: "completed",
      });

      summary.push({
        type,
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
