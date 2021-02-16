import RingBuffer from '../ring-buffer.js';

const State = {
	UNINITIALIZED: 1,
	READY: 2,
	PLAYING: 3,
	STARVED: 4,
	STOPPED: 5,
	MUTED: 6
};
Object.freeze(State);

function writeSilence(outputs) {
	for (let i = 0; i < 2; i++) {
		let channel = outputs[i];

		for (let j = 0; j < 2048; j++) {
			channel[j] = 0;
		}
	}
}

function copyInterleavedToChannels(interleavedData) {
	let channels = [];

	for (let channelNum = 0; channelNum < 2; channelNum++) {
		let channelLen = interleavedData.length / 2;
		channels.push(new Float32Array(channelLen));

		let dataPos = channelNum;
		for (let channelPos = 0; channelPos < channelLen; channelPos++) {
			channels[channelNum][channelPos] = interleavedData[dataPos];
			dataPos += 2;
		}
	}

	return channels;
}

class AudioBackend {
	constructor(ringBufferSize=192000) {
		if (new.target === AudioBackend) {
			throw new TypeError('Can\'t construct AudioBackend directly!');
		}

		this._buffer = new RingBuffer(ringBufferSize, 2);
	}

	push(interleavedFloat32Data) {
		throw Error('push must be implemented!');
	}

	name() {
		throw Error('name must be implemented!');
	}

	getBufferSize() {
		throw Error('getBufferSize must be implemented!');
	}

	getNSamplesBuffered() {
		throw Error('getNSamplesBuffered must be implemented!');
	}

	getNStarved() {
		throw Error('getNStarved must be implemented!');
	}

	subscribeToSilence() {
		throw Error('subscribeToSilence must be implemented!');
	}

	unsubscribeFromSilence() {
		throw Error('unsubscribeFromSilence must be implemented!');
	}

	notifySilence() {
		throw Error('notifySilence must be implemented!');
	}
}

export {
	State,
	AudioBackend,
	writeSilence,
	copyInterleavedToChannels
}