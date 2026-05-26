require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  exercises: [{
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, required: true }
  }]
});

const User = mongoose.model('User', userSchema);

// Helper: Parse date from YYYY-MM-DD to local Date object (midnight)
function parseDate(dateString) {
  if (!dateString) return new Date();
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  return new Date(dateString);
}

// Helper: Format date to toDateString()
function formatDate(date) {
  return date.toDateString();
}

// API Routes

// POST /api/users - Create new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const newUser = new User({ username, exercises: [] });
    await newUser.save();
    res.json({ username: newUser.username, _id: newUser._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users - Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:_id/exercises - Add exercise to user
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  const durationNum = parseInt(duration);
  if (isNaN(durationNum)) {
    return res.status(400).json({ error: 'Duration must be a number' });
  }

  const exerciseDate = parseDate(date);
  const formattedDate = formatDate(exerciseDate);

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newExercise = {
      description,
      duration: durationNum,
      date: exerciseDate
    };
    user.exercises.push(newExercise);
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      description,
      duration: durationNum,
      date: formattedDate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:_id/logs - Get exercise log with filtering
app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let log = user.exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: formatDate(ex.date)
    }));

    // Filter by 'from' date
    if (from) {
      const fromDate = parseDate(from);
      log = log.filter(ex => new Date(ex.date) >= fromDate);
    }

    // Filter by 'to' date
    if (to) {
      const toDate = parseDate(to);
      log = log.filter(ex => new Date(ex.date) <= toDate);
    }

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum)) {
        log = log.slice(0, limitNum);
      }
    }

    res.json({
      _id: user._id,
      username: user.username,
      count: user.exercises.length,  // total exercises (unfiltered)
      log
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});