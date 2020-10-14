module.exports = {
  convertMentionToId: (mentionString) => {
    // Remove first two characters '<' and '@'
    return mentionString.substring(2, mentionString.length - 1);
  } 
};