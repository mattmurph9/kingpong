// https://github.com/moroshko/elo.js
const getRatingDelta = (myRating, opponentRating, myGameResult) => {
  if ([0, 0.5, 1].indexOf(myGameResult) === -1) {
    return null;
  }

  const myChanceToWin = 1 / (1 + 10 ** ((opponentRating - myRating) / 400));

  return Math.round(32 * (myGameResult - myChanceToWin));
};

module.exports = {
  getNewRating: (myRating, opponentRating, myGameResult) =>
    myRating + getRatingDelta(myRating, opponentRating, myGameResult),
};
