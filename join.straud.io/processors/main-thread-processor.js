import AudioProcessor from './audio-processor.js';
import AudioMessage from '../audio-message.js';

// All modern-ish browsers support web workers; this class will probably never be used in practice
class MainThreadProcessor extends AudioProcessor {
	constructor(inputSampleRate, outputSampleRate, onProcessedCallback, port) {
		super(inputSampleRate, outputSampleRate, onProcessedCallback);

		this.port = port;
		this.mono = false;
	}

	processBlock(audioBuffer) {
		let msg = new AudioMessage(audioBuffer);

		let processed;
		if (this.mono) {
			processed = this._processStereoToMono(msg.getAudioAsFloat32());
		} else {
			processed = this._processStereo(msg.getAudioAsFloat32());
		}

		if (this.port === undefined) {
			this.onProcessedCallback(processed);
		} else {
			this.port.postMessage({command: 'feed', data: processed}, [processed.buffer]);
		}
	}

	name() {
		return 'MainThreadProcessor';
	}

	setMono(mono) {
		this.mono = mono;
	}

	_processStereo(data) {
		let channels = this._copyInterleavedToChannels(data);
		let resampled =  this._resample(channels);
		return this._copyChannelsToInterleaved(resampled);
	}

	_processStereoToMono(data) {
		let channels = this._copyInterleavedToChannels(data);
		let resampled =  this._resample(channels);

		// "interleavedDualMono" means that it's dual mono in an "interleaved" format :)
		let interleavedDualMono = new Float32Array(resampled[0].length * 2);		
		let resampledPos = 0;
		for (let i = 0; i < interleavedDualMono.length; i += 2) {
			interleavedDualMono[i] = (resampled[0][resampledPos] + resampled[1][resampledPos]) * .5;
			interleavedDualMono[i + 1] = (resampled[0][resampledPos] + resampled[1][resampledPos]) * .5;

			resampledPos++;
		}

		return interleavedDualMono;
	}
}

export default MainThreadProcessor;