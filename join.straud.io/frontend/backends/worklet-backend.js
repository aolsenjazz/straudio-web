import { AudioBackend, State } from './audio-backend.js';

class WorkletBackend extends AudioBackend {
	constructor(context, output, bufferSize, port) {
		super();

		this.silent = undefined;
		this.silenceSubscriptions = new Map();

		// define this here so that window is accessible
		class WorkletNode extends AudioWorkletNode {
			constructor(context) {
				super(context, 'audio-processor', {
					numberOfInputs: 0, 
					numberOfOutputs: 1,
					outputChannelCount: [2]
				});
			}
		}

		context.audioWorklet.addModule('worklet-backend-processor.js').then(() => {
			this.audioNode = new WorkletNode(context);
			this.audioNode.connect(output);
			this.audioNode.port.onmessage = this.messageFromProcessor.bind(this);

			if (port) this.audioNode.port.postMessage({command: 'connect'}, [port]);
		});
	}

	push(interleavedFloat32Data) {
		this.audioNode.port.postMessage({command: 'feed', data: interleavedFloat32Data}, [interleavedFloat32Data.buffer]);
	}

	messageFromProcessor(e) {
		if (e.data.command === 'reportSilence') {
			this.silent = e.data.silent;
			this.notifySilence();
		}
	}

	name() {
		return 'WorkletBackend';
	}

	getBufferSize() {
		return 128;
	}

	getNSamplesBuffered() {
		return this.nSamplesBuffered;
	}

	getNStarved() {
		return this.nStarved;
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
			value(this.silent);
		});
	}
}

export default WorkletBackend;