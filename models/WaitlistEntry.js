const mongoose = require('mongoose');

const waitlistEntrySchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

waitlistEntrySchema.index({ book: 1, createdAt: 1 });
waitlistEntrySchema.index({ book: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('WaitlistEntry', waitlistEntrySchema);
