import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import Blog from "../models/Blog.js";

const image = (name, fallback) => process.env[name] || fallback;

const translationsBySlug = {
  "10-tips-to-pass-your-driving-test-on-the-first-try": {
    bn: {
      title: "প্রথমবারেই ড্রাইভিং টেস্ট পাস করার ১০টি পরামর্শ",
      excerpt:
        "শান্ত থেকে নিরাপদে গাড়ি চালানো এবং আত্মবিশ্বাসের সঙ্গে পরীক্ষার প্রস্তুতি নেওয়ার কার্যকর পরামর্শ।",
      content:
        "<p>প্রথমবারেই ড্রাইভিং টেস্ট পাস করতে নিয়মিত ও মনোযোগী অনুশীলন জরুরি।</p><h2>পরীক্ষার আগে</h2><ul><li>বিভিন্ন ধরনের রাস্তায় অনুশীলন করুন।</li><li>প্রশিক্ষকের সঙ্গে অন্তত একটি পূর্ণ মক টেস্ট দিন।</li><li>গাড়ির নিরাপত্তা পরীক্ষা ও প্রয়োজনীয় প্রশ্নগুলো ঝালিয়ে নিন।</li></ul><h2>পরীক্ষার দিনে</h2><p>বিশ্রাম নিয়ে সময়মতো পৌঁছান, প্রয়োজনীয় নথি সঙ্গে রাখুন এবং প্রতিটি নির্দেশ মনোযোগ দিয়ে শুনুন। ছোট ভুল হলে শান্ত থেকে পরবর্তী নিরাপদ সিদ্ধান্তে মনোযোগ দিন।</p>",
    },
    fr: {
      title: "10 conseils pour réussir votre permis du premier coup",
      excerpt:
        "Des conseils pratiques pour rester calme, conduire en sécurité et aborder l’examen avec confiance.",
      content:
        "<p>Réussir l’examen du premier coup demande une pratique régulière et ciblée.</p><h2>Avant l’examen</h2><ul><li>Entraînez-vous sur différents types de routes.</li><li>Réalisez au moins un examen blanc complet avec votre moniteur.</li><li>Révisez les contrôles de sécurité du véhicule.</li></ul><h2>Le jour de l’examen</h2><p>Arrivez reposé avec les documents nécessaires et écoutez chaque consigne. Une petite erreur ne signifie pas forcément un échec : restez calme et concentrez-vous sur la prochaine décision sûre.</p>",
    },
  },
  "step-by-step-guide-to-passing-your-driving-test": {
    bn: {
      title: "ড্রাইভিং টেস্ট পাস করার ধাপে ধাপে নির্দেশিকা",
      excerpt:
        "প্রথম পাঠ থেকে পরীক্ষার দিন পর্যন্ত নিরাপদ ও আত্মবিশ্বাসী চালক হওয়ার সুস্পষ্ট পরিকল্পনা।",
      content:
        "<p>একটি পরিষ্কার শেখার পরিকল্পনা আপনাকে ধাপে ধাপে পরীক্ষার জন্য প্রস্তুত করে।</p><h2>ধাপ ১: গাড়ি নিয়ন্ত্রণ</h2><p>গাড়ি চালু করা, থামানো, স্টিয়ারিং, ব্রেক ও গিয়ার নিয়ন্ত্রণ শিখুন।</p><h2>ধাপ ২: রাস্তার দক্ষতা</h2><p>জংশন, রাউন্ডঅ্যাবাউট, লেন পরিবর্তন, পার্কিং ও দ্রুতগতির রাস্তায় অনুশীলন করুন।</p><h2>ধাপ ৩: স্বাধীনভাবে চালানো</h2><p>আগে থেকে পরিকল্পনা করুন, সাইন পড়ুন এবং পরিবর্তিত পরিস্থিতিতে নিরাপদে প্রতিক্রিয়া দিন।</p>",
    },
    fr: {
      title: "Guide étape par étape pour réussir votre permis",
      excerpt:
        "Suivez un plan clair, de votre première leçon au jour de l’examen, pour conduire avec sécurité et confiance.",
      content:
        "<p>Un plan d’apprentissage clair vous prépare progressivement à l’examen.</p><h2>Étape 1 : maîtrise du véhicule</h2><p>Apprenez à démarrer, vous arrêter, diriger, freiner et changer de vitesse en douceur.</p><h2>Étape 2 : compétences routières</h2><p>Travaillez les intersections, ronds-points, changements de voie, stationnements et routes rapides.</p><h2>Étape 3 : conduite autonome</h2><p>Anticipez, lisez les panneaux et réagissez en sécurité aux changements de situation.</p>",
    },
  },
  "common-traffic-mistakes-and-how-to-avoid-them": {
    bn: {
      title: "সাধারণ ট্রাফিক ভুল এবং সেগুলো এড়ানোর উপায়",
      excerpt:
        "প্রশিক্ষকেরা যে ভুলগুলো বেশি দেখেন সেগুলো বুঝুন এবং সহজ নিরাপদ অভ্যাস গড়ে তুলুন।",
      content:
        "<p>অনেক ড্রাইভিং ভুল দেরিতে পর্যবেক্ষণ ও পরিকল্পনার কারণে হয়।</p><h2>দেরিতে আয়না দেখা</h2><p>গতি বা দিক পরিবর্তনের আগে যথাসময়ে আয়না দেখুন।</p><h2>জংশনে তাড়াহুড়া</h2><p>গতি কমান, অগ্রাধিকার বুঝুন এবং নিরাপদ ফাঁকের জন্য অপেক্ষা করুন।</p><h2>ভুল লেন অবস্থান</h2><p>আগে থেকেই রাস্তার চিহ্ন পড়ে সঠিক লেন বেছে নিন।</p>",
    },
    fr: {
      title: "Les erreurs de circulation courantes et comment les éviter",
      excerpt:
        "Comprenez les erreurs les plus fréquentes et adoptez des habitudes simples pour conduire en sécurité.",
      content:
        "<p>De nombreuses fautes viennent d’une observation ou d’une anticipation trop tardive.</p><h2>Contrôles tardifs des rétroviseurs</h2><p>Contrôlez-les suffisamment tôt avant de changer de vitesse ou de direction.</p><h2>Précipitation aux intersections</h2><p>Ralentissez, identifiez la priorité et attendez un créneau réellement sûr.</p><h2>Mauvais positionnement</h2><p>Lisez les marquages tôt et choisissez la bonne voie avant l’intersection.</p>",
    },
  },
  "complete-guide-to-becoming-a-confident-driver": {
    bn: {
      title: "আত্মবিশ্বাসী চালক হওয়ার সম্পূর্ণ নির্দেশিকা",
      excerpt:
        "আত্মবিশ্বাস আসে প্রস্তুতি, সচেতনতা ও নিয়ন্ত্রিত অনুশীলন থেকে—তাড়াহুড়া থেকে নয়।",
      content:
        "<p>প্রকৃত আত্মবিশ্বাস আসে নির্ভরযোগ্য দক্ষতা থেকে, অপ্রয়োজনীয় ঝুঁকি থেকে নয়।</p><h2>ধীরে ধীরে কঠিন পরিস্থিতি অনুশীলন করুন</h2><p>পরিচিত রাস্তা দিয়ে শুরু করে ব্যস্ত জংশন, রাত ও খারাপ আবহাওয়ায় প্রশিক্ষকের সঙ্গে অনুশীলন করুন।</p><h2>সচেতনতা বাড়ান</h2><p>ঝুঁকি, সাইন, পথচারী ও ট্রাফিক পরিবর্তন আগে থেকে শনাক্ত করুন।</p><h2>উদ্বেগ নিয়ন্ত্রণ করুন</h2><p>ধীরে শ্বাস নিন এবং আগের ভুল নয়, বর্তমান রাস্তার পরিস্থিতিতে মনোযোগ দিন।</p>",
    },
    fr: {
      title: "Guide complet pour devenir un conducteur confiant",
      excerpt:
        "La confiance vient de la préparation, de l’observation et d’une pratique maîtrisée, jamais de la précipitation.",
      content:
        "<p>La vraie confiance repose sur des compétences fiables, pas sur des risques inutiles.</p><h2>Augmentez progressivement la difficulté</h2><p>Commencez sur des routes familières puis travaillez les intersections chargées, la nuit et la météo difficile avec un moniteur.</p><h2>Améliorez votre observation</h2><p>Identifiez tôt les dangers, panneaux, piétons et changements de circulation.</p><h2>Gérez le stress</h2><p>Respirez lentement et concentrez-vous sur la situation actuelle plutôt que sur une erreur passée.</p>",
    },
  },
  "essential-road-signs-every-learner-should-know": {
    bn: {
      title: "প্রত্যেক শিক্ষানবিশ চালকের জানা জরুরি সড়ক চিহ্ন",
      excerpt:
        "বিস্তারিত পড়ার আগেই সাইনের আকার ও রং কীভাবে সতর্কতা, নিষেধাজ্ঞা ও দিক নির্দেশ করে তা শিখুন।",
      content:
        "<p>আলাদা ছবি মুখস্থ না করে সড়ক চিহ্নের আকার, রং ও উদ্দেশ্য বুঝে শেখা সহজ।</p><h2>চিহ্নের ধরন</h2><ul><li><strong>ত্রিভুজ:</strong> সামনে বিপদের সতর্কতা।</li><li><strong>বৃত্ত:</strong> নির্দেশ, নিষেধাজ্ঞা বা বাধ্যতামূলক কাজ।</li><li><strong>আয়তক্ষেত্র:</strong> তথ্য, দিক ও পথ নির্দেশনা।</li></ul><h2>জ্ঞানকে কাজে লাগান</h2><p>প্রতিটি সাইন আপনার গতি, লেন, পর্যবেক্ষণ বা অগ্রাধিকারে কী পরিবর্তন আনে তা বোঝার চেষ্টা করুন।</p>",
    },
    fr: {
      title: "Les panneaux essentiels que tout élève conducteur doit connaître",
      excerpt:
        "Découvrez comment les formes et les couleurs signalent les dangers, restrictions et directions avant même de lire les détails.",
      content:
        "<p>Les panneaux sont plus faciles à comprendre lorsque vous apprenez leur forme, leur couleur et leur fonction.</p><h2>Les familles de panneaux</h2><ul><li><strong>Triangles :</strong> avertissement d’un danger.</li><li><strong>Cercles :</strong> ordre, restriction ou obligation.</li><li><strong>Rectangles :</strong> information, direction et itinéraire.</li></ul><h2>Transformer la connaissance en action</h2><p>Demandez-vous comment chaque panneau modifie votre vitesse, votre position, votre observation ou la priorité.</p>",
    },
  },
};

const blogs = [
  {
    title: "10 Tips to Pass Your Driving Test on the First Try",
    slug: "10-tips-to-pass-your-driving-test-on-the-first-try",
    excerpt:
      "Practical preparation tips that help learner drivers stay calm, drive safely and approach test day with confidence.",
    content: `<p>Passing your driving test on the first attempt starts with <strong>consistent, focused practice</strong>. Use this checklist to prepare safely and confidently.</p><h2>Before the test</h2><ol><li>Practise in town, residential and dual-carriageway conditions.</li><li>Complete at least one realistic mock test with your instructor.</li><li>Review show-me, tell-me questions and vehicle safety checks.</li><li>Practise independent driving with signs and navigation.</li></ol><h2>While driving</h2><ul><li>Check mirrors before changing speed or direction.</li><li>Keep a safe following distance and obey speed limits.</li><li>Approach junctions slowly enough to observe and decide.</li><li>Signal only when it helps another road user.</li></ul><blockquote>A small mistake does not automatically mean failure. Stay calm and focus on the next safe decision.</blockquote><h2>Test-day advice</h2><p>Arrive rested, bring the required documents and listen carefully to every instruction. If an instruction is unclear, politely ask the examiner to repeat it.</p>`,
    coverImage: image(
      "BLOG_SEED_IMAGE_1",
      "https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_470,q_auto,f_auto/sample.jpg",
    ),
  },
  {
    title: "Step-by-Step Guide to Passing Your Driving Test",
    slug: "step-by-step-guide-to-passing-your-driving-test",
    excerpt:
      "Follow the journey from your first lesson to test day with a clear plan for building safe and confident driving skills.",
    content: `<p>A clear learning plan helps you progress from your first lesson to independent, test-ready driving.</p><h2>Stage 1: Vehicle control</h2><p>Learn cockpit checks, moving off, stopping, smooth steering, braking and gear control. Repeat each routine until it feels natural.</p><h2>Stage 2: Road skills</h2><ul><li>Junctions and roundabouts</li><li>Meeting and passing traffic</li><li>Safe lane changes</li><li>Parking and reversing manoeuvres</li><li>Country roads and higher-speed roads</li></ul><h2>Stage 3: Independent driving</h2><p>Drive longer routes with minimal prompts. Plan early, read signs and respond safely when the route changes unexpectedly.</p><h2>Stage 4: Mock tests</h2><p>Book the real test only when you can complete realistic mock tests safely and consistently. Use your final lessons for targeted correction, not last-minute new skills.</p>`,
    coverImage: image(
      "BLOG_SEED_IMAGE_2",
      "https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_470,q_auto,f_auto/cld-sample.jpg",
    ),
  },
  {
    title: "Common Traffic Mistakes and How to Avoid Them",
    slug: "common-traffic-mistakes-and-how-to-avoid-them",
    excerpt:
      "Understand the mistakes instructors see most often and learn simple habits that prevent them from becoming safety risks.",
    content: `<p>Many driving faults come from observation and planning that happen too late. These common mistakes can be corrected with a repeatable routine.</p><h2>Late mirror checks</h2><p>Check mirrors before signalling, changing speed or changing direction. The check must happen early enough to influence your decision.</p><h2>Rushing at junctions</h2><p>Reduce speed on approach, identify the priority and wait for a genuinely safe gap. Never let pressure from a vehicle behind make the decision for you.</p><h2>Poor lane position</h2><p>Read road markings early and choose the correct lane before the junction. Avoid sudden lane changes and maintain safe clearance from parked vehicles.</p><h2>A routine that helps</h2><ol><li>Mirrors</li><li>Signal</li><li>Position</li><li>Speed</li><li>Look</li></ol><p>Use this routine consistently while adapting it to the road and traffic around you.</p>`,
    coverImage: image(
      "BLOG_SEED_IMAGE_3",
      "https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_470,q_auto,f_auto/cld-sample-2.jpg",
    ),
  },
  {
    title: "Your Complete Guide to Becoming a Confident Driver",
    slug: "complete-guide-to-becoming-a-confident-driver",
    excerpt:
      "Confidence grows from preparation, awareness and controlled practice—not from rushing into situations before you are ready.",
    content: `<p>Real driving confidence comes from reliable skills—not from taking unnecessary risks.</p><h2>Build difficulty gradually</h2><p>Start on familiar roads, then add busier junctions, higher speeds, night driving and difficult weather with a qualified instructor.</p><h2>Improve awareness</h2><p>Try commentary driving: calmly identify hazards, signs, pedestrians, changing traffic lights and safe escape space. This develops earlier observation and planning.</p><h2>Manage nerves</h2><ul><li>Prepare the route and vehicle before moving.</li><li>Breathe slowly when stopped safely.</li><li>Focus on the current road situation, not a previous mistake.</li><li>Ask for targeted practice when a situation feels difficult.</li></ul><blockquote>Confidence means trusting a safe process and knowing when to wait.</blockquote><p>Progress is not perfectly linear. Review each mistake, practise the underlying skill and recognise the improvement you make over time.</p>`,
    coverImage: image(
      "BLOG_SEED_IMAGE_4",
      "https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_470,q_auto,f_auto/cld-sample-3.jpg",
    ),
  },
  {
    title: "Essential Road Signs Every Learner Should Know",
    slug: "essential-road-signs-every-learner-should-know",
    excerpt:
      "Learn how sign shapes and colours communicate warnings, restrictions and directions before you even read the details.",
    content: `<p>Road signs are easier to understand when you learn their shapes, colours and purpose instead of memorising isolated pictures.</p><h2>Sign families</h2><ul><li><strong>Triangular signs:</strong> warnings about hazards ahead.</li><li><strong>Circular signs:</strong> orders, restrictions or mandatory actions.</li><li><strong>Rectangular signs:</strong> information, directions and route guidance.</li></ul><h2>Turn knowledge into action</h2><p>When you see a sign, explain what it changes: your speed, lane position, observation or priority. Connecting the sign to a driving decision makes it easier to remember.</p><h2>Do not forget road markings</h2><p>Study lane arrows, stop and give-way lines, yellow restrictions, bus lanes and pedestrian crossings alongside traffic signals.</p><blockquote>Safe drivers combine signs, markings, signals and the developing road situation, then act early.</blockquote>`,
    coverImage: image(
      "BLOG_SEED_IMAGE_5",
      "https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_470,q_auto,f_auto/cld-sample-4.jpg",
    ),
  },
].map((blog) => ({
  ...blog,
  translations: translationsBySlug[blog.slug] || {},
  status: "published",
  publishedAt: new Date(),
}));

const seed = async () => {
  await connectDB();
  for (const blog of blogs) {
    await Blog.findOneAndUpdate({ slug: blog.slug }, blog, {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    });
  }
  console.log(`Blogs inserted/updated: ${blogs.length}`);
  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
