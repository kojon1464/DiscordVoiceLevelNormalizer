const process = require('node:process');
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { getVoiceConnections } = require('@discordjs/voice');
const { token } = require('./config.json');


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandsFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandsFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventsFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventsFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);

	if ('name' in event && 'once' in event && 'execute' in event) {
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		} else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	} else {
		console.log(`[WARNING] The event at ${filePath} is missing a required "data" or "once" or "execute" property.`);
	}
}

// Closing application
if (process.platform === 'win32') {
	const rl = require('readline').createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.on('SIGINT', function() {
		process.emit('SIGINT');
	});
}

// Handling closing of the application
process.on('SIGINT', function() {
	const voiceConnections = getVoiceConnections();

	if (voiceConnections) {
		voiceConnections.forEach(connection => connection.destroy());
	}

	client.destroy();
	process.exit();
});

// Calculating decibe diffrenca based on loudness ratio
console.log(10 * Math.log2(0.5));
// calcualing ludness ratio based on decivel difference
console.log(Math.pow(2, 10 / 10));

// Login bot to discord after application after initialziation completed
client.login(token);