class RingBuffer {
	
	_bufferLength;
	_nChannels;
	_data = [];
	_writePos = 0;
	_readPos = 0;

	constructor(bufferLength=32768, nChannels) {
		if (bufferLength <= 0) throw 'bufferLength must be >= 1';
		if (!(0 < nChannels) || !(nChannels <= 2)) throw 'nChannels must be 0 < nChannels <=2';

		for (let i = 0; i < nChannels; i++) {
			this._data.push(new Float32Array(bufferLength));
		}
		this._bufferLength = bufferLength;
		this._nChannels = nChannels;
	}

	hasDataAvailable() {
		return this._writePos != this._readPos;
	}

	resetReadPosition() {
		this._readPos = this._writePos;
	}

	getNReadableSamples() {
		if (this._readPos == this._writePos) return 0;
		return (this._readPos < this._writePos) ? this._writePos - this._readPos : this._bufferLength - this._readPos + this._writePos;
	}

	advanceReadPosition(nSamples) {
		let newPos = this._readPos;
		for (let i = 0; i < nSamples; i++) {
			if (newPos == this._bufferLength) newPos = 0;
			newPos++;
			if (newPos == this._writePos) break;
		}

		this._readPos = newPos;
	}

	read(nSamples) {
		let channels = Array.apply(null, Array(this._nChannels)).map((x, i) => {return new Float32Array(nSamples)});
		let readableSamples = Math.min(nSamples, this.getNReadableSamples());
		let readChannelPos;

		for (let channelNum = 0; channelNum < channels.length; channelNum++) {
			let writeChannel = channels[channelNum];
			readChannelPos = this._readPos;

			for (let samplePos = 0; samplePos < readableSamples; samplePos++) {
				if (readChannelPos == this._bufferLength) readChannelPos = 0;

				writeChannel[samplePos] = this._data[channelNum][readChannelPos++];
			}
		}

		this._readPos = readChannelPos;
		return channels;
	}

	readInto(channels, nSamples) {
		let readableSamples = Math.min(nSamples, this.getNReadableSamples());
		let readChannelPos;

		for (let channelNum = 0; channelNum < channels.length; channelNum++) {
			readChannelPos = this._readPos;

			for (let samplePos = 0; samplePos < readableSamples; samplePos++) {
				if (readChannelPos == this._bufferLength) readChannelPos = 0;

				channels[channelNum][samplePos] = this._data[channelNum][readChannelPos++];
			}
		}

		this._readPos = readChannelPos;
	}

	write(readChannels, interleaved=false) {
		if (interleaved === true)  {
			let newWritePos = this._writePos;

			for (let i = 0; i < readChannels.length; i += 2) {
				if (newWritePos == this._bufferLength) newWritePos = 0;

				this._data[0][newWritePos]   = readChannels[i];
				this._data[1][newWritePos++] = readChannels[i + 1];
			}

			this._writePos = newWritePos;
		} else {
			// validate data
			if (readChannels.length != this._nChannels) throw 'readChannels.length must equal this._nChannels!';
			let channelLen = readChannels[0].length;
			for (let i = 0; i < readChannels.length; i++) if (readChannels[i].length != channelLen) throw 'channel lengths differ in write()';

			let newWritePos;

			for (let channelNum = 0; channelNum < readChannels.length; channelNum++) {
				let readChannel = readChannels[channelNum];
				newWritePos = this._writePos;

				for (let samplePos = 0; samplePos < readChannel.length; samplePos++) {
					if (newWritePos == this._bufferLength) newWritePos = 0;

					this._data[channelNum][newWritePos++] = readChannel[samplePos];
				}
			}

			this._writePos = newWritePos;
		}		
	}
}

export default RingBuffer;