# Exercise Tracker

A full-stack JavaScript application for tracking user exercises. Built for freeCodeCamp certification.

## Features

- Create new users
- Add exercises with description, duration, and optional date
- Retrieve exercise logs with date filtering and limit

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- HTML/CSS/JavaScript frontend

## Installation

1. Clone the repository
2. Run `npm install`
3. Create a `.env` file with your MongoDB URI
4. Run `npm start`
5. Visit `http://localhost:3000`

## API Endpoints

- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `POST /api/users/:_id/exercises` - Add exercise to user
- `GET /api/users/:_id/logs` - Get user exercise log with optional `from`, `to`, `limit` query parameters