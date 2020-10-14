const { App } = require('@slack/bolt');
const { connectToDb, Player } = require('./db');
const { getNewRating } = require('./elo');
const { convertMentionToId } = require('./utils');

// Connect to slack with bolt
const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const db = connectToDb();

app.event('app_mention', async ({ event, client }) => {
	try {
		const invalidMessage = async () => await client.chat.postMessage({
			text: 'Invalid format',
			channel: event.channel,
		});

		console.log(`Received a mention: user ${event.user} in channel ${event.channel} says ${event.text}`);
		const words = event.text.split(' ');
		console.log(words);
		if(words.length < 2) {
			invalidMessage();
		}
		const action = words[1];
		switch(action) {
			case 'register':
				console.log('register');
				// Get user object from slack
				const user = await client.users.info({user: event.user});
				await Player.create({ _id: event.user, name: user.user.profile.display_name, wins: 0, losses: 0, elo: 1000 });
				await client.chat.postMessage({
					text: `Successfully registered <@${event.user}>`,
					channel: event.channel,
				});
				break;
			case 'match':
				console.log('match');
				// Convert string of form <@userId> to just userId
				const player1Id = convertMentionToId(words[2]);
				const player2Id = convertMentionToId(words[3]);
				// Get players from db
				const player1 = await Player.findById(player1Id).exec();
				const player2 = await Player.findById(player2Id).exec();
				// Compute new ELO for each player
				const player1NewElo = getNewRating(player1.elo, player2.elo, 1);
				const player2NewElo = getNewRating(player2.elo, player1.elo, 0);
				// Update each player and save to db
				player1.elo = player1NewElo;
				player2.elo = player2NewElo;
				player1.save();
				player2.save();
				// Post message reporting new rankings
				client.chat.postMessage({
					text: `Updated rankings are:\n${player1.name}: ${ player1NewElo}\n${player2.name}: ${ player2NewElo}`,
					channel: event.channel,
				});
				break;
		  case 'leaderboard':
				console.log('leaderboard');
				let text = '';
				const players = await Player.find({});
				players.forEach((player, index) => text += `${index + 1}. ${player.name} ${player.elo} record: ${player.wins}-${player.losses}\n` );
				await client.chat.postMessage({
					text,
					channel: event.channel,
				});
				break;
		  default:
				await client.chat.postMessage({
					text: 'Unrecognized action. Try `register`, `match` or `leaderboard`.',
					channel: event.channel,
				});
		}
	} catch (e) {
		if ( e.code && e.code === 11000) {
			await client.chat.postMessage({
				text: 'User already exists!',
				channel: event.channel,
			});
		} else {
			console.log(e);
			await client.chat.postMessage({
				text: 'There was an error. Please try again.',
				channel: event.channel,
			});
		}
	}
});

(async () => {
	await app.start(process.env.PORT || 3000);
	console.log('Bolt app running');
})();
