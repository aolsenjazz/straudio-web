import React from 'react';
import './visualizer.css';

class Visualizer extends React.Component {

	constructor(props) {
		super(props);

		this.toggleAnimate = this.toggleAnimate.bind(this);

		this.state = {
			animate: true
		};
	}

	toggleAnimate() {
		let state = this.state;
		state.animate = !state.animate;
		this.setState(state);
	}

	componentDidMount() {
		const canvas = document.getElementById("canvas");

		canvas.width = canvas.getBoundingClientRect().width;
		canvas.height = canvas.getBoundingClientRect().height;

		const barWidth = 2;
		const barSpacing = 6;
		const nBars = Math.floor((canvas.width - barWidth) / (barWidth + barSpacing));

		const ctx = canvas.getContext('2d');

		let audioPlayer = this.props.audioPlayer;
		let barHeight, x, frequencyBins, r, g, b, val, logScaleIdx, propPos;

		let renderFrame = function() {
			requestAnimationFrame(renderFrame); // Takes callback function to invoke before rendering
			if (this.state.animate === false) {
				return;
			}


			if (audioPlayer.analyserNode !== undefined) {
				if (frequencyBins === undefined) {
					frequencyBins = new Uint8Array(audioPlayer.analyserNode.frequencyBinCount);
				}
			} else {
				return;
			}

			x = 0;

			audioPlayer.analyserNode.getByteFrequencyData(frequencyBins);
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			for (let i = 1; i < nBars; i++) {
				// get the frequency bin at a proporational location to the index of the bar
				propPos = Math.floor(i / nBars * frequencyBins.length);

				// get the logarithmically-scaled equivalent position
				logScaleIdx = Math.floor(toLog(propPos, 10, frequencyBins.length));

				// finally, get the frequency bin value
				val = frequencyBins[logScaleIdx];
				
				barHeight = canvas.height * (val / 256);

				if (val > 256) {
					r = 255;
					g = 0;
					b = 0;
				} else {
					r = 255;
					g = 255;
					b = 255;
				}

				ctx.fillStyle = `rgb(${r},${g},${b})`;
				ctx.fillRect(x, (canvas.height - barHeight), barWidth, barHeight);

				x += barWidth + barSpacing // Gives 10px space between each bar
			}
		}

		renderFrame = renderFrame.bind(this);
		renderFrame();
	}

	render() {
		return (
			<div id="visualizer">
				<canvas id="canvas"></canvas>
				<button id="animate" onClick={this.toggleAnimate}>{this.state.animate ? 'Stop Animation' : 'Start animation'}</button>
			</div>
		);
	}

}

function toLog(value, min, max) {
	var exp = (value-min) / (max-min);
	return min * Math.pow(max/min, exp);
}

export default Visualizer;
