const mongoose = require('mongoose');

const playerSchema = mongoose.Schema({
  _id: String,
  name: { type: String, unique: true },
  wins: Number,
  losses: Number,
  elo: Number,
});

// Connect to mongodb
module.exports = {
  connectToDb: () => {
    const mongoPass = process.env.MONGOPASS;
    const mongoUser = process.env.MONGOUSER;
    const uri = `mongodb+srv://${mongoUser}:${mongoPass}@cluster0.a73d5.mongodb.net/kingpong?retryWrites=true&w=majority`;
    mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
      useCreateIndex: true,
    });
  },
  Player: mongoose.model('Player', playerSchema),
};
