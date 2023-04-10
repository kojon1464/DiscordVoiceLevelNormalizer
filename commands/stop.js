const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('stop').setDescription('Stop normalizing voice levels'),
	async execute(interaction) {
		const connection = interaction.client.voiceConnection;

		if (!connection) {
			await interaction.reply('Normaliztion was not started!');
		} else {
			connection.destroy();
			interaction.client.voiceConnection = null;

			await interaction.reply('Stoped normalization');
		}
	},
};