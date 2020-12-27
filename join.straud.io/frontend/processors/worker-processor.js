import AudioProcessor from './audio-processor.js';
import AudioMessage from '../audio-message.js';

class WorkerProcessor extends AudioProcessor {
	constructor(inputSampleRate, outputSampleRate, onProcessedCallback, port) {
		super(inputSampleRate, outputSampleRate, onProcessedCallback);

		this.onProcessed = this.onProcessed.bind(this);

		this.worker = new Worker('worker-processor-worker.js');
		this.worker.onmessage = this.onProcessed;
		this.worker.postMessage({command: 'feed', inputSampleRate: inputSampleRate, outputSampleRate: outputSampleRate});
		this.batchCompletedCb = onProcessedCallback;

		if (port) this.worker.postMessage({command: 'connect'}, [port]);
	}

	processBlock(arrayBuffer) {
		this.worker.postMessage({command: 'feed', data: arrayBuffer}, [arrayBuffer]);
	}

	onProcessed(e) {
		this.batchCompletedCb(e.data);
	}

	name() {
		return 'WorkerProcessor';
	}

	_process(data) {
		let channels = this._copyInterleavedToChannels(data);
		return this._resample(data);
	}
}

export default WorkerProcessor;