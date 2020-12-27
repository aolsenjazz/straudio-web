import { AudioBackend, State, copyInterleavedToChannels, writeSilence } from './audio-backend.js';

const PREFILL_SIZE = 4096;

class ScriptProcessorBackend extends AudioBackend {
	constructor(context, output, bufferSize) {
		super();

		this.playNext = this.playNext.bind(this);

		let processor = context.createScriptProcessor(bufferSize, 0, 2);
		this.processor = processor;
		this.processor.addEventListener('audioprocess', this.playNext);
		this.processor.connect(output);

		this.state = State.READY;
		this.bufferSize = bufferSize;
		this.sampleRate = context.sampleRate;

		this.nStarved = 0;
		this.nBufferUnderread = 0;
		this.nSamplesRead = 0;
		this.underreadCheckpoint;
	}

	push(interleavedFloat32Data) {
		this._buffer.write(interleavedFloat32Data, true);
	}

	name() {
		return 'ScriptProcessorBackend';
	}

	getBufferSize() {
		return this.bufferSize;
	}

	getNSamplesBuffered() {
		return this._buffer.getNReadableSamples();
	}

	getNStarved() {
		return this.nStarved;
	}

	getNUnderreads() {
		return this.nBufferUnderread;
	}

	playNext(audioProcessingEvent) {
		let outs = Array.apply(null, Array(2)).map((x, i) => { return audioProcessingEvent.outputBuffer.getChannelData(i) });
		let nReadableSamples = this._buffer.getNReadableSamples();

		if (this.state == State.READY && nReadableSamples < PREFILL_SIZE) {
			return; // prefilling
		} else if (this.state != State.PLAYING && nReadableSamples >= PREFILL_SIZE) {
			this.underreadCheckpoint = Date.now();
			this.state = State.PLAYING; // prefill is filled. start playing
		} else if (this.state == State.STARVED && nReadableSamples < PREFILL_SIZE) {
			this.nStarved++;	
			writeSilence(outs);
			return; // starved and doesn't have enough data. silence.
		} else if (this.state == State.PLAYING && nReadableSamples == 0) {
			this.nStarved++;
			this.state = State.STARVED; // we've run out of audio to play
		}

		this.calculateUnderreads();

		this._buffer.readInto(outs, this.bufferSize);
		this.nSamplesRead += this.bufferSize;
	}

	calculateUnderreads() {
		let nSecondsPassed = (Date.now() - this.underreadCheckpoint) / 1000;
		let expectedNSamplesRead = Math.floor(nSecondsPassed * this.sampleRate);
		if (this.nSamplesRead < expectedNSamplesRead) {
			this.underreadCheckpoint = Date.now();
			this.nSamplesRead = 0;
			this.nBufferUnderread++;
		}
	}
}

export default ScriptProcessorBackend;