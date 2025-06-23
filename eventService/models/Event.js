const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  location: String,
  capacity: Number,
  status: {
    type: String,
    enum: ['planning', 'active', 'finished'],
    default: 'planning'
  }
});

module.exports = mongoose.model('Event', eventSchema);
