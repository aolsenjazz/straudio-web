import { writeSilence, copyInterleavedToChannels, copyChannelsToInterleaved } from '../../frontend/audio-util.js';

test('writeSilence writes correct mono data', () => {
	let mono = new Float32Array(128);
	for (let i = 0; i < mono.length; i++) {
		mono[i] = i;
	}

	let correct = new Float32Array(128);
	writeSilence(mono, true)
	expect(JSON.stringify(mono)).toBe(JSON.stringify(correct));
});

test('writeSilence writes correct data to stereo channels', () => {
	let stereo = [new Float32Array(128), new Float32Array(128)];
	for (let i = 0; i < stereo[0].length; i++) {
		stereo[0][i] = i;
		stereo[1][i] = i;
	}

	let correct = JSON.stringify([new Float32Array(128), new Float32Array(128)]);
	writeSilence(stereo)
	expect(JSON.stringify(stereo)).toBe(correct);
});

test('copyInterleavedToChannels copies data correct', () => {
	let interleaved = new Float32Array(256);
	let stereo = [new Float32Array(128), new Float32Array(128)];
	let correct = [new Float32Array(128), new Float32Array(128)];

	let interleavedVal = 0;
	for (let i = 0; i < interleaved.length; i++) {
		if (i!= 0 && i % 2 == 0) interleavedVal++;
		interleaved[i] = interleavedVal;
		
	}

	for (let i = 0; i < correct[0].length; i++) {
		correct[0][i] = i;
		correct[1][i] = i;
	}

	copyInterleavedToChannels(interleaved, stereo)
	expect(JSON.stringify(stereo)).toBe(JSON.stringify(correct));
});

test('copyInterleavedToChannels fails if channel lengths are bad', () => {
	let interleaved = new Float32Array(257);
	let stereo = [new Float32Array(128), new Float32Array(128)];

	expect(() => {
		copyInterleavedToChannels(interleaved, stereo);
	}).toThrow('incorrect channel lengths');
});

test('copyChannelsToInterleaved copies data correct', () => {
	let interleaved = new Float32Array(256);
	let stereo = [new Float32Array(128), new Float32Array(128)];
	let correct = new Float32Array(256);

	let correctVal = 0;
	for (let i = 0; i < interleaved.length; i++) {
		if (i != 0 && i % 2 == 0) correctVal++;
		correct[i] = correctVal;
	}

	for (let i = 0; i < stereo[0].length; i++) {
		stereo[0][i] = i;
		stereo[1][i] = i;
	}

	copyChannelsToInterleaved(stereo, interleaved)
	expect(JSON.stringify(interleaved)).toBe(JSON.stringify(correct));
});

test('copyChannelsToInterleaved fails if channel lengths are bad', () => {
	let interleaved = new Float32Array(257);
	let stereo = [new Float32Array(128), new Float32Array(128)];


	expect(() => {
		copyChannelsToInterleaved(stereo, interleaved);
	}).toThrow('incorrect channel lengths');
});

