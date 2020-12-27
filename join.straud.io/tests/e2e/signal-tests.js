const WebSocket = require('ws');
const websocketUrl = `ws://${process.env.HOST}:${process.env.SIGNAL_PORT}`;
const {Test, TestSection, TestRunner} = require('./test-classes');

class SignalTests extends TestSection {

	Test_CreateRoom_Success = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.ws = new WebSocket(websocketUrl);
				this.run();	
				this.resolve = resolve;
			});
		}

		run() {
			this.ws.on('open', () => {
				this.ws.send(JSON.stringify({
					method: 'createRoom',
					displayName: 'testName',
					sampleRate: 44100,
					nChannels: 2,
					bitDepth: 16,
				}));
			});

			this.ws.on('message', (msg) => {
				let data = JSON.parse(msg);
		
				if (data.method == 'createRoomResponse' && data.success == true) {
					this.teardown(true);
				} else if (data.method == 'createRoomResponse' && data.success == false) {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.ws.close();
			this.resolve(success);
		}
	}

	Test_CreateRoom_Fail_NobitDepth = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.ws = new WebSocket(websocketUrl);
				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			this.ws.on('open', () => {
				this.ws.send(JSON.stringify({
					method: 'createRoom',
					sampleRate: 44100,
					nChannels: 2,
					displayName: 'hello'
				}));
			});

			this.ws.on('message', (msg) => {
				let data = JSON.parse(msg);
		
				if (data.method == 'createRoomResponse' && data.success) {
					this.teardown(false);
				} else if (data.method == 'createRoomResponse' && !data.success) {
					this.teardown(true);
				}
			});
		}

		teardown(success) {
			this.ws.close();
			this.resolve(success);
		}
	}

	Test_RejoinRoom_Success = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				// FOLLOW THE COMMENTS TO SEE WHAT'S GOING ON
				this.hostWs = new WebSocket(websocketUrl);
				this.newHostWs;
				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {

				this.clientWs = new WebSocket(websocketUrl);

				this.clientWs.on('open', () => {
					// 1) create the room
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'hosty',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});

				this.clientWs.on('message', (msg) => {

					let data = JSON.parse(msg);
					if (data.method == 'joinRoomResponse' && data.success) {
						// 3) client has joined, now let's make the host leave
						this.hostWs.close();
					}
				});

				
			});

			this.hostWs.on('close', () => {
				// 3.5) host has disconnected. now let's create a new connection as host
				this.newHostWs = new WebSocket(websocketUrl);
				this.newHostWs.on('open', () => {
					// 4) rejoin the session as host
					this.newHostWs.send(JSON.stringify({
						method: 'rejoinRoom',
						roomId: roomId,
						displayName: 'newHost',
						host: true
					}));
				});

				this.newHostWs.on('message', (msg) => {
					// 5) hopefully the new WS client rejoined as host
					let d = JSON.parse(msg);
					if (d.method == 'rejoinRoomResponse' && d.success) {
						this.teardown(true);
					} else {
						this.teardown(false);
					}
				});
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
		
				if (data.method == 'createRoomResponse' && data.success) {
					// 2) room is created, join the room with the client
					roomId = data.room.id;
					
					this.clientWs.send(JSON.stringify({
						method: 'joinRoom',
						displayName: 'client',
						roomId: data.room.id
					}));
				}
			});

			
		}

		teardown(success) {
			this.clientWs.close();
			this.newHostWs.close();
			this.resolve(success);
		}
	}

	Test_RejoinRoom_HostAlreadyExists = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				// FOLLOW THE COMMENTS TO SEE WHAT'S GOING ON
				this.hostWs = new WebSocket(websocketUrl);
				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				// 1) Create the room

				this.newHostWs = new WebSocket(websocketUrl);

				this.newHostWs.on('open', () => {
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'hosty',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});

				this.newHostWs.on('message', (msg) => {
					// 3) hopefully, newHostWs tried to overwrite roomId, but failed
					let data = JSON.parse(msg);
					if (data.method == 'rejoinRoomResponse' && !data.success) {
						this.teardown(true);
					} else if (data.method == 'rejoinRoomResponse') {
						this.teardown(false);
					}
				});
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse' && data.success) {
					// 2) room is created, attempt to join the room as host with newHostWs by invoking createRoom()
					roomId = data.room.id;
					
					this.newHostWs.send(JSON.stringify({
						method: 'rejoinRoom',
						displayName: 'newHost',
						roomId: data.room.id
					}));
				}
			});
			
		}

		teardown(success) {
			this.hostWs.close();
			this.newHostWs.close();
			this.resolve(success);
		}
	}

	Test_JoinRoom_Success = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);
				
				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.clientWs = new WebSocket(websocketUrl);

				this.clientWs.on('open', () => {
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'hosty',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});

				this.clientWs.on('message', (msg) => {
					let data = JSON.parse(msg);
					if (data.method == 'joinRoomResponse' && data.success) {
						this.teardown(true);
					} else if (data.method == 'joinRoomResponse') {
						this.teardown(false);
					}
				});
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse' && data.success) {
					roomId = data.room.id;
					
					this.clientWs.send(JSON.stringify({
						method: 'joinRoom',
						displayName: 'newClient',
						roomId: data.room.id,
					}));
				}
			});

			
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs.close();
			this.resolve(success);
		}
	}

	Test_JoinRoom_Fail_NoRoomId = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);
				
				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.clientWs = new WebSocket(websocketUrl);

				this.clientWs.on('open', () => {
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'hosty',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});

				this.clientWs.on('message', (msg) => {
					let data = JSON.parse(msg);
					if (data.method == 'joinRoomResponse' && !data.success) {
						this.teardown(true);
					} else if (data.method == 'joinRoomResponse') {
						this.teardown(false);
					}
				});
				
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse' && data.success) {
					roomId = data.room.id;
					
					this.clientWs.send(JSON.stringify({
						method: 'joinRoom',
						displayName: 'daWG'
					}));
				}
			});

			
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs.close();
			this.resolve(success);
		}
	}

	Test_JoinRoom_Fail_BadRoomId = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);
				
				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {

				this.clientWs = new WebSocket(websocketUrl);

				this.clientWs.on('open', () => {
					// 1) Create the room
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'hosty',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});

				this.clientWs.on('message', (msg) => {
					// 3) hopefully, newHostWs tried to overwrite roomId, but failed
					let data = JSON.parse(msg);
					if (data.method == 'joinRoomResponse' && !data.success) {
						this.teardown(true);
					} else if (data.method == 'joinRoomResponse') {
						this.teardown(false);
					}
				});
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse' && data.success) {
					// 2) room is created, attempt to join the room as a client
					roomId = data.room.id;
					
					this.clientWs.send(JSON.stringify({
						method: 'joinRoom',
						displayName: 'daWG',
						roomId: 'badroomid'
					}));
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs.close();
			this.resolve(success);
		}
	}

	Test_DeleteRoom_Success = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);
				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			this.hostWs.on('open', () => {
				// 1) Create the room
				this.hostWs.send(JSON.stringify({
					method: 'createRoom',
					displayName: 'hosty',
					sampleRate: 44100,
					nChannels: 2,
					bitDepth: 16,
				}));
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse' && data.success) {
					// 2) room is created, attempt to close it
					let roomId = data.room.id;
					
					this.hostWs.send(JSON.stringify({
						method: 'deleteRoom',
						roomId: roomId
					}));
				} else if (data.method == 'deleteRoomResponse' && data.success) {
					this.teardown(true);
				} else if (data.method == 'deleteRoomResponse' && !data.success) {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.resolve(success);
		}
	}

	Test_DeleteRoom_Fail_BadRoomId = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);
				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			this.hostWs.on('open', () => {
				// 1) Create the room
				this.hostWs.send(JSON.stringify({
					method: 'createRoom',
					displayName: 'hosty',
					sampleRate: 44100,
					nChannels: 2,
					bitDepth: 16,
				}));
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse' && data.success) {
					// 2) room is created, attempt to close it
					let roomId = data.room.id;
					
					this.hostWs.send(JSON.stringify({
						method: 'deleteRoom',
						roomId: 'badroomid'
					}));
				} else if (data.method == 'deleteRoomResponse' && !data.success) {
					this.teardown(true);
				} else if (data.method == 'deleteRoomResponse' && data.success) {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.resolve(success);
		}
	}

	Test_DeleteRoom_Fail_NotAuthorized = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);
				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {

				this.clientWs = new WebSocket(websocketUrl);

				this.clientWs.on('open', () => {
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'hosty',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});

				this.clientWs.on('message', (msg) => {
					let data = JSON.parse(msg);
					if (data.method == 'joinRoomResponse' && data.success) {
						this.clientWs.send(JSON.stringify({
							method: 'deleteRoom',
							roomId: roomId
						}));


					} else if (data.method == 'joinRoomResponse') {
						this.teardown(false);
					} else if (data.method == 'deleteRoomResponse' && data.success) {
						this.teardown(false);
					} else if (data.method == 'deleteRoomResponse' && !data.success) {
						this.teardown(true);
					}
				});

				
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse' && data.success) {
					roomId = data.room.id;
					
					this.clientWs.send(JSON.stringify({
						method: 'joinRoom',
						displayName: 'newClient',
						roomId: data.room.id
					}));
				}
			});

			
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs.close();
			this.resolve(success);
		}
	}

	Test_SendDescription_Success = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.sourceWs = new WebSocket(websocketUrl);
				this.targetWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.targetWs.on('open', () => {
				// 1) find out the target socket's ID
				this.targetWs.send(JSON.stringify({
					method: 'me'
				}));
			});

			this.targetWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				if (data.method == 'meResponse') {
					// Once the target socket's ID is known, send description from source
					let targetWsId = data.id;
					this.sourceWs.send(JSON.stringify({
						method: 'description',
						targetId: targetWsId,
						description: {
							description: 'describe me baby'
						}
					}));
				}
			});

			this.sourceWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'descriptionResponse' && data.success) {
					this.teardown(true);
				} else if (data.method == 'descriptionResponse' && !data.success) {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.sourceWs.close();
			this.targetWs.close();
			this.resolve(success);
		}
	}

	Test_SendDescription_Fail_NoTargetId = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.sourceWs = new WebSocket(websocketUrl);
				this.targetWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.targetWs.on('open', () => {
				// 1) find out the target socket's ID
				this.targetWs.send(JSON.stringify({
					method: 'me'
				}));
			});

			this.targetWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'meResponse') {
					// Once the target socket's ID is known, send description from source
					let targetWsId = data.id;
					this.sourceWs.send(JSON.stringify({
						method: 'description',
						description: {
							description: 'describe me baby'
						}
					}));
				}
			});

			this.sourceWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'descriptionResponse' && !data.success) {
					this.teardown(true);
				} else if (data.method == 'descriptionResponse' && data.success) {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.sourceWs.close();
			this.targetWs.close();
			this.resolve(success);
		}
	}

	Test_SendDescription_Fail_NoDescription = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.sourceWs = new WebSocket(websocketUrl);
				this.targetWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});

		}

		run() {
			let roomId;

			this.targetWs.on('open', () => {
				// 1) find out the target socket's ID
				this.targetWs.send(JSON.stringify({
					method: 'me'
				}));
			});

			this.targetWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'meResponse') {
					// Once the target socket's ID is known, send description from source
					let targetWsId = data.id;
					this.sourceWs.send(JSON.stringify({
						method: 'description',
						targetId: targetWsId
					}));
				}
			});

			this.sourceWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'descriptionResponse' && !data.success) {
					this.teardown(true);
				} else if (data.method == 'descriptionResponse' && data.success) {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.sourceWs.close();
			this.targetWs.close();
			this.resolve(success);
		}
	}

	Test_SendDescription_Fail_BadTargetId = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.sourceWs = new WebSocket(websocketUrl);
				this.targetWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.targetWs.on('open', () => {
				// 1) find out the target socket's ID
				this.targetWs.send(JSON.stringify({
					method: 'me'
				}));
			});

			this.targetWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'meResponse') {
					// Once the target socket's ID is known, send description from source
					let targetWsId = data.id;
					this.sourceWs.send(JSON.stringify({
						method: 'description',
						targetId: 'woops bad target Id',
						description: {
							description: 'oooo a describy baby'
						}
					}));
				}
			});

			this.sourceWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'descriptionResponse' && !data.success) {
					this.teardown(true);
				} else if (data.method == 'descriptionResponse' && data.success) {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.sourceWs.close();
			this.targetWs.close();
			this.resolve(success);
		}
	}

	Test_SendCandidate_Success = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.sourceWs = new WebSocket(websocketUrl);
				this.targetWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.targetWs.on('open', () => {
				// 1) find out the target socket's ID
				this.targetWs.send(JSON.stringify({
					method: 'me'
				}));
			});

			this.targetWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'meResponse') {
					// Once the target socket's ID is known, send candidate from source
					let targetWsId = data.id;
					this.sourceWs.send(JSON.stringify({
						method: 'candidate',
						targetId: targetWsId,
						candidate: {
							candidate: 'candy me baby'
						}
					}));
				}
			});

			this.sourceWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'candidateResponse' && data.success) {
					this.teardown(true);
				} else if (data.method == 'candidateResponse' && !data.success) {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.sourceWs.close();
			this.targetWs.close();
			this.resolve(success);
		}
	}

	Test_SendCandidate_Fail_NoTargetId = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.sourceWs = new WebSocket(websocketUrl);
				this.targetWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.targetWs.on('open', () => {
				// 1) find out the target socket's ID
				this.targetWs.send(JSON.stringify({
					method: 'me'
				}));
			});

			this.targetWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'meResponse') {
					// Once the target socket's ID is known, send candidate from source
					let targetWsId = data.id;
					this.sourceWs.send(JSON.stringify({
						method: 'candidate',
						candidate: {
							candidate: 'candy me baby'
						}
					}));
				}
			});

			this.sourceWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'candidateResponse' && !data.success) {
					this.teardown(true);
				} else if (data.method == 'candidateResponse' && data.success) {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.sourceWs.close();
			this.targetWs.close();
			this.resolve(success);
		}
	}

	Test_SendCandidate_Fail_NoCandidate = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.sourceWs = new WebSocket(websocketUrl);
				this.targetWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.targetWs.on('open', () => {
				// 1) find out the target socket's ID
				this.targetWs.send(JSON.stringify({
					method: 'me'
				}));
			});

			this.targetWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'meResponse') {
					// Once the target socket's ID is known, send invalid candidate
					let targetWsId = data.id;
					this.sourceWs.send(JSON.stringify({
						method: 'candidate',
						targetId: targetWsId
					}));
				}
			});

			this.sourceWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'candidateResponse' && !data.success) {
					this.teardown(true);
				} else if (data.method == 'candidateResponse' && data.success) {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.sourceWs.close();
			this.targetWs.close();
			this.resolve(success);
		}
	}

	Test_SendCandidate_Fail_BadTargetId = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.sourceWs = new WebSocket(websocketUrl);
				this.targetWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.targetWs.on('open', () => {
				// 1) find out the target socket's ID
				this.targetWs.send(JSON.stringify({
					method: 'me'
				}));
			});

			this.targetWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'meResponse') {
					// Once the target socket's ID is known, send description from source
					let targetWsId = data.id;
					this.sourceWs.send(JSON.stringify({
						method: 'candidate',
						targetId: 'woops bad target Id',
						candidate: {
							candidate: 'oooo a candy baby'
						}
					}));
				}
			});

			this.sourceWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'candidateResponse' && !data.success) {
					this.teardown(true);
				} else if (data.method == 'candidateResponse' && data.success) {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.sourceWs.close();
			this.targetWs.close();
			this.resolve(success);
		}
	}

	Test_HostDisconnect_ClientsNotified = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.clientWs = new WebSocket(websocketUrl);

				this.clientWs.on('open', () => {
					// 1) find out the target socket's ID
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'randomName',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});

				this.clientWs.on('message', (msg) => {
					let data = JSON.parse(msg);

					if (data.method == 'joinRoomResponse' && data.success) {
						this.hostWs.close();
					} else if (data.method == 'joinRoomResponse' && !data.success) {
						this.teardown(false);
					} else if (data.method == 'hostLeave') {
						this.teardown(true);
					}
				});
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse') {
					roomId = data.room.id;
					this.clientWs.send(JSON.stringify({
						method: 'joinRoom',
						roomId: roomId,
						displayName: 'clientboii1'
					}));
				} else if (data.method == 'clientLeave') {
					this.teardown(true);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs.close();
			this.resolve(success);
		}
	}

	Test_RoomClose_ClientsNotified = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);
				this.clientWs;
				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				// 1) find out the target socket's ID
				this.hostWs.send(JSON.stringify({
					method: 'createRoom',
					displayName: 'randomName',
					sampleRate: 44100,
					nChannels: 2,
					bitDepth: 16,
				}));
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse') {
					this.clientWs = new WebSocket(websocketUrl);
					roomId = data.room.id;
					
					this.clientWs.on('open', () => {
						this.clientWs.send(JSON.stringify({
							method: 'joinRoom',
							roomId: roomId,
							displayName: 'clientboii1'
						}));

						this.clientWs.on('message', (msg) => {
							let data = JSON.parse(msg);

							if (data.method == 'joinRoomResponse' && data.success) {
								this.hostWs.send(JSON.stringify({
									method: 'deleteRoom',
									roomId: roomId
								}));
							} else if (data.method == 'joinRoomResponse' && !data.success) {
								this.teardown(false);
							} else if (data.method == 'roomClose') {
								this.teardown(true);
							}
						});
					});
				} else if (data.method == 'clientLeave') {
					this.teardown(true);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs.close();
			this.resolve(success);
		}
	}

	Test_ClientJoin_HostNotified = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);
				

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {

				this.clientWs = new WebSocket(websocketUrl);

				this.clientWs.on('open', () => {
					// 1) find out the target socket's ID
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'randomName',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse') {
					roomId = data.room.id;

					this.clientWs.send(JSON.stringify({
						method: 'joinRoom',
						roomId: roomId,
						displayName: 'clientboii1'
					}));

				} else if (data.method == 'clientJoin') {
					this.teardown(true);
				}

			});
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs.close();
			this.resolve(success);
		}
	}

	Test_ClientJoin_ClientsNotified = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);
				
				this.clientWs2 = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {

				this.clientWs1 = new WebSocket(websocketUrl);

				this.clientWs1.on('open', () => {
					// 1) find out the target socket's ID
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'randomName',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});

				this.clientWs1.on('message', (msg) => {
					let data = JSON.parse(msg);

					if (data.method == 'joinRoomResponse' && data.success) {
						this.clientWs2.send(JSON.stringify({
							method: 'joinRoom',
							roomId: roomId,
							displayName: 'client2'
						}));
					} else if (data.method == 'joinRoomResponse' && !data.success) {
						this.teardown(false);
					} else if (data.method == 'clientJoin') {
						this.teardown(true);
					}
				});

			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse') {
					roomId = data.room.id;
					this.clientWs1.send(JSON.stringify({
						method: 'joinRoom',
						roomId: roomId,
						displayName: 'clientboii1'
					}));
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs1.close();
			this.clientWs2.close();
			this.resolve(success);
		}
	}

	Test_HostRejoin_ClientsNotified = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);
				this.newHostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {

				this.clientWs1 = new WebSocket(websocketUrl);

				this.clientWs1.on('open', () => {
					// 1) find out the target socket's ID
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'randomName',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});

				this.clientWs1.on('message', (msg) => {
					let data = JSON.parse(msg);

					if (data.method == 'joinRoomResponse' && data.success) {
						this.hostWs.close();
						this.newHostWs.send(JSON.stringify({
							method: 'createRoom',
							roomId: roomId,
							displayName: 'newhost boiii',
							sampleRate: 44100,
							nChannels: 2,
							bitDepth: 16,
						}));
					} else if (data.method == 'joinRoomResponse' && !data.success) {
						this.teardown(false);
					} else if (data.method == 'hostRejoin') {
						this.teardown(true);
					}
				});
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse') {

					roomId = data.room.id;
					this.clientWs1.send(JSON.stringify({
						method: 'joinRoom',
						roomId: roomId,
						displayName: 'clientboii1'
					}));
				} else if (data.method == 'clientJoin') {
					this.teardown(true);
				}
			});

			
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs1.close();
			this.newHostWs.close();
			this.resolve(success);
		}
	}

	Test_HostLeave_Success = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.clientWs1 = new WebSocket(websocketUrl);
				// 1) find out the target socket's ID
				this.hostWs.send(JSON.stringify({
					method: 'createRoom',
					displayName: 'randomName',
					sampleRate: 44100,
					nChannels: 2,
					bitDepth: 16,
				}));
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse') {
					roomId = data.room.id;
					this.hostWs.send(JSON.stringify({
						method: 'leaveRoom',
					}));
				} else if (data.method == 'leaveRoomResponse' && data.success) {
					this.teardown(true);
				} else if (data.method == 'leaveRoomResponse') {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.resolve(success);
		}
	}

	Test_HostLeave_NotInRoom = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.clientWs1 = new WebSocket(websocketUrl);
				
				this.hostWs.send(JSON.stringify({
					method: 'leaveRoom',
				}));
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'leaveRoomResponse' && data.success) {
					this.teardown(false);
				} else if (data.method == 'leaveRoomResponse') {
					this.teardown(true);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.resolve(success);
		}
	}

	Test_ClientLeave_Success = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.clientWs1 = new WebSocket(websocketUrl);

				this.clientWs1.on('open', () => {
					// 1) find out the target socket's ID
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'randomName',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});

				this.clientWs1.on('message', (msg) => {
					let data = JSON.parse(msg);

					if (data.method == 'joinRoomResponse' && data.success) {
						this.clientWs1.send(JSON.stringify({
							method: 'leaveRoom',
							roomId: roomId,
							displayName: 'newhost boiii'
						}));
					} else if (data.method == 'joinRoomResponse' && !data.success) {
						this.teardown(false);
					} else if (data.method == 'leaveRoomResponse' && data.success) {
						this.teardown(true);
					} else if (data.method == 'leaveRoomResponse' && !data.success) {
						this.teardown(false);
					}
				});

			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse') {
					
					roomId = data.room.id;
					this.clientWs1.send(JSON.stringify({
						method: 'joinRoom',
						roomId: roomId,
						displayName: 'clientboii1'
					}));
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs1.close();
			this.resolve(success);
		}
	}

	Test_ClientLeave_NoRoomId = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {

				this.clientWs1 = new WebSocket(websocketUrl);

				this.clientWs1.on('open', () => {
					// 1) find out the target socket's ID
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'randomName',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});

				this.clientWs1.on('message', (msg) => {
					let data = JSON.parse(msg);

					if (data.method == 'leaveRoomResponse' && !data.success) {
						this.teardown(true);
					} else if (data.method == 'leaveRoomResponse' && data.success) {
						this.teardown(false);
					}
				});
				
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse') {
					this.clientWs1.send(JSON.stringify({
						method: 'leaveRoom'
					}));
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs1.close();
			this.resolve(success);
		}
	}

	Test_ClientLeave_HostNotified = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.clientWs1 = new WebSocket(websocketUrl);

				this.clientWs1.on('open', () => {
					// 1) find out the target socket's ID
					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'randomName',
						sampleRate: 44100,
						nChannels: 2,
						bitDepth: 16,
					}));
				});

				this.clientWs1.on('message', (msg) => {
					let data = JSON.parse(msg);

					if (data.method == 'joinRoomResponse' && data.success) {
						this.clientWs1.send(JSON.stringify({
							method: 'leaveRoom',
							roomId: roomId,
							displayName: 'newhost boiii'
						}));
					} else if (data.method == 'joinRoomResponse' && !data.success) {
						this.teardown(false);
					} else if (data.method == 'leaveRoomResponse' && !data.success) {
						this.teardown(false);
					}
				});
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse') {
					
					roomId = data.room.id;
					this.clientWs1.send(JSON.stringify({
						method: 'joinRoom',
						roomId: roomId,
						displayName: 'clientboii1'
					}));
				} else if (data.method == 'clientLeave') {
					this.teardown(true);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs1.close();
			this.resolve(success);
		}
	}

	Test_ClientDisconnect_ClientsNotified = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {

				this.clientWs1 = new WebSocket(websocketUrl);
				this.clientWs1.on('open', () => {

					this.clientWs2 = new WebSocket(websocketUrl);
					this.clientWs2.on('open', () => {

						// 1) find out the target socket's ID
						this.hostWs.send(JSON.stringify({
							method: 'createRoom',
							displayName: 'randomName',
							sampleRate: 44100,
							nChannels: 2,
							bitDepth: 16,
						}));

						this.clientWs2.on('message', (msg) => {
							let data = JSON.parse(msg);

							if (data.method == 'joinRoomResponse' && data.success) {
								this.clientWs1.close();
							} else if (data.method == 'joinRoomResponse' && !data.success) {
								this.teardown(false);
							} else if (data.method == 'clientLeave') {
								this.teardown(true);
							}
						});
					});


				});

				this.clientWs1.on('message', (msg) => {
					let data = JSON.parse(msg);

					if (data.method == 'joinRoomResponse' && data.success) {
						this.clientWs2.send(JSON.stringify({
							method: 'joinRoom',
							roomId: roomId,
							displayName: 'clientboii2'
						}));
					} else if (data.method == 'joinRoomResponse' && !data.success) {
						this.teardown(false);
					}
				});

			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse') {
					roomId = data.room.id;
					this.clientWs1.send(JSON.stringify({
						method: 'joinRoom',
						roomId: roomId,
						displayName: 'clientboii1'
					}));
				} else if (data.method == 'clientLeave') {
					this.teardown(true);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs1.close();
			this.clientWs2.close();
			this.resolve(success);
		}
	}

	Test_CreateRoom_Fail_NoSampleRate = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.hostWs.send(JSON.stringify({
					method: 'createRoom',
					displayName: 'randomName',
					nChannels: 2,
					bitDepth: 16,
				}));
			});


			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse' && data.success) {
					this.teardown(false);
				} else if (data.method == 'createRoomResponse') {
					this.teardown(true);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.resolve(success);
		}
	}

	Test_AudioDetails_Success = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.hostWs.send(JSON.stringify({
					method: 'createRoom',
					displayName: 'randomName',
					nChannels: 2,
					sampleRate: 44100,
					bitDepth: 16,
				}));
			});


			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse' && !data.success) {
					this.teardown(false);
				} else if (data.method == 'createRoomResponse') {
				
					this.hostWs.send(JSON.stringify({
						sampleRate: 44100,
						nChannels: 2,
						method: 'audioDetails',
						bitDepth: 16,
					}));

				} else if (data.method == 'audioDetailsResponse' && data.success) {
					this.teardown(true);
				} else if (data.method == 'audioDetailsResponse') {
					console.log(msg);
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.resolve(success);
		}
	}

	Test_AudioDetails_Fail_NoSampleRate = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.hostWs.send(JSON.stringify({
					method: 'createRoom',
					displayName: 'randomName',
					nChannels: 2,
					sampleRate: 44100,
					bitDepth: 16,
				}));
			});


			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse' && !data.success) {
					this.teardown(false);
				} else if (data.method == 'createRoomResponse') {
				
					this.hostWs.send(JSON.stringify({
						nChannels: 2,
						method: 'audioDetails',
						bitDepth: 16,
					}));

				} else if (data.method == 'audioDetailsResponse' && data.success) {
					this.teardown(false);
				} else if (data.method == 'audioDetailsResponse') {
					this.teardown(true);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.resolve(success);
		}
	}

	Test_AudioDetails_Fail_NobitDepth = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.hostWs.send(JSON.stringify({
					method: 'createRoom',
					displayName: 'randomName',
					nChannels: 2,
					sampleRate: 44100,
					bitDepth: 16,
				}));
			});


			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'createRoomResponse' && !data.success) {
					this.teardown(false);
				} else if (data.method == 'createRoomResponse') {
				
					this.hostWs.send(JSON.stringify({
						nChannels: 2,
						sampleRate: 44100,
						method: 'audioDetails',
					}));

				} else if (data.method == 'audioDetailsResponse' && data.success) {
					this.teardown(false);
				} else if (data.method == 'audioDetailsResponse') {
					this.teardown(true);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.resolve(success);
		}
	}

	Test_AudioDetails_Fail_NotInARoom = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.hostWs.send(JSON.stringify({
					nChannels: 2,
					sampleRate: 44100,
					method: 'audioDetails',
					bitDepth: 16,
				}));
			});


			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);
				
				if (data.method == 'audioDetailsResponse' && data.success) {
					this.teardown(false);
				} else if (data.method == 'audioDetailsResponse') {
					this.teardown(true);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.resolve(success);
		}
	}

	Test_GetRoom_SuccessAsHost = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.hostWs.send(JSON.stringify({
					method: 'createRoom',
					displayName: 'randomName',
					nChannels: 2,
					sampleRate: 44100,
					bitDepth: 16,
				}));
				
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'createRoomResponse' && !data.success) {
					this.teardown(false);
				} else if (data.method == 'createRoomResponse') {
					this.hostWs.send(JSON.stringify({
						method: 'getRoom',
						roomId: data.room.id
					}));
				} else if (data.method == 'getRoomResponse' && data.success && data.room.host.id) {
					this.teardown(true);
				} else if (data.method == 'getRoomResponse') {
					this.teardown(false);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.resolve(success);
		}
	}

	Test_GetRoom_BadRoomId = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.hostWs.send(JSON.stringify({
					method: 'createRoom',
					displayName: 'randomName',
					nChannels: 2,
					sampleRate: 44100,
					bitDepth: 16,
				}));
				
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'createRoomResponse' && !data.success) {
					this.teardown(false);
				} else if (data.method == 'createRoomResponse') {
					this.hostWs.send(JSON.stringify({
						method: 'getRoom',
						roomId: 'somebullshit'
					}));
				} else if (data.method == 'getRoomResponse' && data.success) {
					this.teardown(false);
				} else if (data.method == 'getRoomResponse') {
					this.teardown(true);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.resolve(success);
		}
	}

	Test_GetRoom_NoRoomId = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {
				this.hostWs.send(JSON.stringify({
					method: 'createRoom',
					displayName: 'randomName',
					nChannels: 2,
					sampleRate: 44100,
					bitDepth: 16,
				}));
				
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'createRoomResponse' && !data.success) {
					this.teardown(false);
				} else if (data.method == 'createRoomResponse') {
					this.hostWs.send(JSON.stringify({
						method: 'getRoom',
					}));
				} else if (data.method == 'getRoomResponse' && data.success) {
					this.teardown(false);
				} else if (data.method == 'getRoomResponse') {
					this.teardown(true);
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.resolve(success);
		}
	}

	Test_GetRoom_ClientNotInRoom_LimitedVisibility = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {

				this.clientWs = new WebSocket(websocketUrl);

				this.clientWs.on('open', () => {

					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'randomName',
						nChannels: 2,
						sampleRate: 44100,
						bitDepth: 16,
					}));

				});

				this.clientWs.on('message', (msg) => {
					let data = JSON.parse(msg);


					if (data.method == 'getRoomResponse' && data.success && data.room.host) {
						this.teardown(false);
					} else if (data.method == 'getRoomResponse' && data.success && data.room.sampleRate) {
						this.teardown(true);
					} else if (data.method) {
						this.teardown(false);
					}
				});
				
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'createRoomResponse' && !data.success) {
					this.teardown(false);
				} else if (data.method == 'createRoomResponse') {
					this.clientWs.send(JSON.stringify({
						method: 'getRoom',
						roomId: data.room.id
					}));
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs.close();
			this.resolve(success);
		}
	}

	Test_GetRoom_ParticipantSuccess = class extends Test {

		init() {
			return new Promise((resolve, reject) => {
				this.hostWs = new WebSocket(websocketUrl);

				this.run();
				this.resolve = resolve;
			});
		}

		run() {
			let roomId;

			this.hostWs.on('open', () => {

				this.clientWs = new WebSocket(websocketUrl);

				this.clientWs.on('open', () => {

					this.hostWs.send(JSON.stringify({
						method: 'createRoom',
						displayName: 'randomName',
						nChannels: 2,
						sampleRate: 44100,
						bitDepth: 16,
					}));

				});

				this.clientWs.on('message', (msg) => {
					let data = JSON.parse(msg);


					if (data.method == 'getRoomResponse' && data.success && data.room.host.id) {
						this.teardown(true);
					} else if (data.method == 'getRoomResponse') {
						this.teardown(false);
					} else if (data.method == 'joinRoomResponse' && data.success) {
						this.clientWs.send(JSON.stringify({
							method: 'getRoom',
							roomId: data.room.id,
						}));
					} else if (data.method == 'joinRoomResponse') {
						this.teardown(false);
					}
				});
				
			});

			this.hostWs.on('message', (msg) => {
				let data = JSON.parse(msg);

				if (data.method == 'createRoomResponse' && !data.success) {
					this.teardown(false);
				} else if (data.method == 'createRoomResponse') {
					this.clientWs.send(JSON.stringify({
						method: 'joinRoom',
						roomId: data.room.id,
						displayName: 'anything'
					}));
				}
			});
		}

		teardown(success) {
			this.hostWs.close();
			this.clientWs.close();
			this.resolve(success);
		}
	}

}

if (require.main === module) {
	let runner = new TestRunner();
	runner.addTestSection(SignalTests);
	runner.run();
}

module.exports = SignalTests;