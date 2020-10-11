const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');

const token = process.env.OAUTH_TOKEN;
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;

const slackEvents = createEventAdapter(slackSigningSecret);
const web = new WebClient(token);
const port = process.env.PORT || 3000;

/**
 * @type <Record<string, number>> A record of the word and score. Should start at 0.
 * This should be replaced by a database for persistence. This is just a demo and as
 * such simply mutates this object to be stateful.
 */
const state = {};

/**
 * A function that accepts a string, then returns the action and the word to score.
 */
const getIsPlusOrMinus = str => {
	console.log('in getPlusOrMinus');
	// Accept em-dash for cases like MacOS turning -- into an emdash
	const plusOrMinusRegex = /\@(\w+?)(\-{2}|\+{2}|\—{1})/;
  // The first item in the array is the full string, then the word to score, then the operator
	const [_, itemToScore, scoreStr] = plusOrMinusRegex.exec(str) || [];
	switch (scoreStr) {
		case '--':
		case '—':
			return { action: 'minus', word: itemToScore };
		case '++':
			return { action: 'add', word: itemToScore };
		default:
			return { action: '', word: undefined };
	}
};

slackEvents.on('message', async event => {
  console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
  
	const { action, word } = getIsPlusOrMinus(event.text);
	console.log('action: ', action, 'word: ', word);
  // If the `event.text` did not include a score (of plus or minus), it will return `{}`
  // And therefore `action` will be `undefined`
	if (action) {
		const currentState = state[word] || 0;
    // Mutate the state to update the score of the word.
		state[word] = action == 'add' ? currentState + 1 : currentState - 1;
		const actionString = action == 'add' ? 'had a point added' : 'had a point removed';
		const result = await web.chat.postMessage({
			text: `${word} ${actionString}. Score is now at: ${state[word]}`,
			channel: event.channel,
		});

		console.log(`Successfully send message ${result.ts} in conversation ${event.channel}`);
	}

  // Check if the text includes the text we'd want to use to check the leaderboard
	if (/@kingpongs leaderboard/i.exec(event.text)) {
		const result = await web.chat.postMessage({
      // We'll add more functionality in the future. We just want to test it works, first
			text: 'This should output a leaderboard',
			channel: event.channel,
		});

		console.log(`Successfully send message ${result.ts} in conversation ${event.channel}`);
	}
});

slackEvents.on('error', console.error);

slackEvents.start(port).then(() => {
	console.log(`server listening on port ${port}`);
});