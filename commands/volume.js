const { SlashCommandBuilder } = require('discord.js');
const { defaultDesiredLoudness } = require('../config.json');
// eslint-disable-next-line no-unused-vars
const { LoudnessData } = require('../models/guild-data');

module.exports = {
	data: new SlashCommandBuilder().setName('volume').setDescription('Get normalized volume levels.')
		.addIntegerOption(option => option.setName('loudness').setDescription('Desired loudness in dB. Default value: ' + defaultDesiredLoudness.toFixed(0))),
	async execute(interaction) {
		let desiredLoudness = interaction.options.get('loudness')?.value;

		if (!desiredLoudness) {
			desiredLoudness = defaultDesiredLoudness;
		}

		/** @type {LoudnessData} */
		const loudnessData = interaction.client.loudnessData;

		const usersMap = loudnessData.getUsersMap(interaction.guildId);

		let message = 'Pleayer volumes:';

		usersMap.forEach((userData, userId) => {
			const user = interaction.client.users.cache.get(userId);
			const loudnessdB = userData.getAverageLoudness();
			const difference = desiredLoudness - loudnessdB;

			// calcualing lodness ratio based on decivel difference
			const volumeToSet = Math.pow(2, difference / 10) * 100;

			message = message + '\n Average loudness: ' + loudnessdB.toFixed(1) + ' Volume to set: ' + volumeToSet.toFixed(0) + ' Username: ' + user.username;
		});

		await interaction.reply(message);
	},
};