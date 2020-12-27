import { AudioBackend, State } from './audio-backend.js';

class WorkletBackend extends AudioBackend {
	constructor(context, output, bufferSize, port) {
		super();

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
		this.nStarved = e.data.nStarved;
		this.nSamplesBuffered = e.data.nSamplesBuffered;
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
}

export default WorkletBackend;