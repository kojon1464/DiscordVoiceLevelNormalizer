// eslint-disable-next-line no-unused-vars
const { SlashCommandBuilder, Integration, User } = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { joinVoiceChannel, getVoiceConnection, EndBehaviorType, VoiceConnection } = require('@discordjs/voice');
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
			const connectionBeforeJoining = getVoiceConnection(interaction.guildId);

			// joins or switches voice channel
			const connection = joinVoiceChannel({
				channelId: channel.id,
				guildId: interaction.guildId,
				adapterCreator: channel.guild.voiceAdapterCreator,
				selfDeaf: false,
				selfMute: true,
			});

			// perform only when connection is initialy created
			if (!connectionBeforeJoining) {
				initializeVoiceProcessing(interaction, connection);
			}

			// TODO make so that user data is purged when user leves voice channel
			// TODO make so that bot leaves voice channel when all users leave

			await interaction.reply('Joined your voice channel');
		}
	},
};

/**
 * @param { Interaction } interaction
 * @param { VoiceConnection } connection
 */
function initializeVoiceProcessing(interaction, connection) {
	const receiver = connection.receiver;

	receiver.speaking.on('start', (userId) => {
		const audioStream = receiver.subscribe(userId, {
			end: {
				behavior: EndBehaviorType.AfterSilence,
				duration: 100,
			},
		});

		const user = interaction.client.users.cache.get(userId);
		const encoder = new OpusEncoder(48000, 2);
		const audioStreamData = new AudioStreamData();

		audioStream.on('data', chunk => {
			processAudioStreamChunk(chunk, encoder, audioStreamData);
		});

		audioStream.once('end', () => {
			finishProcessingAudioStream(interaction, user, audioStreamData);
		});
	});
}

/**
 * @param {*} chunk
 * @param {OpusEncoder} encoder
 * @param {AudioStreamData} streamData
 */
function processAudioStreamChunk(chunk, encoder, streamData) {
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

	streamData.duration += decoded.length / 48000 / 4;

	if (loudnessdB < dBThreshold) {
		return;
	}

	streamData.chunkLoudnessSumm += loudness;
	streamData.chunkCount++;
}

/**
 * @param {Integration} interaction
 * @param {User} user
 * @param {AudioStreamData} streamData
 */
function finishProcessingAudioStream(interaction, user, streamData) {
	if (streamData.duration > durationThreshold && streamData.chunkCount > 0) {
		// This is not corret mathematical average of whole message but it works in this use case
		const LoudnessDb = 20 * Math.log10(streamData.chunkLoudnessSumm / streamData.chunkCount);

		/** @type { LoudnessData } */
		const loudnessData = interaction.client.loudnessData;
		loudnessData.addMessageData(interaction.guildId, user.userId, LoudnessDb, streamData.duration);

		console.log('User ' + user.username + ' spoken with loudness (in dB): ' + LoudnessDb);
	}
}

class AudioStreamData {
	constructor() {
		this.chunkLoudnessSumm = 0;
		this.chunkCount = 0;
		this.duration = 0;
	}
}