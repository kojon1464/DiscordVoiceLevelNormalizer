// eslint-disable-next-line no-unused-vars
const { Events, VoiceState, VoiceChannel } = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { LoudnessData } = require('../models/guild-data');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
	name: Events.VoiceStateUpdate,
	once: false,
	/**
	 * @param {VoiceState} oldState
	 * @param {VoiceState} newState
	 */
	async execute(oldState, newState) {

		const client = oldState.client;
		const guildId = oldState.guild.id;
		const guild = client.guilds.cache.get(guildId);
		const botUserId = client.user.id;
		const botVoiceState = guild.members.cache.get(botUserId).voice;

		const connection = getVoiceConnection(guildId);

		if (!connection || oldState.channelId != botVoiceState.channelId) {
			return;
		}

		/** @type { LoudnessData } */
		const loudnessData = oldState.client.loudnessData;

		if (newState.channelId != botVoiceState.channelId) {
			loudnessData.getUsersMap(guildId).delete(oldState.member.id);
		}

		if (!AreUsersOnChannel(botVoiceState)) {
			loudnessData.guildMap.delete(guildId);
			connection.destroy();
		}
	},
};

/**
 * @param {VoiceState} botVoiceState
 */
function AreUsersOnChannel(botVoiceState) {
	return botVoiceState.channel.members.some(m => !m.user.bot);
}