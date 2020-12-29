import MainThreadProcessor from './processors/main-thread-processor.js';
import WorkerProcessor from './processors/worker-processor.js';

import ScriptProcessorBackend from './backends/script-processor-backend.js';
import WorkletBackend from './backends/worklet-backend.js';

class AudioPlayer {

	constructor() {
		this.dataReceived = this.dataReceived.bind(this);
		this.getAnalytics = this.getAnalytics.bind(this);
	}

	init(sampleRate, bitDepth) {
		// init context
		let AudioCtx = window.AudioContext || window.webkitAudioContext;
		this.audioContext = new AudioCtx({sampleRate: sampleRate});

		// init analyser
		this.analyserNode = this.audioContext.createAnalyser();
		this.analyserNode.fftSize = 8192;
		this.analyserNode.connect(this.audioContext.destination);

		// important info for analytics
		this.inputSampleRate = sampleRate;
		this.outputSampleRate = this.audioContext.sampleRate;
		this.bitDepth = bitDepth;
		this.channel = new MessageChannel();

		// init backend + processor
		this.useMessageChannel = this.initBackend();
		this.initProcessor();
	}

	initProcessor() {
		let Processor;

		if (window.Worker) 
			Processor = WorkerProcessor;
		else
			Processor = MainThreadProcessor;

		this.processor = new Processor(
			this.inputSampleRate, 
			this.outputSampleRate, 
			this.onProcessed.bind(this), 
			(this.useMessageChannel) ? this.channel.port1 : undefined
		);
	}

	initBackend() {
		let Backend, useMessageChannel;

		if (window.AudioWorklet != undefined) {
			useMessageChannel = true;
			Backend = WorkletBackend;
		} else {
			useMessageChannel = false;
			Backend = ScriptProcessorBackend;
		}

		this.backend = new Backend(
			this.audioContext, 
			this.analyserNode, 
			2048, 
			this.channel.port2
		);

		return useMessageChannel
	}

	onProcessed(interleavedFloat32Data) {
		this.backend.push(interleavedFloat32Data);
	}

	dataReceived(arrayBuffer) {
		this.processor.processBlock(arrayBuffer);
	}

	subscribeToSilence(cb) {
		return this.backend.subscribeToSilence(cb);
	}

	unsubscribeFromSilence(id) {
		this.backend.unsubscribeFromSilence(id);
	}

	// TODO:
	stop() {}

	getAnalytics() {
		if (this.backend === undefined && this.proceessor === undefined) return {};
		
		let analytics = {
			inputSampleRate: this.inputSampleRate,
			outputSampleRate: this.outputSampleRate,
			durationBuffered: this.backend.getNSamplesBuffered() / this.outputSampleRate,
			nStarved: this.backend.getNStarved(),
			nUnderreads: this.backend.getNUnderreads(),
			bufferSize: this.backend.getBufferSize(),
			processor: this.processor.name(),
			backend: this.backend.name(),
			msgChannel: this.useMessageChannel.toString()
		}

		return analytics;
	}
}

export default AudioPlayer;
