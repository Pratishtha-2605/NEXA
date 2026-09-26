require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // allow the frontend (any origin) to call the API
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/responses', require('./routes/response'));

// Health checks
app.get('/', (req, res) => res.send('NEXA Backend is running!'));
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
);

// MongoDB connection (accepts either name, the team used both)
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI in backend/.env (see .env.example)');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((err) => console.error('MongoDB connection failed:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
