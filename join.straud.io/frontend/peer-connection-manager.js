class PeerConnectionManager {

	constructor(localDescriptionCallback, localCandidateCallback, onAudio, dcChangeCb) {
		this._localDescriptionCallback = localDescriptionCallback;
		this._localCandidateCallback = localCandidateCallback;
		this._onAudio = onAudio;
		this._dcChangeCb = dcChangeCb;

		this.initiatePeerConnection = this.initiatePeerConnection.bind(this);
		this.onRemoteDescription = this.onRemoteDescription.bind(this);
		this.onICECandidate = this.onICECandidate.bind(this);
		this.report = this.report.bind(this);
		this.candidateStats = this.candidateStats.bind(this);

		this.pcMap = new Map();
		this.dcMap = new Map();

		this.timestamp;
		this.messagesReceived = 0;

		this._config = {
			iceServers: [{
				urls: 'stun:stun.l.google.com:19302',
			}],
		};
	}

	initiatePeerConnection(targetId) {
		const pc = new RTCPeerConnection(this._config);
		this.pcMap.set(targetId, pc);

		pc.onconnectionstatechange = () => console.log(`Connection state: ${pc.connectionState}`);
		pc.onicegatheringstatechange = () => console.log(`Gathering state: ${pc.iceGatheringState}`);
		pc.onicecandidate = (e) => {
			if (e.candidate) {
				this._localCandidateCallback(targetId, e.candidate.sdpMid, e.candidate.candidate);
			}
		};
		pc.ondatachannel = (e) => {
			let dc = e.channel;

			this.dcMap.set(targetId, dc);
		
			dc.binaryType = 'arraybuffer'; // Firefox defaults to interpreting messages as Blob type

			dc.onopen = () => {
				console.log('DataChannel open')
				this._dcChangeCb('open');
				this.timestamp = new Date().getTime();
			};

			dc.onclose = () => {
				console.log('DataChannel closed');
				this._dcChangeCb('closed');
			};

			dc.onclosing = () => {
				console.log('DataChannel closing');
			}

			dc.onerror = () => {
				console.log('DataChannel onerror');
			}

			/**
			Each message has a 3-double-long header with the format
			timestamp = e.data[0]
			dtype = e.data[1]
			dataLength = e.data[2]
			body = e.data[3:e.data.length]
			*/
			dc.onmessage = (e) => {
				this._onAudio(e.data);
			};
		};

		return pc;
	}

	onRemoteDescription(sourceId, description) {
		let pc = this.pcMap.get(sourceId);

		pc.setRemoteDescription({
			sdp: description.description,
			type: description.type,
		}).then(() => {
			console.log('Remote description added!');

			pc.createAnswer()
				.then((answer) => pc.setLocalDescription(answer))
				.then(() => {
					const { sdp, type } = pc.localDescription;
					this._localDescriptionCallback(sourceId, type, sdp);
				});
		}).catch((e) => {
			console.error(`Error adding remoteDescription[${e}]`);
		});
	}

	onICECandidate(sourceId, candidate) {
		let pc = this.pcMap.get(sourceId);

		pc.addIceCandidate({
			candidate: candidate.candidate,
			sdpMLineIndex: candidate.mid,
		}).then(() => {
			console.log('Remote candidate added!');
		}).catch((e) => {
			console.error(`Error adding remoteCandidate[${e}]`);
		});
	}

	closeAll() {
		for (let dc of Array.from(this.dcMap.values())) { dc.close(); }
		for (let pc of Array.from(this.pcMap.values())) { pc.close(); }

		this.dcMap.clear();
		this.pcMap.clear();

		console.log('Closed and cleared all WebRTC connections');
	}

	async report() {
		if (this.pcMap.size > 0) {
			let now = new Date().getTime();
			let candStats = await this.candidateStats();
			
			return {
				bytesReceived: candStats.bytesReceived,
				rps: this.messagesReceived / ((now - this.timestamp) / 1000),
				bps: candStats.bytesReceived / ((now - this.timestamp) / 1000)
			}
		} else {
			return;
		}
	}

	candidateStats() {
		return new Promise((resolve, reject) => {
			let pc = Array.from(this.pcMap.values())[0];
			let stats = pc.getStats(null)
				.then(stats => {
					stats.forEach(report => {
						if (report.type == 'candidate-pair' && report.nominated && report.state == 'succeeded') {
							resolve(report);
						}
					});
				});
		});
	}

}

export default PeerConnectionManager;
