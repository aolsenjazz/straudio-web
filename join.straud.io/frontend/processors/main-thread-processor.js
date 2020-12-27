import AudioProcessor from './audio-processor.js';
import AudioMessage from '../audio-message.js';

class MainThreadProcessor extends AudioProcessor {
	constructor(inputSampleRate, outputSampleRate, onProcessedCallback, port) {
		super(inputSampleRate, outputSampleRate, onProcessedCallback);

		this.port = port;
	}

	processBlock(audioBuffer) {
		let msg = new AudioMessage(audioBuffer);
		let processed = this._process(msg.getAudioAsFloat32());

		if (this.port === undefined) {
			this.onProcessedCallback(processed);
		} else {
			this.port.postMessage({command: 'feed', data: processed}, [processed.buffer]);
		}
	}

	name() {
		return 'MainThreadProcessor';
	}

	_process(data) {
		let channels = this._copyInterleavedToChannels(data);
		let resampled =  this._resample(channels);
		return this._copyChannelsToInterleaved(resampled);
	}
}

export default MainThreadProcessor;