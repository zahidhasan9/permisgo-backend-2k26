import "dotenv/config";
import path from "path";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import { connectDB } from "../config/db.js";
import CmsPage from "../models/CmsPage.js";

await connectDB();
const logo = await cloudinary.uploader.upload(path.resolve("../permisgo-fontend/public/image/logo2.png"), { folder:"permisgo/cms/login-pages", public_id:"permisgo-logo", overwrite:true, invalidate:true });
const common = { logoImage:logo.secure_url, logoAlt:"PermisGo Auto École", forgotButtonUrl:"/forget-password", forgotButtonTextColor:"#173d73", loginButtonColor:"#df2738", loginButtonTextColor:"#ffffff", registerButtonTextColor:"#173d73", pageBackground:"#eef2fb", panelBackground:"#e7edf7" };
const localized = {
  en: { usernameLabel:"Username", usernamePlaceholder:"Write email here", passwordLabel:"Password", passwordPlaceholder:"Write password here", forgotButton:"Forget Password", loginButton:"Log in", loggingText:"Logging in...", accountPrompt:"Have no account?", registerButton:"Register now" },
  bn: { usernameLabel:"ইমেইল", usernamePlaceholder:"ইমেইল লিখুন", passwordLabel:"পাসওয়ার্ড", passwordPlaceholder:"পাসওয়ার্ড লিখুন", forgotButton:"পাসওয়ার্ড ভুলে গেছেন?", loginButton:"লগইন করুন", loggingText:"লগইন হচ্ছে...", accountPrompt:"অ্যাকাউন্ট নেই?", registerButton:"এখনই নিবন্ধন করুন" },
  fr: { usernameLabel:"Adresse e-mail", usernamePlaceholder:"Saisissez votre e-mail", passwordLabel:"Mot de passe", passwordPlaceholder:"Saisissez votre mot de passe", forgotButton:"Mot de passe oublié ?", loginButton:"Se connecter", loggingText:"Connexion...", accountPrompt:"Vous n’avez pas de compte ?", registerButton:"Inscrivez-vous" },
};
const pages = [
  { slug:"student-login", registerUrl:"/register/student", titles:{ en:"Student Login", bn:"শিক্ষার্থী লগইন", fr:"Connexion élève" } },
  { slug:"teacher-login", registerUrl:"/register/teacher", titles:{ en:"Teacher Login", bn:"প্রশিক্ষক লগইন", fr:"Connexion moniteur" } },
];
for (const page of pages) {
  const translations = Object.fromEntries(Object.entries(localized).map(([lang, values]) => {
    const title = page.titles[lang];
    return [lang, { title, excerpt:title, seoTitle:title, seoDescription:title, imageAlt:common.logoAlt, settings:{ ...common, ...values, loginTitle:title, registerButtonUrl:page.registerUrl } }];
  }));
  await CmsPage.findOneAndUpdate({ slug:page.slug }, { $set:{ translations, status:"published", ogImage:logo.secure_url, noIndex:true } }, { upsert:true, runValidators:true, setDefaultsOnInsert:true });
}
console.log("Student and teacher login CMS pages saved with Cloudinary logo for EN, BN and FR.");
await mongoose.disconnect();
