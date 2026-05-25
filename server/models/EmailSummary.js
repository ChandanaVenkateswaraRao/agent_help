const mongoose = require('mongoose');

const emailSummarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emailId: { type: String, required: true },
  subject: { type: String },
  sender: { type: String },
  summary: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  actionRequired: { type: Boolean, default: false },
  actionLabel: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EmailSummary', emailSummarySchema);
