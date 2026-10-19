import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import dns from "node:dns";

dotenv.config();
dns.setServers(["1.1.1.1","8.8.8.8"]);
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import errorHandler from "./middlewares/ErrorHandle.js";

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: "Welcome to Kaliber's Backend!" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: http://localhost:5173`);
});
