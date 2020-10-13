const { App } = require('@slack/bolt');
const { connectToDb, Player } = require('./db.js');

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
				await Player.create({ name: words[2], wins: 0, losses: 0, elo: 1000 });
				await client.chat.postMessage({
					text: 'Unrecognized action. Try `register` or `match`.',
					channel: event.channel,
				});
				break;
			case 'match':
				console.log('match');
				const player1 = words[2];
				const player2 = words[3];
				client.chat.postMessage({
					text: words[2],
					channel: event.channel,
				});
				break;
		  default:
				await client.chat.postMessage({
					text: 'Unrecognized action. Try `register` or `match`.',
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
