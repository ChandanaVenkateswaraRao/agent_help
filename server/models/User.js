const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, unique: true, sparse: true },
  picture: { type: String },
  accessToken: { type: String },  // Gmail OAuth token
  refreshToken: { type: String },
  githubUsername: { type: String, default: '' },
  city: { type: String, default: 'Hyderabad' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
