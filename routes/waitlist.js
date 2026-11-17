const express = require('express');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const WaitlistEntry = require('../models/WaitlistEntry');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, HttpError } = require('../utils/http');
const { getWaitlistPosition } = require('../utils/waitlistRules');

const router = express.Router();
router.use(authenticate);

function requireValidId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'The supplied book id is not valid.');
  }
}

router.get('/', asyncHandler(async (req, res) => {
  const entries = await WaitlistEntry.find({ user: req.user._id })
    .populate({
      path: 'book',
      select: 'title author coverImage availableCopies genre',
      populate: { path: 'genre', select: 'name slug' },
    })
    .sort({ createdAt: 1, _id: 1 });

  const bookIds = [...new Set(entries.map((entry) => entry.book?._id?.toString()).filter(Boolean))];
  const queueEntries = bookIds.length
    ? await WaitlistEntry.find({ book: { $in: bookIds } })
      .select('book user createdAt')
      .sort({ createdAt: 1, _id: 1 })
    : [];
  const queuesByBook = new Map();
  for (const queueEntry of queueEntries) {
    const bookId = queueEntry.book.toString();
    const queue = queuesByBook.get(bookId) || [];
    queue.push(queueEntry);
    queuesByBook.set(bookId, queue);
  }

  res.json({
    waitlist: entries
      .filter((entry) => entry.book)
      .map((entry) => {
        const bookId = entry.book._id.toString();
        const queue = queuesByBook.get(bookId) || [];
        return {
          ...entry.toObject(),
          position: getWaitlistPosition(queue, req.user._id),
          isNext: getWaitlistPosition(queue, req.user._id) === 1,
          isSaved: req.user.readingList.some((id) => id.toString() === bookId),
        };
      }),
  });
}));

router.post('/:bookId', asyncHandler(async (req, res) => {
  requireValidId(req.params.bookId);
  const book = await Book.findById(req.params.bookId).select('availableCopies');
  if (!book) {
    throw new HttpError(404, 'Book not found.');
  }

  const existingEntry = await WaitlistEntry.findOne({ book: book._id, user: req.user._id });
  if (existingEntry) {
    throw new HttpError(409, 'You are already on this book’s waitlist.');
  }

  const queueExists = await WaitlistEntry.exists({ book: book._id });
  if (book.availableCopies > 0 && !queueExists) {
    throw new HttpError(409, 'Copies are available now; request a copy from the catalog instead.');
  }

  await WaitlistEntry.create({ book: book._id, user: req.user._id });
  res.status(201).json({ message: 'You joined the waitlist.' });
}));

router.delete('/:bookId', asyncHandler(async (req, res) => {
  requireValidId(req.params.bookId);
  const result = await WaitlistEntry.deleteOne({ book: req.params.bookId, user: req.user._id });
  if (result.deletedCount !== 1) {
    throw new HttpError(404, 'You are not on this book’s waitlist.');
  }
  res.status(204).end();
}));

module.exports = router;
