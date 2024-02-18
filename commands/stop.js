const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
	data: new SlashCommandBuilder().setName('stop').setDescription('Stop normalizing voice levels'),
	async execute(interaction) {
		const connection = getVoiceConnection(interaction.guildId);

		if (!connection) {
			await interaction.reply('Normaliztion was not started!');
		} else {
			connection.destroy();
			await interaction.reply('Stoped normalization');
		}
	},
};