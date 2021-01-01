import RingBuffer from '../straudio-shared/player/ring-buffer.js';
import { State, writeSilence, copyInterleavedToChannels } from '../straudio-shared/player/backends/audio-backend.js';

const DTYPE_INT16 = 0;
const DTYPE_FLOAT32 = 1;
const DTYPE_SILENCE = 2;

const N_CHANNELS = 2;
const BUFFER_SIZE = 128;

class WorkletProcessor extends AudioWorkletProcessor {
	constructor(options) {
		super();

		this.port.onmessage = this.onMessage.bind(this);

		this.prefillSize = 22050;
		this.silentCount = 0;
		this.state = State.READY;
		this.nStarved = 0;
		this.nMessagesReceived = 0;

		this.buffer = new RingBuffer(1000000, N_CHANNELS);
	}

	process(inputs, outputs, parameters) {
		let nReadableSamples = this.buffer.getNReadableSamples();
		
		if (this.state !== State.STARVED && nReadableSamples < this.prefillSize) {
			return true; // prefilling
		} else if (this.state != State.PLAYING && nReadableSamples >= this.prefillSize) {
			this.state = State.PLAYING; // prefill is filled. start playing
		} else if (this.state == State.STARVED && nReadableSamples < this.prefillSize) {
			this.nStarved++;
			writeSilence(outputs[0]);
			this.checkSilence(outputs);
			return true; // starved and doesn't have enough data. silence.
		} else if (this.state == State.PLAYING && nReadableSamples == 0) {
			this.nStarved++;
			this.state = State.STARVED;
		}

		let channelData = this.buffer.read(BUFFER_SIZE);
		for (let channelNum = 0; channelNum < N_CHANNELS; channelNum++) {
			outputs[0][channelNum].set(channelData[channelNum]);
		}

		this.checkSilence(outputs);

		return true;
	}

	onMessage(e) {
		if (e.data.command == 'feed') {
			let interleaved = e.data.data;
			let channels = copyInterleavedToChannels(interleaved, this.nChannels);
			this.buffer.write(channels);

			this.nMessagesReceived++;
		} else if (e.data.command == 'connect') {
			e.ports[0].onmessage = this.onMessage.bind(this);
		} else if (e.data.command === 'prefillSize') {
			this.setPrefillSize(e.data.prefillSize);
		} else {
			throw Error('command not specified');
		}
	}

	setPrefillSize(prefillSize) {
		let shouldTrim = prefillSize < this.prefillSize;

		this.prefillSize = prefillSize;
		
		if (shouldTrim) {
			this.buffer.advanceReadPosition(this.buffer.getNReadableSamples() - prefillSize);
		}
	}

	notifySilence() {
		let silent = this.silentCount >= 300;
			
		this.port.postMessage({command: 'reportSilence', silent: silent});
	}

	checkSilence(outs) {
		if (outs[0][0][0] === 0) {
			if (this.silentCount === 300) this.notifySilence();
			this.silentCount++;
		} else {
			if (this.silentCount >= 300) {
				this.silentCount = 0;
				this.notifySilence();
			}
		}
	}
}

registerProcessor('audio-processor', WorkletProcessor);