const { numberOfMessagesInLoudnessCalculation } = require('../config.json');
const { zip, reduce } = require('powerseq');


class LoudnessData {
	constructor() {
		this.guildMap = new Map();
	}

	addMessageData(guildId, userId, loudness, duration) {
		let guild = this.guildMap.get(guildId);

		if (!guild) {
			guild = new GuidData();
			this.guildMap.set(guildId, guild);
		}

		guild.addMessageData(userId, loudness, duration);
	}

	/** @type { (string) => Map<string, UserData> } */
	getUsersMap(guildId) {
		const guild = this.guildMap.get(guildId);

		if (!guild) {
			return new Map();
		}

		return guild.getUsersMap();
	}
}

class GuidData {
	constructor() {
		this.userMap = new Map();
	}

	addMessageData(userId, loudness, duration) {
		let user = this.userMap.get(userId);

		if (!user) {
			user = new UserData();
			this.userMap.set(userId, user);
		}

		user.addMessageData(loudness, duration);
	}

	/** @type { (string) => Map<string, UserData> } */
	getUsersMap() {
		return this.userMap;
	}
}

class UserData {
	constructor() {
		this.latestLoudness = [];
		this.latestDuration = [];
	}

	addMessageData(loudness, duration) {
		this.latestLoudness.push(loudness);
		this.latestDuration.push(duration);

		if (this.latestLoudness.length > numberOfMessagesInLoudnessCalculation) {
			this.latestLoudness.shift();
			this.latestDuration.shift();
		}
	}

	getAverageLoudness() {
		return reduce(zip(this.latestLoudness, this.latestDuration, (l, d) => l * d), (d, x) => d + x) / reduce(this.latestDuration, (d, x) => d + x);
	}
}

module.exports = {
	LoudnessData,
};