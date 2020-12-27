import React from 'react';
import { Head } from '@react-ssr/express';
import './visualizer.css';

class Player extends React.Component {

	constructor(props) {
		super();

		
	}

	componentDidMount() {
		const file = document.getElementById("file-input");
		const canvas = document.getElementById("canvas");
		const audio = document.getElementById("audio");

		canvas.width = canvas.getBoundingClientRect().width;
		canvas.height = canvas.getBoundingClientRect().height;

		const barWidth = 2;
		const barSpacing = 10;
		const nBars = Math.floor((canvas.width - barWidth) / (barWidth + barSpacing));

		file.onchange = function() {

			const files = this.files;
			audio.src = URL.createObjectURL(files[0]);

			const name = files[0].name
			const ctx = canvas.getContext("2d");

			const context = new AudioContext();
			let src = context.createMediaElementSource(audio);
			const analyser = context.createAnalyser();

			analyser.fftSize = 16384;

			src.connect(analyser);
			analyser.connect(context.destination);

			const bufferLength = analyser.frequencyBinCount; // this = analyser.fftSize / 2
			const dataArray = new Uint8Array(bufferLength);

			let barHeight, x;

			function renderFrame() {
				requestAnimationFrame(renderFrame); // Takes callback function to invoke before rendering

				x = 0;

				analyser.getByteFrequencyData(dataArray);
				ctx.clearRect(0, 0, canvas.width, canvas.height);

				let r, g, b, val, logScaleIdx, propPos;

				for (let i = 1; i < nBars; i++) {
					// get the frequency bin at a proporational location to the index of the bar
					propPos = Math.floor(i / nBars * bufferLength);

					// get the logarithmically-scaled equivalent position
					logScaleIdx = Math.floor(toLog(propPos, 10, bufferLength));

					// finally, get the frequency bin value
					val = dataArray[logScaleIdx];
					
					barHeight = canvas.height * (val / 256);

					if (val > 255) {
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

			audio.play();
			renderFrame();
		};
	}

	componentWillUnmount() {
		
	}

	render() {
		return (
			<React.Fragment>
				<Head>
					<title>{this.props.title}</title>
				</Head>
				<h1>Straudio</h1>
					
				<input type="file" id="file-input" accept="audio/*,video/*,image/*" />
				<canvas id="canvas"></canvas>
				<audio id="audio" controls></audio>
				
			</React.Fragment>
		);
	}

}

function toLog(value, min, max) {
	var exp = (value-min) / (max-min);
	return min * Math.pow(max/min, exp);
}

export default Player;