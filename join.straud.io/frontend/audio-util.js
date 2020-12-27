// the maximum number of samples (independent of # of chans) that can be sent from plugin clients
const MAX_SAMPLES_FROM_CLIENT = 32768;

// maximum number of samples which can result from an upsampling operation
// (MAX_SAMPLES_FROM_CLIENT / 44100) * 192000
const MAX_SAMPLES_UPSAMPLED = 142664;

/**
 * Writes 0 at every index in every channel
 * @param {targetChannels} an array of TypedArrays, or a TypedArray
 * @param {mono} is targetChannels an array of TypedArrays (stereo), or a TypedArray (mono)
 */
function writeSilence(targetChannels, mono=false) {
	if (mono === true) {
		for (let i = 0; i < targetChannels.length; i++) {
			targetChannels[i] = 0;
		}
	} else {
		for (let i = 0; i < targetChannels.length; i++) {
			let channel = targetChannels[i];

			for (let j = 0; j < channel.length; j++) {
				channel[j] = 0;
			}
		}
	}
}

/**
 * Copies data from an interleaved data array to a stereo, 2-channel target array
 * @param {interleavedData} 1xn TypedArray containing stereo interleaved.
 * @param {targetChannels} 2xn array containing TypedArrays. targetChannels[n] must have length = 2 * interleavedData.length
 */
function copyInterleavedToChannels(interleavedData, targetChannels) {
	if (interleavedData.length != targetChannels[0].length * 2) throw Error('incorrect channel lengths');

	for (let channelNum = 0; channelNum < 2; channelNum++) {
		let channelLen = interleavedData.length / 2;

		let dataPos = channelNum;
		for (let channelPos = 0; channelPos < channelLen; channelPos++) {
			targetChannels[channelNum][channelPos] = interleavedData[dataPos];
			dataPos += 2;
		}
	}
}

/**
 * Copies data from a 2xn array to interleaved data array of size n*2
 * @param {targetInterleaved} 1xn TypedArray to write stereo interleaved data to
 * @param {channelData} 2xn array containing TypedArrays. channelData[n] must have length = 2 * targetInterleaved.length
 */
function copyChannelsToInterleaved(channelData, targetInterleaved) {
	if (targetInterleaved.length != channelData[0].length * 2) throw Error('incorrect channel lengths');

	let interleavedPos = 0;

	for (let i = 0; i < channelData[0].length; i++) {
		targetInterleaved[interleavedPos++] = channelData[0][i];
		targetInterleaved[interleavedPos++] = channelData[1][i];
	}
}

module.exports = {
	MAX_SAMPLES_UPSAMPLED,
	MAX_SAMPLES_FROM_CLIENT, 
	writeSilence,
	copyChannelsToInterleaved,
	copyInterleavedToChannels,
}