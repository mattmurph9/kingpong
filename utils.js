module.exports = {
  convertMentionToId: mentionString => {
    // Remove first two characters '<' and '@'
    return mentionString.substring(2, mentionString.length - 1);
  },
  shuffle: arr => {
    const copy = [...arr];
    let currentIndex = copy.length;
    let temporaryValue;
    let randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = copy[currentIndex];
      copy[currentIndex] = copy[randomIndex];
      copy[randomIndex] = temporaryValue;
    }

    return copy;
  },
  getMatching: arr => {
    const matching = [];
    if (arr.length <= 1) return [...arr];
    arr.forEach((element, index) => {
      if (index % 2 === 1) matching.push([arr[index - 1], element]);
      if (index % 2 === 0 && index === arr.length - 1) matching.push([element]);
    });
    return matching;
  },
};
