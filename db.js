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
    mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
    const db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));

    db.once('open', function() {
      console.log("Successfully connected to MongoDB!");
    });

    return db;
  },
  Player: mongoose.model('Player', playerSchema)
}


