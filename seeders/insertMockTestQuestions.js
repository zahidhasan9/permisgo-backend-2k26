import "dotenv/config";
import mongoose from "mongoose";

import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const questions = [
  ["What is the safest action when a traffic light turns amber and you can stop safely?", ["Accelerate through the junction", "Stop before the stop line", "Sound the horn and continue", "Change lanes immediately"], 1, "R"],
  ["Before changing lanes, what should you do in addition to checking your mirrors?", ["Flash your headlights", "Check the blind spot", "Increase speed sharply", "Move first and signal later"], 1, "C"],
  ["What should you do when a pedestrian is already crossing at a zebra crossing?", ["Continue if you are below the speed limit", "Stop and let the pedestrian cross", "Drive around the pedestrian", "Use the horn to warn them"], 1, "U"],
  ["On a wet road, how should you adjust the distance from the vehicle ahead?", ["Reduce it to prevent overtaking", "Keep exactly the same distance", "Increase it because braking distance is longer", "Follow closely and brake gently"], 2, "R"],
  ["What is the correct response when an emergency vehicle approaches with lights and siren?", ["Maintain speed and position", "Make way safely without creating another danger", "Stop immediately in the traffic lane", "Follow closely behind it"], 1, "U"],
  ["If you begin to feel sleepy while driving, what is the safest choice?", ["Open a window and continue", "Drink water while driving", "Stop in a safe place and rest", "Drive faster to arrive sooner"], 2, "C"],
  ["Why must you reduce speed before entering a sharp bend?", ["To shorten your journey", "To avoid using the steering wheel", "To keep control and react to hidden hazards", "To allow vehicles behind to overtake"], 2, "R"],
  ["When may you use a handheld mobile phone while driving?", ["Only in slow traffic", "Only for a short call", "Never while controlling the vehicle", "When using one hand on the wheel"], 2, "D"],
  ["What should you check before starting a long journey?", ["Only the fuel level", "Tyres, lights, fluids, and planned rest breaks", "Only the navigation route", "Whether the horn is loud enough"], 1, "M"],
  ["What is the main purpose of keeping a safe following distance?", ["To prevent other vehicles merging", "To give enough time and space to stop", "To save fuel by using the slipstream", "To see the rear lights more clearly"], 1, "C"],
];

const run = async () => {
  await mongoose.connect(mongoUri);

  try {
    const quiz = await Quiz.findOne({
      _id: "6a5480aa1fa424943c9ae550",
      type: "mock_test",
      status: "active",
    });

    if (!quiz) throw new Error("The active Road Safety Rules mock test was not found.");

    for (let index = 0; index < questions.length; index += 1) {
      const [questionText, answers, correctOptionIndex, topic] = questions[index];
      await Question.findOneAndUpdate(
        { quiz: quiz._id, questionText },
        {
          $set: {
            quiz: quiz._id,
            questionText,
            questionImage: "",
            questionVideoUrl: "",
            promptCount: 1,
            secondaryQuestionText: "",
            voiceText: questionText,
            options: answers.map((text, optionIndex) => ({
              text,
              image: "",
              order: optionIndex + 1,
            })),
            correctOptionIndex,
            correctOptionIndexes: [correctOptionIndex],
            explanationText: "",
            explanationImage: "",
            markedAnswerImage: "",
            topic,
            difficulty: index < 3 ? "easy" : index < 7 ? "medium" : "hard",
            order: index + 1,
            status: "active",
          },
        },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
    }

    const totalQuestions = await Question.countDocuments({
      quiz: quiz._id,
      status: "active",
    });
    quiz.totalQuestions = totalQuestions;
    await quiz.save();

    console.log(
      JSON.stringify(
        { success: true, quizId: quiz._id, title: quiz.title, totalQuestions },
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
