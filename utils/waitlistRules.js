function getWaitlistPosition(entries, userId) {
  const targetId = userId.toString();
  const index = entries.findIndex((entry) => entry.user.toString() === targetId);
  return index < 0 ? null : index + 1;
}

function canBorrowFromWaitlist(entries, userId) {
  return entries.length === 0 || entries[0].user.toString() === userId.toString();
}

module.exports = { canBorrowFromWaitlist, getWaitlistPosition };
