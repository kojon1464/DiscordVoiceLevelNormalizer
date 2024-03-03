const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
// eslint-disable-next-line no-unused-vars
const { LoudnessData } = require('../models/guild-data');

module.exports = {
	data: new SlashCommandBuilder().setName('stop').setDescription('Stop normalizing voice levels'),
	async execute(interaction) {
		const connection = getVoiceConnection(interaction.guildId);

		if (!connection) {
			await interaction.reply('Normaliztion was not started!');
		} else {
			/** @type { LoudnessData } */
			const loudnessData = interaction.client.loudnessData;

			loudnessData.guildMap.delete(interaction.guildId);
			connection.destroy();

			await interaction.reply('Stoped normalization');
		}
	},
};