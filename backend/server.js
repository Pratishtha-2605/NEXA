const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const responseRoutes = require('./routes/response');
app.use('/api/responses', responseRoutes);

// If experiments.js doesn't have real content yet, comment this line out for now
// const experimentRoutes = require('./routes/experiments');
// app.use('/api/experiments', experimentRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));