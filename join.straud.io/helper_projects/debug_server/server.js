const logger = require('../logger')('DEBUG');
const WebSocket = require('ws');

const ws = new WebSocket.Server({
	port: 4444
});

ws.on('connection', (socket) => {
	logger.info('connection');
	socket.send(JSON.stringify({
			name: "alex",
			age: 25
		}));

	socket.on('message', (message) => {
		logger.info(`${message}`);

		
	});

	socket.on('close', () => {
		logger.info('closed');
	});
});

