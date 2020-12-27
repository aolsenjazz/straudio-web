const fs = require('fs');

let sampleRate = 44100;
let nChannels = 2;
let durationSeconds = 3;

let data = new Float32Array(sampleRate * nChannels * durationSeconds);

for (channelOffset = 0; channelOffset < nChannels; channelOffset++) {

	let j = 0;
	while(j < sampleRate * nChannels * durationSeconds) {
		let currentSample = j + channelOffset;

		if (currentSample > 44100 && currentSample < 44200) {
			data[currentSample] = 1;
		} else {
			data[currentSample] = 0;
		}

		j += nChannels;
	}

}

const buf = Buffer.from(data.buffer);
fs.appendFileSync('result.raw', buf);