import { AudioBackend, State, copyInterleavedToChannels, writeSilence } from './audio-backend.js';

const SILENCE_THRESHOLD = 30; // 30 reads of silent buffers (2048 samples each, probably) = "silence"

class ScriptProcessorBackend extends AudioBackend {
	constructor(context, output, bufferSize, prefillSize) {
		super();

		this.playNext = this.playNext.bind(this);

		this.silenceSubscriptions = new Map();

		let processor = context.createScriptProcessor(bufferSize, 0, 2);
		this.processor = processor;
		this.processor.addEventListener('audioprocess', this.playNext);
		this.processor.connect(output);

		this.state = State.READY;
		this.bufferSize = bufferSize;
		this.sampleRate = context.sampleRate;
		this.prefillSize = prefillSize;

		this.silentCount = 0;
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

	setPrefillSize(prefillSize) {
		let shouldTrim = prefillSize < this.prefillSize;

		this.prefillSize = prefillSize;
		
		if (shouldTrim) {
			this._buffer.advanceReadPosition(this._buffer.getNReadableSamples() - prefillSize);
		}
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

	subscribeToSilence(cb) {
		let id = Math.random().toString(36).substring(7); // random string
		
		this.silenceSubscriptions.set(id, cb);
		this.notifySilence();

		return id;
	}

	unsubscribeFromSilence(id) {
		this.silenceSubscriptions.delete(id);
	}

	notifySilence() {
		this.silenceSubscriptions.forEach((value, key, map) => {
			value(this.silentCount >= SILENCE_THRESHOLD);
		});
	}

	playNext(audioProcessingEvent) {
		let outs = Array.apply(null, Array(2)).map((x, i) => { return audioProcessingEvent.outputBuffer.getChannelData(i) });
		let nReadableSamples = this._buffer.getNReadableSamples();
		this.checkSilence(outs);

		if (this.state != State.STARVED && nReadableSamples < this.prefillSize) {
			return; // prefilling
		} else if (this.state != State.PLAYING && nReadableSamples >= this.prefillSize) {
			this.underreadCheckpoint = Date.now();
			this.state = State.PLAYING; // prefill is filled. start playing
		} else if (this.state == State.STARVED && nReadableSamples < this.prefillSize) {
			this.nStarved++;
			writeSilence(outs);
			return; // starved and doesn't have enough data. silence.
		} else if (this.state == State.PLAYING && nReadableSamples == 0) {
			this.nStarved++;
			this.state = State.STARVED; // we've run out of audio to play
		}

		this._buffer.readInto(outs, this.bufferSize);

		this.nSamplesRead += this.bufferSize;
	}

	checkSilence(outs) {
		if (outs[0][0] === 0) {
			if (this.silentCount === SILENCE_THRESHOLD) this.notifySilence();
			this.silentCount++;
		} else {
			if (this.silentCount >= SILENCE_THRESHOLD) {
				this.silentCount = 0;
				this.notifySilence();
			}
		}
	}
}

export default ScriptProcessorBackend;