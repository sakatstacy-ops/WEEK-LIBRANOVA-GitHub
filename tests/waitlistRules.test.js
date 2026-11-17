const test = require('node:test');
const assert = require('node:assert/strict');
const {
  canBorrowFromWaitlist,
  getWaitlistPosition,
} = require('../utils/waitlistRules');

const firstUser = 'learner-1';
const secondUser = 'learner-2';
const queue = [{ user: firstUser }, { user: secondUser }];

test('waitlist positions follow the stored FIFO order', () => {
  assert.equal(getWaitlistPosition(queue, firstUser), 1);
  assert.equal(getWaitlistPosition(queue, secondUser), 2);
  assert.equal(getWaitlistPosition(queue, 'learner-3'), null);
});

test('only the first learner may borrow while a waitlist exists', () => {
  assert.equal(canBorrowFromWaitlist(queue, firstUser), true);
  assert.equal(canBorrowFromWaitlist(queue, secondUser), false);
  assert.equal(canBorrowFromWaitlist([], secondUser), true);
});
