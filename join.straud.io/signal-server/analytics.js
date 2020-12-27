const FixedQueue = require('./FixedQueue');

class Analytics {

	constructor(getNRooms, getNClients) {
		this._getNRooms = getNRooms;
		this._getNClients = getNClients;

		this.incomingRequests = new FixedQueue(1000);
		this.outgoingRequests = new FixedQueue(1000);

		this.incomingRequest = this.incomingRequest.bind(this);
		this.outgoingRequest = this.outgoingRequest.bind(this);
		this.report = this.report.bind(this);
	}


	incomingRequest(msg) {
		let size = Buffer.byteLength(msg, 'utf8');
		let time = new Date().getTime();

		this.incomingRequests.unshift({
			size: size,
			time: time
		});
	}

	outgoingRequest(msg) {
		let size = Buffer.byteLength(msg, 'utf8');
		let time = new Date().getTime();

		this.outgoingRequests.unshift({
			size: size,
			time:time
		});
	}

	report() {
		let currentTime = new Date().getTime();
		let r = {
			nRooms: this._getNRooms(),
			nClients: this._getNClients(),
			incoming: {},
			outgoing: {}
		};

		if (this.incomingRequests.length > 0) {
			// incoming request information
			let oldestIncoming = this.incomingRequests[this.incomingRequests.length - 1];

			let incomingTimeframe = currentTime - oldestIncoming.time;
			let incomingReqPerSec = this.incomingRequests.length / (incomingTimeframe / 1000);

			let bwps = this.incomingRequests.map(req => req.size).reduce((accum, current) => accum + current) / (incomingTimeframe / 1000);

			r.incoming.timeframe = incomingTimeframe;
			r.incoming.rps = incomingReqPerSec;
			r.incoming.bandwidth = bwps;
		}

		if (this.outgoingRequests.length > 0) {
			// outgoing request information
			let oldestOutgoing = this.outgoingRequests[this.outgoingRequests.length - 1];

			let outgoingTimeframe = currentTime - oldestOutgoing.time;
			let outgoingReqPerSec = this.outgoingRequests.length / (outgoingTimeframe / 1000);

			let bwps = this.outgoingRequests.map(req => req.size).reduce((accum, current) => accum + current) / (outgoingTimeframe / 1000);

			r.outgoing.timeframe = outgoingTimeframe;
			r.outgoing.rps = outgoingReqPerSec;
			r.outgoing.bandwidth = bwps;
		}
		
		return r;
	}
}

module.exports = Analytics;