class SignalManager {

	constructor(host, port, useTls, signalChangeCb, roomCb, descriptionCb, candidateCb, errorCb) {
		let url = `${useTls === true ? 'wss://' : 'ws://'}${host}:${port}`;
		console.log(url);

		this._heartbeatTimer = null;

		this._url = url;
		this._ws = null;
		this._signalChangeCb = signalChangeCb;
		this._roomCb = roomCb;
		this._descriptionCb = descriptionCb;
		this._candidateCb = candidateCb;
		this._errorCb = errorCb;

		this._signalState = 'closed';
		this._room = null;
		this._displayName;

		this.connect = this.connect.bind(this);
		this._onOpen = this._onOpen.bind(this);
		this._onClose = this._onClose.bind(this);
		this._onMessage = this._onMessage.bind(this);
		this._onError = this._onError.bind(this);

		this.setRoomState = this.setRoomState.bind(this);
		this.setSignalState = this.setSignalState.bind(this);
		this.preloadRoom = this.preloadRoom.bind(this);
	}

	connect(url) {
		this._ws = new WebSocket(this._url);
		this._ws.onerror = this._onError;
		this._ws.onopen = this._onOpen;
	}

	_onMessage(msg) {
		let data;
		try { data = JSON.parse(msg.data); }
		catch (e) { console.warn(`Unable to parse WS message[${msg}]`); return; }

		switch (data.method) {
			case 'joinRoomResponse':
				if (data.success === true) this.setRoomState(data.room);
				else this._errorCb('user', data.error);
				break;
			case 'leaveRoomResponse':
				if (data.success === true) this.setRoomState(data.room);
				else this._errorCb('critical', data.error);
				break;
			case 'rejoinRoomResponse':
			case 'getRoomResponse':
				if (data.success === true) this.setRoomState(data.room);
				break;
			case 'clientLeave':
			case 'clientJoin':
			case 'audioDetails':
			case 'hostLeave':
			case 'roomClose':
				this.setRoomState(data.room);
				break;
			case 'descriptionResponse':
			case 'candidateResponse':
				if (!data.success) console.warn(`Error transmitting rtc data[${data.error}]`);
				break;
			case 'candidate':
				this._candidateCb(data.sourceId, data.candidate);
				break;
			case 'description':
				this._descriptionCb(data.sourceId, data.description);
				break;
			case 'bufferReset':
				// we were clearing the audio buffer, but that seems ridiculous
				break;
			case 'analytics':
				this._onAnalytics(data.report);
				break;
			default:
				console.warn(`Unknown method[${data.method}]`);
		}
	}

	/**
	 * If this is called while client doesn't have internet connectivity, the WS won't be "closed"
	 * as it's unable to send the close-message to the server. It will hang on WebSocket.CLOSING, so onclose() will
	 * never fire, but that *should* be fine. Once internet connectivity is regained, onclose() will fire.
	 */
	close() {
		this._ws.close();
	}

	setRoomState(room) {
		this._roomCb(room);
		this._room = room;
	}

	setSignalState(newState) {
		this._signalChangeCb(this._signalState, newState);
		this._signalState = newState;
	}

	_onOpen() {
		this.setSignalState('open');

		this._ws.onmessage = this._onMessage;
		this._ws.onclose = this._onClose;
	}

	_onClose() {
		this.setSignalState('closed');
	}

	_onError(e) {
		if (this._signalState == 'closed' || this._signalState == 'timeout') {
			this._errorCb('critical', 'Straudio servers are down right now. Sorry.');
		}
	}

	joinRoom(roomId, displayName, rejoin=false) {
		this._ws.send(JSON.stringify({
			method: rejoin ? 'rejoinRoom' : 'joinRoom',
			roomId: roomId,
			displayName: displayName,
			host: false
		}));
	}

	leaveRoom() {
		this._ws.send(JSON.stringify({
			method: 'leaveRoom'
		}));
	}

	sendDescription(targetId, type, description) {
		this._ws.send(JSON.stringify({
			method: 'description',
			description: {
				type: type,
				description: description
			},
			targetId: targetId
		}));

		console.log(`Sent local description to Client[${targetId}]`);
	}

	sendCandidate(targetId, mid, candidate) {
		this._ws.send(JSON.stringify({
			method: 'candidate',
			candidate: {
				mid: mid,
				candidate: candidate
			},
			targetId: targetId
		}));

		console.log(`Sent local candidate to Client[${targetId}]`);
	}

	getAnalytics() {
		return new Promise((resolve, reject) => {
			this.resolveAnalytics = resolve;

			this._ws.send(JSON.stringify({ method: 'analytics' }));
		});
	}

	_onAnalytics(report) {
		this.resolveAnalytics(report);
	}

	/**
	Attempt to preload room details so that we can initialize the audio player before user clicks "Join".
	Websocket may not be open by the time the user types in room key. setInterval to be safe.
	*/
	preloadRoom(roomId) {
		let id = setInterval(() => {
			if (this._ws && this._ws.readyState === WebSocket.OPEN) {

				this._ws.send(JSON.stringify({
					method: 'getRoom',
					roomId: roomId
				}));

				clearInterval(id);
			}
		}, 100);
	}
}

export default SignalManager;
