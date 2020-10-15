const { App } = require('@slack/bolt');
const { connectToDb, Player } = require('./db');
const { getNewRating } = require('./elo');
const { convertMentionToId, shuffle, getMatching } = require('./utils');

// Connect to slack with bolt
const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const db = connectToDb();

app.event('app_mention', async ({ event, client }) => {
	try {
		console.log(`Received a mention: user ${event.user} in channel ${event.channel} says ${event.text}`);
		const words = event.text.split(' ');
		if(words.length < 2) {
			throw new Error('Invalid format. Use `help` for a list of commands.');
		}
		const action = words[1];
		switch(action) {
			case 'register':
				console.log('register');
				// Check message format
				if (words.length !== 2) throw new Error('Invalid format. Use `help` for a list of commands.');
				// Get user object from slack
				const user = await client.users.info({user: event.user});
				await Player.create({ _id: event.user, name: user.user.profile.display_name || user.user.profile.real_name, wins: 0, losses: 0, elo: 1000 });
				await client.chat.postMessage({
					text: `Successfully registered <@${event.user}>`,
					channel: event.channel,
				});
				break;
			case 'match':
				console.log('match');
				// Check message format
				if (words.length !== 4) throw new Error('Invalid format. Use `help` for a list of commands.');
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
				player1.wins += 1;
				player2.elo = player2NewElo;
				player2.losses += 1;
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
				// Check message format
				if (words.length !== 2) throw new Error('Invalid format. Use `help` for a list of commands.');
				const players = await Player.find({});
				// Sort players array in descending order by ELO
				players.sort((a, b) => b.elo - a.elo);
				// For each player, append output string to text
				let text = '';
				players.forEach((player, index) => text += `${index + 1}. ${player.name} ${player.elo} record: ${player.wins}-${player.losses}\n` );
				await client.chat.postMessage({
					text,
					channel: event.channel,
				});
				break;
		  case 'matchmake':
				console.log('matchmake');
				// Check message format
				if (words.length !== 2) throw new Error('Invalid format. Use `help` for a list of commands.');
				// Get all players from db
				const players2 = await Player.find({});
				// Shuffle players then pairwise match them up
				const shuffledPlayers = shuffle(players2);
				const matchups = getMatching(shuffledPlayers);
				// Send slack message reporting the matchups
				let text2 = 'Here are the matchups for this week:\n';
				matchups.forEach(matchup => {
					if (matchup[1])
						text2 += `${matchup[0].name} vs. ${matchup[1].name}\n`;
					else
						text2 += `${matchup[0].name} has a bye week`;
				});
				await client.chat.postMessage({
					text: text2, 
					channel: event.channel,
				});
				break;
		  case 'help':
				console.log('help');
				await client.chat.postMessage({
					text: 'All commands are of the form @KingPong `<cmd>`\n\tregister\t\t\tRegisters a new player.\n\tleaderboard\tLists the current standings sorted by ELO rating.\n\tmatch\t\t\t  Reports a match played. The format is `@WinningPlayer @LosingPlayer`. Scores are not necessary.\n\tmatchmake\t Randomly matches all registered players. If an odd number of players, one will have a bye.',
					channel: event.channel,
				});
		  default:
				await client.chat.postMessage({
					text: 'Unrecognized command. Try `help` for a list of commands.',
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
			const text = e.message ? e.message : 'There was an error. Please try again.';
			await client.chat.postMessage({
				text,
				channel: event.channel,
			});
		}
	}
});

(async () => {
	await app.start(process.env.PORT || 3000);
	console.log('Bolt app running');
})();
