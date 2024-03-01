const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, EndBehaviorType } = require('@discordjs/voice');
const { OpusEncoder } = require('@discordjs/opus');
const { dBThreshold, durationThreshold } = require('../config.json');
// eslint-disable-next-line no-unused-vars
const { LoudnessData } = require('../models/guild-data');

module.exports = {
	data: new SlashCommandBuilder().setName('normalize').setDescription('Start normalizing voice levels'),
	async execute(interaction) {
		const channel = interaction.member.voice.channel;

		if (!channel) {
			await interaction.reply('You are not on any voice channel');
		} else {
			const connection = joinVoiceChannel({
				channelId: channel.id,
				guildId: interaction.guildId,
				adapterCreator: channel.guild.voiceAdapterCreator,
				selfDeaf: false,
				selfMute: true,
			});

			// TODO make so that invoking /normalize second time works
			// TODO make so that user data is purged when user leves voice channel
			// TODO make so that bot leaves voice channel when all users leave
			const receiver = connection.receiver;

			receiver.speaking.on('start', (userId) => {
				const audioStream = receiver.subscribe(userId, {
					end: {
						behavior: EndBehaviorType.AfterSilence,
						duration: 100,
					},
				});

				const encoder = new OpusEncoder(48000, 2);
				let chunkLoudnessSumm = 0;
				let chunkCount = 0;
				let duration = 0;

				audioStream.on('data', chunk => {
					const decoded = encoder.decode(chunk);

					let sampleSquareSum = 0;
					let sampleCount = 0;

					for (let i = 0; i < decoded.length - 2; i += 2) {
						const sample = decoded.readInt16LE(i);

						sampleSquareSum += sample * sample;
						sampleCount += 1;
					}

					const loudness = Math.sqrt(sampleSquareSum / sampleCount);
					const loudnessdB = 20 * Math.log10(loudness);

					duration += decoded.length / 48000 / 4;

					if (loudnessdB < dBThreshold) {
						return;
					}

					chunkLoudnessSumm += loudness;
					chunkCount++;
				});

				audioStream.once('end', () => {
					const user = interaction.client.users.cache.get(userId);

					if (duration > durationThreshold && chunkCount > 0) {
						// This is not corret mathematical average of whole message but it works in this use case
						const LoudnessDb = 20 * Math.log10(chunkLoudnessSumm / chunkCount);

						/** @type { LoudnessData } */
						const loudnessData = interaction.client.loudnessData;
						loudnessData.addMessageData(interaction.guildId, userId, LoudnessDb, duration);

						console.log('User ' + user.username + ' spoken with loudness (in dB): ' + LoudnessDb);
					}
				});
			});

			await interaction.reply('Joined your voice channel');
		}
	},
};