const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  exercises: [{
    description: String,
    duration: Number,
    date: Date
  }]
});
const User = mongoose.model('User', userSchema);

// Helper
function parseDate(dateString) {
  if (!dateString) return new Date();
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return new Date(parts[0], parts[1]-1, parts[2]);
  }
  return new Date(dateString);
}

// Koneksi DB (dengan cache untuk serverless)
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  cachedDb = mongoose.connection;
  return cachedDb;
}

// Routes
app.post('/api/users', async (req, res) => {
  await connectToDatabase();
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username exists' });
    const user = new User({ username, exercises: [] });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  await connectToDatabase();
  const users = await User.find({}, 'username _id');
  res.json(users);
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  await connectToDatabase();
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  if (!description || !duration) return res.status(400).json({ error: 'Missing fields' });
  const durationNum = parseInt(duration);
  const exerciseDate = parseDate(date);
  try {
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.exercises.push({ description, duration: durationNum, date: exerciseDate });
    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      description,
      duration: durationNum,
      date: exerciseDate.toDateString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  await connectToDatabase();
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  try {
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    let log = user.exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));
    if (from) {
      const fromDate = new Date(from);
      log = log.filter(e => new Date(e.date) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      log = log.filter(e => new Date(e.date) <= toDate);
    }
    if (limit) log = log.slice(0, parseInt(limit));
    res.json({
      _id: user._id,
      username: user.username,
      count: user.exercises.length,
      log
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sajikan file statis dari folder public
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

// Untuk Vercel, kita export app (tanpa app.listen)
module.exports = app;