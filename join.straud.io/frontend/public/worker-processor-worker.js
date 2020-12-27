let init = false;
let inputSampleRate;
let outputSampleRate;
let backendPort = undefined;

let _resampleFractional = 0;
let _resampleLastSampleData = undefined;

onmessage = function(e) {
	if (e.data.command == 'feed') {
		// the first message we get is initialization
		if (!init) {
			init = true;
			
			inputSampleRate = e.data.inputSampleRate;
			outputSampleRate = e.data.outputSampleRate;
		} else {
			let msg = new AudioMessage(e.data.data);
			let channels = copyInterleavedToChannels(msg.getAudioAsFloat32());
			let resampled = resample(channels);
			let interleaved = copyChannelsToInterleaved(resampled);

			if (backendPort == undefined) {
				postMessage(interleaved, [interleaved.buffer]);
			} else {
				backendPort.postMessage({command: 'feed', data: interleaved}, [interleaved.buffer]);
			}
		}
	} else if (e.data.command == 'connect') {
		backendPort = e.ports[0];
	} else {
		throw 'received unrecognied command';
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

function copyChannelsToInterleaved(channels) {
	let interleaved = new Float32Array(channels[0].length * 2);
	let interleavedPos = 0;

	for (let i = 0; i < channels[0].length; i++) {
		interleaved[interleavedPos++] = channels[0][i];
		interleaved[interleavedPos++] = channels[1][i];
	}

	return interleaved;
}

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          resample()
  This is a pure copy-paste from processors/audio-processor.js
 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
function resample(sampleData) {
	var rate = inputSampleRate,
		channels = 2,
		targetRate = outputSampleRate;

	if (rate == targetRate) return sampleData;
	var newSamples = [];

	// Mind that packet boundaries won't always align on
	// sample boundaries in the resamples output, so maintain
	// a running rounding fractional offset of the portion of
	// a sample we'll have to pull from the previous run on
	// the next one.
	var inputLen = sampleData[0].length,
		previousFractional = _resampleFractional,
		outputLen = inputLen * targetRate / rate + previousFractional,
		outputSamples = Math.floor(outputLen),
		remainingFractional = (outputLen - outputSamples);

	var interpolate;
	if (rate < targetRate) {
		// Input rate is lower than the target rate,
		// use linear interpolation to minimize "tinny" artifacts.
		interpolate = function(input, output, previous, adjustment) {
			var inputSample = function(i) {
				if (i < 0) {
					if (previous && previous.length + i > 0) {
						// Beware sometimes we have empty bits at start.
						return previous[previous.length + i];
					} else {
						// this probably shouldn't happen
						// but if it does be safe ;)
						return input[0];
					}
				} else {
					return input[i];
				}
			};

			for (var i = 0; i < output.length; i++) {
				// Map the output sample to input space,
				// offset by one to give us room to interpolate.
				var j = ((i + 1 - previousFractional) * rate / targetRate) - 1;
				var a = Math.floor(j);
				var b = Math.ceil(j);

				var out;
				if (a == b) {
					out = inputSample(a);
				} else {
					out = inputSample(a) * (b - j) +
					      inputSample(b) * (j - a);
				}

				output[i] = out;
			}
		};
	} else {
		// Input rate is higher than the target rate.
		// For now, discard extra samples.
		interpolate = function(input, output, previous) {
			for (var i = 0; i < output.length; i++) {
				output[i] = input[(i * input.length / output.length) | 0];
			}
		};
	}
	

	for (var channel = 0; channel < channels; channel++) {
		var inputChannel = channel;
		if (channel >= channels) {
			// Flash forces output to stereo; if input is mono, dupe the first channel
			inputChannel = 0;
		}
		var input = sampleData[inputChannel],
			output = new Float32Array(outputSamples),
			previous = _resampleLastSampleData ? _resampleLastSampleData[inputChannel] : undefined;

		interpolate(input, output, previous);

		newSamples.push(output);
	}
	_resampleFractional = remainingFractional;
	_resampleLastSampleData = sampleData;

	return newSamples;
}

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          AUDIO MESSAGE
  This is a pure copy-paste from ../audio-message.js
 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

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
