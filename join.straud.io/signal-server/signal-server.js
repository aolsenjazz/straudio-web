const logger = require('../logger')('SignalServer');
const WebSocket = require('ws');
const randomstring = require('randomstring');
const Validator = require('./validator');
const https = require('https');
const fs = require('fs');
const Analytics = require('./analytics');

class SignalServer {

	constructor() {
		this._server = null;
		this._rooms = new Map();
		this.analytics = {};

		this.start = this.start.bind(this);
		this.getSocket = this.getSocket.bind(this);
		this.sendDescription = this.sendDescription.bind(this);
		this.sendCandidate = this.sendCandidate.bind(this);
		this.getNClients = this.getNClients.bind(this);
		this.getNRooms = this.getNRooms.bind(this);
		this.initAnalytics = this.initAnalytics.bind(this);

		this._validator = new Validator(this._rooms, this.getSocket);
	}

	start() {
		if (process.env.USE_TLS === 'true') {
			logger.info('starting secure signalling server...');

			let httpsServer = https.createServer({
				key: fs.readFileSync(process.env.PRIVKEY),
				cert: fs.readFileSync(process.env.FULLCHAIN),
			});
			httpsServer.listen(process.env.PORT);
			this._server = new WebSocket.Server({
				server: httpsServer,
				verifyClient: (info) => {
					return true;
				},
			});
		} else {
			logger.info('starting signalling server...');
			this._server = new WebSocket.Server({port: process.env.PORT});
		}

		this.analytics = new Analytics(this.getNRooms, this.getNClients);

		this._server.on('connection', (socket) => {
			socket.id = randomstring.generate(8); // the number 8 has no significance
			logger.info(`Client[${socket.id}] connected`);

			this.initPinger(socket);

			socket.on('pong', () => {
				socket.missedPings = 0;
			});

			socket.on('message', (msg) => {
				this.analytics.incomingRequest(msg);

				// Parse JSON
				let data;
				try { data = JSON.parse(msg); } 
				catch (error) { logger.warn(`Failed to parse json[${msg}]`); return; }

				// Validate the request
				let {error, errorMsg} = this._validator.validate(socket, data, data.method);
				if (error) {
					this.safeSend(socket, JSON.stringify({success: false, error: errorMsg, method: data.method + 'Response'}));
					return;
				}

				// Pass to business logic
				if (data.method == 'audioDetails') this.audioDetails(socket, data);
				else if (data.method == 'createRoom')  this.createRoom(socket, data);
				else if (data.method == 'joinRoom')    this.joinRoom(socket, data);
				else if (data.method == 'rejoinRoom')  this.rejoinRoom(socket, data);
				else if (data.method == 'deleteRoom')  this.deleteRoom(socket, data);
				else if (data.method == 'leaveRoom')   this.leaveRoom(socket, data);
				else if (data.method == 'description') this.sendDescription(socket, data);
				else if (data.method == 'candidate')   this.sendCandidate(socket, data);
				else if (data.method == 'getRoom')     this.getRoom(socket, data);
				else if (data.method == 'bufferReset') this.bufferReset(socket, data);
				else if (data.method == 'analytics')   this.initAnalytics(socket, data);
				else if (data.method == 'me')          this.sendMe(socket);
				else { logger.warn(`Invalid method ${data.method}`); return; }
			});

			socket.on('close', () => {
				clearInterval(socket.pinger);
				clearInterval(socket.analytics);

				let room;
				if (socket.roomId && (room = this._rooms.get(socket.roomId))) {

					let isHost = (room.host && room.host.id == socket.id);
					let action = isHost ? 'hostLeave' : 'clientLeave';
					let client = {id: socket.id};
					room.joined = false;

					if (isHost) room.host = null;
					else room.participants.delete(socket.id);

					let roomState = isHost ? 'closed' : 'open';
					room.state = roomState;

					this.notifyRoomOfClientAction(client, room, action);
					
					if (room.host === null && room.participants.size === 0) {
						// if room is empty, close it
						this._rooms.delete(room.id);
						logger.info(`Room[${room.id}] closed`);
					}	
				}

				logger.info(`Client[${socket.id}] disconnected`);
			});
		});

		logger.info(`${process.env.USE_TLS === 'true' ? 'secure ' : ''}signal server running on port ${process.env.PORT}`);
	}

	initPinger(socket) {
		socket.missedPings = 0;
		socket.pinger = setInterval(() => {
			if (socket.missedPings == 5) {
				console.log(`Socket[${socket.id}] unresponsive. terminating...`);
				socket.terminate();
			}

			socket.missedPings++;
			socket.ping(() => {});
		}, 5000);
	}

	createRoom(socket, data) {
		let roomId = this.newRoomId();
		socket.roomId = roomId;
		logger.info(`Client[${socket.id}] created Room[${roomId}]`);

		let room = {
			id: roomId,
			participants: new Map(),
			sampleRate: data.sampleRate,
			bitDepth: data.bitDepth,
			state: 'open',
			host: {
				id: socket.id,
			}
		};
		this._rooms.set(roomId, room);

		this.safeSend(socket, JSON.stringify({ room: partFix(room), success: true, method: 'createRoomResponse' }));
		logger.info('send room Create response');
	}

	deleteRoom(socket, data) {
		// Tell the participants that the room is closing
		data.room.state = 'closed';
		this.notifyRoomOfClientAction(data.client, data.room, 'roomClose');
		for (let s of this.getClientSocketsInRoom(data.room.id)) s.roomId = null;

		this._rooms.delete(data.room.id);

		socket.roomId = null;
		this.safeSend(socket, JSON.stringify({method: 'deleteRoomResponse', success: true, room: partFix(data.room)}));
		logger.info(`Client[${socket.id}] deleted Room${data.roomId}`);
	}

	joinRoom(socket, data) {
		// room wasn't automatically set in validator because client isn't yet in room
		let room = this._rooms.get(data.roomId);
		room.joined = true;
		socket.roomId = room.id;

		// Put the client in the room and notify success
		room.participants.set(socket.id, data.client);
		this.safeSend(socket, JSON.stringify({method: 'joinRoomResponse', success: true, room: partFix(room)}));

		// Tell everyone else
		this.notifyRoomOfClientAction(data.client, room, 'clientJoin', false);

		logger.info(`Client[${socket.id}] joined Room[${data.roomId}] as client`);
	}

	rejoinRoom(socket, data) {
		// room isn't set in data by validator because room isn't joined yet
		let room = this._rooms.get(data.roomId);
		room.joined = true;

		socket.roomId = room.id;

		if (data.host) room.host = data.client;
		else room.participants.set(socket.id, data.client);

		this.safeSend(socket, JSON.stringify({method: 'rejoinRoomResponse', success: true, room: partFix(room)}));

		this.notifyRoomOfClientAction(data.client, room, data.host ? 'hostRejoin' : 'clientRejoin', true);
		logger.info(`Client[${socket.id}] rejoined Room[${data.roomId}] as ${data.host ? 'host' : 'client'}`);
	}

	leaveRoom(socket, data) {
		if (socket.id == data.room.host.id) {
			data.room.host = null;
		} else {
			data.room.participants.delete(socket.id);
		}

		let roomCopy = {... data.room};
		socket.roomId = null;
		roomCopy.joined = false;

		if (data.room.host || data.room.participants.size > 0) {
			this.notifyRoomOfClientAction(data.client, data.room, 'clientLeave'); 
		} else {
			this._rooms.delete(data.room.id);
			logger.info(`Room[${data.room.id}] closed`);
		}

		this.safeSend(socket, JSON.stringify({method: 'leaveRoomResponse', success: true, room: partFix(roomCopy)}));
		logger.info(`Client[${socket.id}] left Room[${data.room.id}]`);
	}

	getRoom(socket, data) {
		let room = this._rooms.get(data.roomId);
		let joined = false;

		if (room.host && room.host.id === socket.id) {
			joined = true;
		}

		for (let participant of Array.from(room.participants.values())) {
			if (participant.id === socket.id) {
				joined = true;
			}
		}

		let visibleData = joined ? room : {
			sampleRate: room.sampleRate,
			bitDepth: room.bitDepth,
			joined: joined,
		};

		this.safeSend(socket, JSON.stringify({method: 'getRoomResponse', success: true, room:partFix(visibleData)}));
	}

	sendDescription(socket, data) {
		let targetSocket = this.getSocket(data.targetId);

		this.safeSend(targetSocket, JSON.stringify({description: data.description, sourceId: socket.id, method: 'description'}));
		this.safeSend(socket, JSON.stringify({method: 'descriptionResponse', success:true}));
	}

	sendCandidate(socket, data) {
		let targetSocket = this.getSocket(data.targetId);

		this.safeSend(targetSocket, JSON.stringify({candidate: data.candidate, sourceId: socket.id, method: 'candidate'}));
		this.safeSend(socket, JSON.stringify({method: 'candidateResponse', success:true}));
	}

	audioDetails(socket, data) {
		let room = data.room;

		if (room.sampleRate != data.sampleRate 
			|| room.bitDepth != data.bitDepth) {
			room.sampleRate = data.sampleRate;
			room.bitDepth = data.bitDepth;

			this.notifyRoomOfClientAction(data.client, data.room, 'audioDetails');
		}

		this.safeSend(socket, JSON.stringify({method: 'audioDetailsResponse', success: true, room: partFix(room)}));
	}

	bufferReset(socket, data) {
		if (socket.roomId === undefined) {
			return;
		}

		let sockets = this.getClientSocketsInRoom(socket.roomId);

		for (let s of sockets) {
			this.safeSend(s, JSON.stringify({method: 'bufferReset'}));
		}
	}

	initAnalytics(socket, data) {
		socket.analytics = setInterval(() => {
			if (socket.readyState === WebSocket.OPEN) {
				let report = this.analytics.report();
				socket.send(JSON.stringify({method: 'analytics', report: {... report}}));
			} else {
				logger.warn(`Failed to write to analytics socket.`);
			}
		}, 2000);
	}

	getClientSocketsInRoom(roomId, includeHost=false) {
		let room = this._rooms.get(roomId);

		let keys = Array.from(room.participants.keys());
		let sockets = [];

		for (let key of keys) {
			let s = this.getSocket(key);
			sockets.push(s);
		}

		if (includeHost && room.host) {
			let s = this.getSocket(room.host.id);
			if (s != undefined) sockets.push(s);
		}

		return sockets;
	}

	getSocket(id) {
		for (let socket of this._server.clients) {
			if (socket.id == id) return socket;
		}
	}

	newRoomId() {
		let roomId;
		while (!roomId || roomId in this._rooms.keys()) {
			roomId = randomstring.generate({length: 4, capitalization: 'uppercase', readable: true, charset:'alphabetic'});
		}
		return roomId;
	}

	/**
	 * method == 'clientJoin' || 'clientLeave' || 'hostRejoin' || 'hostLeave'
	 */
	notifyRoomOfClientAction(client, room, method) {
		let sockets = this.getClientSocketsInRoom(room.id, true);

		if (sockets.length > 0) {
			for (let s of sockets) {
				if (!s || s.id == client.id) continue;
				this.safeSend(s, JSON.stringify({method: method, client: client, room: partFix(room)}))
			}
		}
	}

	getNClients() {
		return Array.from(this._server.clients).length;
	}

	getNRooms() {
		return Array.from(this._rooms.values()).length;
	}

	safeSend(socket, dataString) {
		this.analytics.outgoingRequest(dataString);

		if (socket.readyState === WebSocket.OPEN) {
			socket.send(dataString);
		} else {
			logger.warn(`Failed to write to Client[${socket.id}] with payload[${dataString}] during incorrect State[${socket.readyState}]`);
		}
	}

	sendMe(socket) {
		let room = null;
		if (socket.roomId) {
			room = this._rooms.get(roomId);
			room.joined = true;
		}

		let me = {
			id: socket.id,
			roomId: socket.roomId,
			room: room ? partFix(room) : null,
			method: 'meResponse'
		}

		this.safeSend(socket, JSON.stringify(me));
	}
}

function partFix(room) {
	let r = {... room};
	r.participants = room.participants ? Array.from(room.participants.values()) : [];

	return r;
}

module.exports = SignalServer;
