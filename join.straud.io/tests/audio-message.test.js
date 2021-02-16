import AudioMessage from '../../frontend/audio-message.js';

const DTYPE_INT16 = 0;
const DTYPE_FLOAT32 = 1;
const DTYPE_SILENCE = 2;

const INT16_MAX = 32767;

function audioMessage(timestamp, dType, length, data=null) {
	let headers = new Float64Array(3);
	headers[0] = timestamp;
	headers[1] = dType;
	headers[2] = length;

	if (dType == DTYPE_SILENCE) {
		return new AudioMessage(headers.buffer);
	}

	let ArrayType = (dType == DTYPE_INT16) ? Int16Array : Float32Array;

	let makeData = () => {
		let _data = new ArrayType(length);
		for (let i = 0; i < length; i++) {
			_data[i] = i;
		}
		return _data;
	}

	let headerView = new ArrayType(headers.buffer);
	let dataView = (data == null) ? makeData() : data;
	let combinedMessage = new ArrayType(headerView.length + length);

	combinedMessage.set(headerView);
	combinedMessage.set(dataView, headerView.length);
	
	return new AudioMessage(combinedMessage.buffer);
}

test('Creating audio message no buffer throws', () => {
	expect(() => {
		let am = new AudioMessage();
	}).toThrow('must submit an ArrayBuffer');
});

test('Creating audio message with invalid data type throws', () => {
	expect(() => {
		let am = audioMessage(Date.now(), 3, 128);
	}).toThrow('invalid value for dType received');
});

test('expect return data to be correct', () => {
	let data = new Float32Array(128);
	for (let i = 0; i < data.length; i++) {
		data[i] = i;
	}

	let am = audioMessage(Date.now(), DTYPE_FLOAT32, data.length, data);

	expect(JSON.stringify(data)).toBe(JSON.stringify(am.getAudioAsFloat32()));
});

test('expect constructed silent buffer to be correct size', () => {
	let am = audioMessage(Date.now(), DTYPE_SILENCE, 1024);
	expect(am.getAudioAsFloat32().length).toBe(1024);
});

test('expect constructed silent buffer to be all 0\'s', () => {
	let data = new Float32Array(128);
	let am = audioMessage(Date.now(), DTYPE_SILENCE, 128);
	
	expect(JSON.stringify(data)).toBe(JSON.stringify(am.getAudioAsFloat32()));
});

test('expect converted int16 data to be the correct size', () => {
	let am = audioMessage(Date.now(), DTYPE_INT16, 128);
	
	expect(am.getAudioAsFloat32().length).toBe(128);
});

test('expect converted int16 data to be correct in float32 representation', () => {
	let intData = new Int16Array(128);
	for (let i = 0; i < intData.length; i++) {
		if (i % 2 == 0) {
			intData[i] = 0;
		} else {
			intData [i] = INT16_MAX;
		}
	}

	let floatData = new Float32Array(128);
	for (let i = 0; i < floatData.length; i++) {
		if (i % 2 == 0) {
			floatData[i] = 0;
		} else {
			floatData[i] = 1;
		}
	}

	let am = audioMessage(Date.now(), DTYPE_INT16, 128, intData);
	expect(JSON.stringify(floatData)).toBe(JSON.stringify(am.getAudioAsFloat32()));

});