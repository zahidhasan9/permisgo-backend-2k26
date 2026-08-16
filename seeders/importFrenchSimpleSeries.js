import "dotenv/config";
import mongoose from "mongoose";

import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const option = (text, order) => ({ text, image: "", order });
const single = (
  questionText,
  options,
  correct,
  topic,
  explanationText = "",
) => ({
  questionText,
  promptCount: 1,
  secondaryQuestionText: "",
  options: options.map(option),
  correctOptionIndex: correct[0],
  correctOptionIndexes: correct,
  topic,
  explanationText,
});
const double = (
  questionText,
  secondaryQuestionText,
  options,
  correct,
  topic,
  explanationText = "",
) => ({
  questionText,
  promptCount: 2,
  secondaryQuestionText,
  options: options.map(option),
  correctOptionIndex: correct[0],
  correctOptionIndexes: correct,
  topic,
  explanationText,
});

const questions = [
  single(
    "La circulation va devenir à double sens :",
    ["à partir du panneau", "sur 200 mètres", "à 200 mètres"],
    [2],
    "L",
    "La circulation deviendra à double sens à 200 mètres.",
  ),
  single(
    "La balise qui signale la présence d’une intersection est celle qui est située en :",
    ["A", "B"],
    [1],
    "R",
    "La bonne balise est la balise B.",
  ),
  single(
    "À ce STOP, j’ai raison de m’arrêter sur ce passage piétons :",
    ["Oui", "Non"],
    [0],
    "R",
    "Oui, l’arrêt indiqué est correct.",
  ),
  double(
    "Le danger annoncé commence à 150 mètres :",
    "Le danger annoncé s’étend sur 600 mètres :",
    ["Oui", "Non", "Oui", "Non"],
    [0, 2],
    "L",
    "Le danger commence à 150 mètres et s’étend sur 600 mètres.",
  ),
  single(
    "Pour croiser ce piéton, je dois laisser un intervalle d’au moins :",
    ["50 cm", "1 mètre", "1,50 mètre"],
    [1],
    "U",
    "Il faut laisser un intervalle d’au moins 1 mètre.",
  ),
  single(
    "Sur cette route, la vitesse maximale autorisée en période probatoire est de :",
    ["70 km/h", "80 km/h"],
    [1],
    "L",
    "La vitesse maximale autorisée est de 80 km/h.",
  ),
  single(
    "Face à ce véhicule :",
    ["Je reste derrière ce véhicule", "Je le dépasse par la droite"],
    [1],
    "R",
    "Je peux le dépasser par la droite dans cette situation.",
  ),
  single(
    "Je suis autorisé à stationner des deux côtés de la chaussée :",
    ["Oui", "Non"],
    [0],
    "R",
    "Oui, le stationnement est autorisé des deux côtés.",
  ),
  single(
    "Je peux tourner à droite à la prochaine intersection :",
    ["Oui", "Non"],
    [1],
    "R",
    "Non, je ne peux pas tourner à droite.",
  ),
  double(
    "À 150 mètres, je céderai le passage à droite :",
    "À 150 mètres, je céderai le passage à gauche :",
    ["Oui", "Non", "Oui", "Non"],
    [0, 2],
    "R",
    "Je céderai le passage à droite et à gauche.",
  ),
  single(
    "Après ces panneaux, la vitesse maximale autorisée sera de :",
    [
      "50 km/h",
      "30 km/h, jusqu’à la prochaine intersection seulement",
      "30 km/h dans toute l’agglomération",
    ],
    [2],
    "L",
    "La limitation à 30 km/h s’applique dans toute l’agglomération.",
  ),
  single(
    "Je tiens compte du ou des indices, puis je détermine si c’est à moi de passer :",
    [
      "Indice A",
      "Indice B",
      "Oui, c’est à moi de passer",
      "Non, ce n’est pas à moi de passer",
    ],
    [0, 1, 2],
    "R",
    "Les deux indices doivent être pris en compte et c’est à moi de passer.",
  ),
  double(
    "Je peux m’arrêter brièvement le long du trottoir :",
    "Je peux m’arrêter brièvement à cheval sur le trottoir :",
    ["Oui", "Non", "Oui", "Non"],
    [1, 3],
    "R",
    "L’arrêt n’est autorisé dans aucune de ces deux positions.",
  ),
  single(
    "La balise à droite annonce la proximité d’un passage à niveau :",
    ["Oui", "Non"],
    [1],
    "L",
    "Non, cette balise n’annonce pas un passage à niveau.",
  ),
  single(
    "L’entrée de cette rue m’a été indiquée par le panneau :",
    ["A", "B", "C"],
    [1],
    "L",
    "Le panneau correct est le panneau B.",
  ),
  single(
    "Pour franchir cette intersection :",
    ["Je maintiens l’allure", "Je lâche l’accélérateur"],
    [1],
    "R",
    "Je lâche l’accélérateur avant de franchir l’intersection.",
  ),
  single(
    "Ce panneau peut mettre fin :",
    [
      "à une limitation de vitesse",
      "à une interdiction de dépasser",
      "à une interdiction de klaxonner",
      "à une interdiction de stationner",
    ],
    [0, 1, 2],
    "L",
    "Ce panneau peut mettre fin aux trois premières interdictions.",
  ),
  single(
    "Cette signalisation concerne les véhicules affectés au transport de marchandises :",
    ["de plus de 3,5 tonnes seulement", "peu importe leur poids"],
    [1],
    "L",
    "Elle concerne ces véhicules peu importe leur poids.",
  ),
  single(
    "Je me suis correctement stationné :",
    ["Oui", "Non"],
    [0],
    "R",
    "Oui, le stationnement est correct.",
  ),
  single(
    "Je vais franchir un passage à niveau à environ :",
    ["50 m", "100 m", "150 m"],
    [1],
    "L",
    "Le passage à niveau se trouve à environ 100 mètres.",
  ),
];

const run = async () => {
  await mongoose.connect(mongoUri);
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { slug: "simple-series-french-road-code-20" },
      {
        $set: {
          title: "Simple Series 21 - French Road Code",
          slug: "simple-series-french-road-code-20",
          type: "simple_series",
          description:
            "French road-code practice series with 20 questions and verified answer keys.",
          totalQuestions: questions.length,
          durationMinutes: 30,
          passingScore: 60,
          isPaid: false,
          order: 21,
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

    await Question.deleteMany({ quiz: quiz._id });
    await Question.insertMany(
      questions.map((question, index) => ({
        ...question,
        quiz: quiz._id,
        questionImage: "",
        questionVideoUrl: "",
        voiceText: question.questionText,
        explanationImage: "",
        markedAnswerImage: "",
        difficulty: index < 7 ? "easy" : index < 14 ? "medium" : "hard",
        order: index + 1,
        status: "active",
      })),
    );

    console.log(
      JSON.stringify(
        {
          success: true,
          quizId: quiz._id,
          title: quiz.title,
          questions: questions.length,
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
