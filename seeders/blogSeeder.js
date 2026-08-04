import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import Blog from "../models/Blog.js";

const image = (name, fallback) => process.env[name] || fallback;

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
].map((blog) => ({ ...blog, status: "published", publishedAt: new Date() }));

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
