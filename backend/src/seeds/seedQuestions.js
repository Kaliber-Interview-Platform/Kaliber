// it is a one time script
// Run manually from backend/ with: node src/seeds/seedQuestions.js
// This is NOT imported anywhere else in your app - server.js never touches it.

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Question from "../models/Question.js";

dotenv.config();

// that import syntax behaves differently across Node versions and can throw errors;
// fs.readFileSync works the same everywhere, which matters more here.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const questionsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "questionsData.json"), "utf-8")
);

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    await Question.deleteMany({}); // clears old data before reseeding - remove this line if you don't want that
    await Question.insertMany(questionsData);

    console.log(`Inserted ${questionsData.length} questions`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();