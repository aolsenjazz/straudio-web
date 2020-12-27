/**
 Sent as second part of header. Informs clients of how to transform data
 */
const DTYPE_INT16 = 0;
const DTYPE_FLOAT32 = 1;
const DTYPE_SILENCE = 2;

const INT16_MAX = 32767;

class AudioMessage {
	constructor(arrayBuffer) {
		if (arrayBuffer === undefined) throw Error('must submit an ArrayBuffer');

		// constructor for some reason throws if length method param == arrayBuffer.byteLength
		if (arrayBuffer.byteLength == 24) {
			this.headers = new Float64Array(arrayBuffer);
		} else {
			this.headers = new Float64Array(arrayBuffer, 0 , 24);
		}

		if (this.headers[1] == DTYPE_FLOAT32) {
			this._audio = new Float32Array(arrayBuffer, 24);
		} else if (this.headers[1] == DTYPE_INT16) {
			this._audio = new Int16Array(arrayBuffer, 24);
		} else if (this.headers[1] == DTYPE_SILENCE) {
			// noop
		} else {
			throw Error('invalid value for dType received');
		}
	}

	getDType() {
		if (this.headers[1] == DTYPE_INT16) {
			return DTYPE_INT16;
		} else if (this.headers[1] == DTYPE_FLOAT32) {
			return DTYPE_FLOAT32;
		} else if (this.headers[1] == DTYPE_SILENCE) {
			return DTYPE_SILENCE;
		} else {
			throw Error(`Header was unexpected value[${this.headers[1]}]`);
		}
	}

	getSampleLength() {
		return this.headers[2];
	}

	getTimestamp() {
		return this.headers[0];
	}

	getAudioAsFloat32() {
		if (this.getDType() == DTYPE_FLOAT32) {
			return this._audio;
		} else if (this.getDType() == DTYPE_INT16) {
			return int16ToFloat32(this._audio);
		} else if (this.getDType() == DTYPE_SILENCE) {
			return new Float32Array(this.getSampleLength());
		}
	}
}

function int16ToFloat32(input) {
	let float32 = new Float32Array(input.length);
	for (let i = 0; i < input.length; i++) {
		float32[i] = input[i] / INT16_MAX;
	}
	return float32;
}

export default AudioMessage;