class Validator {

	constructor(roomMap, socketGetter) {
		this._rooms = roomMap;
		this._socketGetter = socketGetter;
	}

	validate(socket, data) {
		if      (data.method === 'createRoom')  return this.createRoom(socket, data);
		else if (data.method === 'joinRoom')    return this.joinRoom(socket, data);
		else if (data.method === 'rejoinRoom')  return this.rejoinRoom(socket, data);
		else if (data.method === 'deleteRoom')  return this.deleteRoom(socket, data);
		else if (data.method === 'leaveRoom')   return this.leaveRoom(socket, data);
		else if (data.method === 'description') return this.sendDescription(socket, data);
		else if (data.method === 'candidate')   return this.sendCandidate(socket, data);
		else if (data.method === 'audioDetails') return this.audioDetails(socket, data);
		else if (data.method === 'getRoom')     return this.getRoom(socket, data);
		else if (data.method === 'bufferReset') return this.bufferReset(socket, data);
		return this.validationResult(socket, data, false, null);
	}

	validationResult(socket, data, error, errorMsg) {
		let room = null;
		if (socket.roomId) {
			room = this._rooms.get(socket.roomId);
			room.joined = true;
		}

		let client = {id: socket.id};
		if (socket.displayName) {
			client.displayName = socket.displayName;
		} else if (data.displayName) {
			client.displayName = data.displayName;
		}

		data.room = room;
		data.client = client;

		return {
			error: error,
			errorMsg: errorMsg
		}
	}

	getRoom(socket, data) {
		if (data.roomId === undefined) {
			return this.validationResult(socket, data, true, 'You must enter a room id.');
		}

		if (!Array.from(this._rooms.keys()).includes(data.roomId)) {
			return this.validationResult(socket, data, true, 'That room doesn\'t exist');
		}

		return this.validationResult(socket, data, false);
	}

	createRoom(socket, data) {
		if (data.sampleRate === undefined) {
			return this.validationResult(socket, data, true, 'You must enter a sample rate.');
		}

		if (data.bitDepth === undefined) {
			return this.validationResult(socket, data, true, 'You must specify a data type.');
		}

		return this.validationResult(socket, data, false);
	}

	joinRoom(socket, data) {
		if (data.roomId === undefined) {
			return this.validationResult(socket, data, true, 'You must enter a room ID.');
		}

		if (!Array.from(this._rooms.keys()).includes(data.roomId)) {
			return this.validationResult(socket, data, true, 'That room doesn\'t exist');
		}

		return this.validationResult(socket, data, false);
	}

	rejoinRoom(socket, data) {
		if (data.roomId === undefined) {
			return this.validationResult(socket, data, true, 'You must enter a room ID.');
		}

		if (!Array.from(this._rooms.keys()).includes(data.roomId)) {
			return this.validationResult(socket, data, true, 'That room doesn\'t exist');
		}

		if (data.host === undefined) {
			return this.validationResult(socket, data, true, 'You must specify hostiness.');
		}

		if (this._rooms.get(data.roomId).host) {
			return this.validationResult(socket, data, true, 'There is already a host in the room.');	
		}

		return this.validationResult(socket, data, false);
	}

	deleteRoom(socket, data) {
		if (data.roomId === undefined) {
			return this.validationResult(socket, data, true, 'You must enter a room ID.');
		}

		if (!Array.from(this._rooms.keys()).includes(data.roomId)) {
			return this.validationResult(socket, data, true, 'That room doesn\'t exist');
		}

		let room = this._rooms.get(data.roomId);

		if (socket.id != room.host.id) {
			return this.validationResult(socket, data, true, 'Only the host can close the room;');
		}

		return this.validationResult(socket, data, false);
	}

	leaveRoom(socket, data) {
		if (socket.roomId === undefined) {
			return this.validationResult(socket, data, true, 'You are not in a room.');
		}

		if (!Array.from(this._rooms.keys()).includes(socket.roomId)) {
			return this.validationResult(socket, data, true, 'That room doesn\'t exist.');
		}

		return this.validationResult(socket, data, false);
	}

	sendDescription(socket, data) {
		if (data.targetId === undefined) {
			return this.validationResult(socket, data, true, 'Must submit a target id.');
		}

		let targetSocket = this._socketGetter(data.targetId);

		if (targetSocket === undefined) {
			return this.validationResult(socket, data, true, 'Target doesn\'t exist.');
		}

		if (data.description === undefined) {
			return this.validationResult(socket, data, true, 'Must submit a description.');
		}

		return this.validationResult(socket, data, false);
	}

	sendCandidate(socket, data) {
		if (data.targetId === undefined) {
			return this.validationResult(socket, data, true, 'Must submit a target id.');
		}

		let targetSocket = this._socketGetter(data.targetId);

		if (targetSocket === undefined) {
			return this.validationResult(socket, data, true, 'Target doesn\'t exist.');
		}

		if (data.candidate === undefined) {
			return this.validationResult(socket, data, true, 'Must submit a candidate.');
		}

		return this.validationResult(socket, data, false);
	}

	audioDetails(socket, data) {
		if (data.sampleRate === undefined) {
			return this.validationResult(socket, data, true, 'Must submit a sample rate.');
		}

		if (data.bitDepth === undefined) {
			return this.validationResult(socket, data, true, 'Must submit a bitDepth.');
		}

		if (socket.roomId === undefined) {
			return this.validationResult(socket, data, true, 'You are not in a room.');
		}

		if (!Array.from(this._rooms.keys()).includes(socket.roomId)) {
			return this.validationResult(socket, data, true, 'You are in a room which doesn\'t exist. How did you do that?');
		}

		let room = this._rooms.get(socket.roomId);

		if (socket.id != room.host.id) {
			return this.validationResult(socket, data, true, 'Only the host can set the audio stream settings');
		}

		return this.validationResult(socket, data, false);
	}

	bufferReset(socket, data) {
		return this.validationResult(socket, data, false);
	}



}

module.exports = Validator;