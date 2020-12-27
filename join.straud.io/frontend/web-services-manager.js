import SignalManager from './signal-manager';
import PeerConnectionManager from './peer-connection-manager';

class WebServicesManager {

	constructor(host, port, useTls, signalCb, roomCb, errorCb, onAudio, dcChangeCb) {
		this._onRemoteDescription = this._onRemoteDescription.bind(this);
		this._onRemoteICECandidate = this._onRemoteICECandidate.bind(this);
		this._onLocalDescription = this._onLocalDescription.bind(this);
		this._onLocalICECandidate = this._onLocalICECandidate.bind(this);
		
		this._onRoomChange = this._onRoomChange.bind(this);
		this._parentOnRoomChange = roomCb;

		this._onSignalChange = this._onSignalChange.bind(this);
		this._parentOnSignalChange = signalCb;

		this.ws = new SignalManager(host, port, useTls, this._onSignalChange, 
			this._onRoomChange, 
			this._onRemoteDescription, 
			this._onRemoteICECandidate, errorCb);

		this.pcm = new PeerConnectionManager(this._onLocalDescription, 
			this._onLocalICECandidate, onAudio, dcChangeCb);
	}

	_onRemoteDescription(sourceId, description) {
		this.pcm.onRemoteDescription(sourceId, description);
	}

	_onRemoteICECandidate(sourceId, candidate) {
		this.pcm.onICECandidate(sourceId, candidate);
	}

	_onLocalDescription(targetId, type, description) {
		this.ws.sendDescription(targetId, type, description);
	}

	_onLocalICECandidate(targetId, mid, candidate) {
		this.ws.sendCandidate(targetId, mid, candidate);
	}

	_onRoomChange(roomState, room) {
		this._parentOnRoomChange(roomState, room);

		if (roomState == 'closed' || roomState == 'exited') this.pcm.closeAll();
	}

	_onSignalChange(previousState, newState) {
		this._parentOnSignalChange(previousState, newState);
	}

	preloadRoom(roomId) {
		this.ws.preloadRoom(roomId);
	}

	closePeerConnections() {
		this.pcm.closeAll();
	}

	closeAll() {
		this.pcm.closeAll();
		this.ws.close();
	}

	getAnalytics() {
		return new Promise(async (resolve, reject) => {
			let signalAnalytics = await this.ws.getAnalytics();
			let peerAnalytics = await this.pcm.report();

			resolve({
				signalAnalytics: signalAnalytics,
				peerAnalytics: peerAnalytics
			});
		});
	}

}

export default WebServicesManager;
