import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import dns from "node:dns";

dns.setServers(["1.1.1.1","8.8.8.8"]);

connectDB();
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Always import and use your routes after initializing express

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// This is your first API route!
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Kaliber's Backend!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoint available at http://localhost:${PORT}/`);
});
