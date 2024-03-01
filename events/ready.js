const { Events } = require('discord.js');
const { LoudnessData } = require('../models/guild-data');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		client.loudnessData = new LoudnessData();

		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};