const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// This is your first API route!
app.get('/api', (req, res) => {
  res.json({ message: "Welcome to Kalliber's Backend!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
