import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import FAQ from "../models/FAQ.js";

const entries = [
  ["home", "Driving lessons", "How many driving lessons will I need?", "The number varies with experience and learning pace. After an assessment lesson, your instructor will recommend a plan and review your progress regularly."],
  ["home", "Bookings", "Can I choose a manual or automatic car?", "Yes. Select your preferred transmission while searching for an instructor or booking a lesson. Availability depends on vehicles offered in your area."],
  ["home", "Bookings", "Can I change the date of a booked lesson?", "You can request a reschedule from your lesson area. Submit it before the cancellation cutoff so the instructor or admin can review it."],
  ["home", "Documents", "Which documents do I need before driving?", "You normally need a valid provisional licence and any identity or eligibility documents requested in your account checklist."],
  ["home", "Safety", "Are PermisGo instructors verified?", "Instructor profiles and vehicle documents are reviewed by the admin team before approval. Verification status is shown through the platform."],

  ["general", "Getting started", "How do I create a learner account?", "Open the registration page, choose Student, enter your details and verify your account. You can then complete your profile and begin booking."],
  ["general", "Driving lessons", "What happens during the first driving lesson?", "Your instructor checks your experience, explains the car controls and begins in a suitable area. The lesson is adapted to your confidence and ability."],
  ["general", "Payments", "How do I pay for lessons?", "Choose an available offer or lesson package and follow the secure checkout process. Your payment and invoice history will appear in your account."],
  ["general", "Driving test", "When should I book my practical driving test?", "Book when you can drive safely without prompts and complete mock tests consistently. Ask your instructor for an honest readiness assessment."],
  ["general", "Cancellations", "What happens if I cancel a lesson?", "Cancellation terms depend on how early you submit the request. Review the policy in your booking details before confirming a cancellation."],

  ["instructors", "Getting started", "How do I become a PermisGo instructor?", "Complete the instructor registration with your professional details. The admin team will review your profile, credentials and vehicle information."],
  ["instructors", "Documents", "Which instructor documents are required?", "You will generally need proof of identity, valid instructor authorisation, insurance and current documents for every teaching vehicle."],
  ["instructors", "Lessons & planning", "How do I manage my availability?", "Use the availability area to enable teaching days and define bookable time slots. Keep it updated to prevent booking conflicts."],
  ["instructors", "Lessons & planning", "Can I reject or reschedule a lesson request?", "You can review pending bookings and use the relevant action. Give a clear reason and respond early so the learner can make another plan."],
  ["instructors", "Payments & support", "Where can I track lessons and earnings?", "Your teacher dashboard contains upcoming lessons, completed sessions and earnings information available for your account."],

  ["locations", "Coverage", "How do I find instructors near my location?", "Enter your address or postcode on the instructor search. PermisGo uses approved teaching locations to show nearby available instructors."],
  ["locations", "Meeting points", "Can the instructor collect me from home?", "Collection depends on the instructor's service radius and the selected meeting type. Confirm the exact address when creating the booking."],
  ["locations", "Coverage", "What if no instructor is available in my area?", "Try a nearby postcode or a different date. Availability changes as instructors add locations and update their calendars."],
  ["locations", "Vehicles", "Can I filter locations by automatic or manual cars?", "Yes. Use the vehicle or transmission filter when searching, then confirm the vehicle shown on the instructor profile."],

  ["driving-code", "Theory learning", "How should I prepare for the highway code test?", "Study each topic, review road signs and complete practice quizzes regularly. Revisit mistakes instead of only repeating questions you already know."],
  ["driving-code", "Quizzes", "Where can I review my incorrect quiz answers?", "Open My Mistakes or your attempt history in the student code area. Each review helps you identify topics that need more study."],
  ["driving-code", "Road signs", "What is the best way to remember road signs?", "Learn signs by shape and purpose, then connect each sign to the driving action it requires: warning, restriction, direction or information."],
  ["driving-code", "Mock tests", "How many mock tests should I complete?", "Continue until you pass consistently within the time limit and understand why each answer is correct. Quality of review matters more than the total number."],
  ["driving-code", "Learning progress", "Does the platform save my learning progress?", "Yes. Supported lessons, ebook content and quiz attempts record progress so you can continue and review your history later."],
].map(([section, category, question, answer], index) => ({ section, category, question, answer, order: (index % 5) + 1, status: "active" }));

const run = async () => { await connectDB(); for (const item of entries) await FAQ.findOneAndUpdate({ section: item.section, question: item.question }, item, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }); console.log(`FAQs inserted/updated: ${entries.length}`); await mongoose.connection.close(); };
run().catch(async (error) => { console.error(error); await mongoose.connection.close(); process.exit(1); });
