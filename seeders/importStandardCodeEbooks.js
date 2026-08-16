import "dotenv/config";
import mongoose from "mongoose";

import EbookCourse from "../models/EbookCourse.js";
import EbookLesson from "../models/EbookLesson.js";
import EbookTopic from "../models/EbookTopic.js";

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const courses = [
  {
    title: "Legal Provisions Regarding Road Traffic",
    cover: "/image/legal-road-traffic.png",
    topics: [
      "Road traffic law fundamentals",
      "Driver responsibilities",
      "Offences and penalties",
    ],
  },
  {
    title: "First Aid for Drivers",
    cover: "/image/help.jpg",
    topics: [
      "Protecting an accident scene",
      "Alerting emergency services",
      "Assisting injured people",
    ],
  },
  {
    title: "The Driver",
    cover: "/image/the-driver.png",
    topics: [
      "Observation and awareness",
      "Driver behaviour and risk",
      "Fitness to drive",
    ],
  },
  {
    title: "Precautions When Leaving the Vehicle",
    cover: "/image/precautions-vehicle.png",
    topics: [
      "Safe stopping and parking",
      "Leaving the vehicle safely",
      "Securing passengers and loads",
    ],
  },
  {
    title: "The Road",
    cover: "/image/the-road.png",
    topics: [
      "Road layout and markings",
      "Junctions and roundabouts",
      "Speed and stopping distance",
    ],
  },
  {
    title: "Mechanical Components and Safety",
    cover: "/image/mechanical-components.png",
    topics: [
      "Vehicle safety checks",
      "Tyres brakes and steering",
      "Warning lights and maintenance",
    ],
  },
  {
    title: "Other Road Users",
    cover: "/image/other-road-users.png",
    topics: [
      "Pedestrians and cyclists",
      "Motorcycles and heavy vehicles",
      "Vulnerable road users",
    ],
  },
  {
    title: "Vehicle Safety Equipment",
    cover: "/image/vehicle-safety.png",
    topics: [
      "Seat belts and child restraints",
      "Lighting and visibility",
      "Active safety systems",
    ],
  },
  {
    title: "General Regulations",
    cover: "/image/road-signs.png",
    topics: ["Signs and signals", "Required documents", "Sharing public roads"],
  },
  {
    title: "Eco Driving",
    cover: "/image/traffic-hero.png",
    topics: [
      "Fuel-efficient driving",
      "Reducing emissions",
      "Responsible vehicle use",
    ],
  },
];

const lessonKinds = [
  {
    suffix: "Essential Knowledge",
    intro:
      "Learn the key rules, terminology and observations required for this topic.",
    bullets: [
      "Identify the rule before acting.",
      "Observe signs, road markings and surrounding traffic.",
      "Choose the safest legal response.",
    ],
  },
  {
    suffix: "Practical Application",
    intro:
      "Apply the topic in realistic driving situations and build safe decision-making habits.",
    bullets: [
      "Scan early and anticipate developing hazards.",
      "Adjust speed and position before the risk increases.",
      "Communicate clearly and leave a safe margin.",
    ],
  },
];

const buildBlocks = (course, topic, kind) => [
  {
    title: topic,
    image: course.cover,
    description: `${kind.intro} This lesson is part of ${course.title} and focuses on ${topic.toLowerCase()}.`,
    bulletPoints: kind.bullets,
    footerText:
      "Always combine the Highway Code rules with observation and sound judgement.",
  },
  {
    title: "Remember and check",
    image: "",
    description:
      "Before continuing, make sure you can recognise the situation, explain the risk and select the safest response.",
    bulletPoints: [
      "What information is available?",
      "Who could be affected by your decision?",
      "Is your speed, position and signalling appropriate?",
    ],
    footerText: "Review this lesson again if any point is unclear.",
  },
];

const run = async () => {
  await mongoose.connect(mongoUri);

  try {
    let topicCount = 0;
    let lessonCount = 0;

    for (let courseIndex = 0; courseIndex < courses.length; courseIndex += 1) {
      const definition = courses[courseIndex];
      const existingCourse = await EbookCourse.findOne({
        title: definition.title,
      }).lean();
      const coverImage = /^https:\/\/res\.cloudinary\.com\//.test(
        existingCourse?.coverImage || "",
      )
        ? existingCourse.coverImage
        : definition.cover;
      const runtimeDefinition = { ...definition, cover: coverImage };
      const course = await EbookCourse.findOneAndUpdate(
        { title: definition.title },
        {
          $set: {
            description: `A structured Code eBook course covering ${definition.title.toLowerCase()} with concise theory and practical application lessons.`,
            coverImage,
            order: courseIndex + 1,
            status: "active",
          },
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );

      const oldTopicIds = await EbookTopic.find({
        course: course._id,
      }).distinct("_id");
      await EbookLesson.deleteMany({
        $or: [{ course: course._id }, { topic: { $in: oldTopicIds } }],
      });
      await EbookTopic.deleteMany({ course: course._id });

      for (
        let topicIndex = 0;
        topicIndex < definition.topics.length;
        topicIndex += 1
      ) {
        const topicTitle = definition.topics[topicIndex];
        const topic = await EbookTopic.create({
          course: course._id,
          title: topicTitle,
          description: `Study ${topicTitle.toLowerCase()} through theory and practical examples.`,
          order: topicIndex + 1,
          status: "active",
        });
        topicCount += 1;

        for (
          let kindIndex = 0;
          kindIndex < lessonKinds.length;
          kindIndex += 1
        ) {
          const kind = lessonKinds[kindIndex];
          await EbookLesson.create({
            course: course._id,
            topic: topic._id,
            title: `${topicTitle}: ${kind.suffix}`,
            subtitle: kind.intro,
            coverImage,
            contentBlocks: buildBlocks(runtimeDefinition, topicTitle, kind),
            videos: [],
            materials: [],
            order: kindIndex + 1,
            status: "active",
          });
          lessonCount += 1;
        }
      }
    }

    const importedCourseIds = await EbookCourse.find({
      title: { $in: courses.map((course) => course.title) },
      status: "active",
    }).distinct("_id");
    const verifiedTopics = await EbookTopic.countDocuments({
      course: { $in: importedCourseIds },
      status: "active",
    });
    const verifiedLessons = await EbookLesson.countDocuments({
      course: { $in: importedCourseIds },
      status: "active",
    });

    console.log(
      JSON.stringify(
        {
          success: true,
          courses: importedCourseIds.length,
          topics: verifiedTopics,
          lessons: verifiedLessons,
          createdTopics: topicCount,
          createdLessons: lessonCount,
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
