const http = require('http');
const url = require('url');
const { httpHost, httPort } = require('./config.json');


module.exports = {
	initializeHttpServer(discordClient) {
		const server = http.createServer(createResponseHandler(discordClient));
		server.listen(httPort, httpHost, () => {
			console.log('[Http] Http server has been initialized!');
		});

		server.on('error', (error) => {console.log(error);});
	},
};


function createResponseHandler(discordClient) {

	/**
	 * @param { http.IncomingMessage } request
	 * @param { http.ServerResponse } response
	 */
	return (request, response) => {
		const guildGuid = url.parse(request.url, true).query['guid'];

		/** @type {LoudnessData} */
		const loudnessData = discordClient.loudnessData;

		const usersMap = loudnessData.getUsersMap(guildGuid);

		response.setHeader('Content-Type', 'application/json');
		response.writeHead(200);
		response.end(JSON.stringify(Array.from(usersMap)));
	};
}