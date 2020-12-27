import RingBuffer from '../ring-buffer.js';
import { State, writeSilence, copyInterleavedToChannels } from '../backends/audio-backend.js';

const DTYPE_INT16 = 0;
const DTYPE_FLOAT32 = 1;
const DTYPE_SILENCE = 2;

const N_CHANNELS = 2;
const PREFILL_SIZE = 4096;
const BUFFER_SIZE = 128;

class WorkletProcessor extends AudioWorkletProcessor {
	constructor(options) {
		super();

		this.port.onmessage = this.onMessage.bind(this);

		this.state = State.READY;
		this.nStarved = 0;
		this.nMessagesReceived = 0;

		this.buffer = new RingBuffer(32768, N_CHANNELS);
	}

	process(inputs, outputs, parameters) {
		let nReadableSamples = this.buffer.getNReadableSamples();

		if (this.state == State.READY && nReadableSamples < PREFILL_SIZE) {
			return true; // prefilling
		} else if (this.state != State.PLAYING && nReadableSamples >= PREFILL_SIZE) {
			this.state = State.PLAYING; // prefill is filled. start playing
		} else if (this.state == State.STARVED && nReadableSamples < PREFILL_SIZE) {
			this.nStarved++;
			writeSilence(outputs[0]);
			return true; // starved and doesn't have enough data. silence.
		} else if (this.state == State.PLAYING && nReadableSamples == 0) {
			this.nStarved++;
			this.state = State.STARVED;
		}

		let channelData = this.buffer.read(BUFFER_SIZE);
		for (let channelNum = 0; channelNum < N_CHANNELS; channelNum++) {
			outputs[0][channelNum].set(channelData[channelNum]);
		}

		return true;
	}

	onMessage(e) {
		if (e.data.command == 'feed') {
			// if (this.durationBuffered >= 0.5) return;

			let interleaved = e.data.data;
			let channels = copyInterleavedToChannels(interleaved, this.nChannels);
			this.buffer.write(channels);

			// occasionally report analytics data;
			this.nMessagesReceived++;
			if (this.nMessagesReceived % 100 == 0) {
				this.port.postMessage({nStarved: this.nStarved, nSamplesBuffered: this.buffer.getNReadableSamples()});
			}
		} else if (e.data.command == 'connect') {
			e.ports[0].onmessage = this.onMessage.bind(this);
		} else {
			throw Error('command not specified');
		}
	}
}

registerProcessor('audio-processor', WorkletProcessor);