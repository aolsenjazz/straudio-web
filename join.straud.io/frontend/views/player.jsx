import React from 'react';
import { Head } from '@react-ssr/express';
import WebServicesManager from '../web-services-manager'
import './player.css';

import PcmDownloader from '../../helper_projects/pcm_downloader/pcm-downloader.js';

class Player extends React.Component {

	constructor(props) {
		super();

		this.readFile = this.readFile.bind(this);
		this.getSecond = this.getSecond.bind(this);

		this.currentSecond = 0;

		this.test1 = this.test1.bind(this);
		this.test2 = this.test2.bind(this);
		this.test3 = this.test3.bind(this);
	}

	componentDidMount() {
		
	}

	componentWillUnmount() {
		
	}

	readFile() {
		let thiz = this;

		let request = new XMLHttpRequest();
		request.open('GET', './ariana.raw', true);
		request.responseType = 'blob';
		request.onload = function() {
			var reader = new FileReader();
			reader.readAsArrayBuffer(request.response);
			reader.onload =  function(e){
				
				thiz.buff = new Float32Array(e.target.result);
				console.log('file loaded.');

			};
		};
		request.send();
	}

	/**
	Plays one single AudioBuffer containing 3 seconds of music
	*/
	test1() {
		let AudioContext = window.AudioContext || window.webkitAudioContext;
		let ac = new AudioContext({sampleRate: 44100});
		let ab = ac.createBuffer(2, ac.sampleRate * 3, ac.sampleRate);

		for (let channel = 0; channel < 2; channel++) {
			let channelData = ab.getChannelData(channel);

			let buffPos = channel;
			for (let i = 0; i < channelData.length; i++) {
				channelData[i] = this.buff[buffPos];
				buffPos += 2;
			}
		}

		let source = ac.createBufferSource();
		source.buffer = ab;
		source.connect(ac.destination);
		source.start();
	}

	/**
	Preloads 4 buffers of music (3 seconds each) and tells them to start when appropriate
	*/
	test2() {
		let AudioContext = window.AudioContext || window.webkitAudioContext;
		let ac = new AudioContext({sampleRate: 44100});
		
		let playPosition = 0;
		let buffPos = 0;

		let sources = [];

		let ab = ac.createBuffer(2, ac.sampleRate * 3, ac.sampleRate);
		let ab2 = ac.createBuffer(2, ac.sampleRate * 3, ac.sampleRate);

		for (let channel = 0; channel < 2; channel++) {
			let channelData = ab.getChannelData(channel);

			let buffPos = channel;
			for (let i = 0; i < channelData.length; i++) {
				channelData[i] = this.buff[buffPos];
				buffPos += 2;
			}
		}

		for (let channel = 0; channel < 2; channel++) {
			let channelData = ab2.getChannelData(channel);

			let buffPos = channel + (44100 * 3 * 2);
			for (let i = 0; i < channelData.length; i++) {
				channelData[i] = this.buff[buffPos];
				buffPos += 2;
			}
		}

		let source = ac.createBufferSource();
		let source2 = ac.createBufferSource();
		source.buffer = ab;
		source2.buffer = ab2;
		source.connect(ac.destination);
		source2.connect(ac.destination);
		sources.push(source);
		sources.push(source2);
		console.log(ac.currentTime);

		console.log(`AudioBuffer[${0}] will start at ${playPosition}`);
		playPosition += ab.duration;
		

		sources[0].start(0);
		sources[1].start(3);
	}

	test3() {

		let AudioFeeder = require('audio-feeder');
		let feeder = new AudioFeeder();

		feeder.init(2, 44100);

		feeder.start();
		

		feeder.bufferData(this.getSecond(this.currentSecond));
		this.currentSecond++;

		feeder.onbufferlow = () => {
			feeder.bufferData(this.getSecond(this.currentSecond));
			this.currentSecond++;
		}

		
	}

	getSecond(second) {
		let leftChannel = new Float32Array(44100);
		let rightChannel = new Float32Array(44100);
		let channels = [leftChannel, rightChannel]

		for (let channel = 0; channel < channels.length; channel++) {

			let samplePos = channel + (44100 * second * 2);
			let channelPos = 0;
			while(channelPos < leftChannel.length) {
				channels[channel][channelPos] = this.buff[samplePos];

				samplePos += 2;
				channelPos += 1;
			}
		}

		return channels;
	}

	render() {
		return (
			<React.Fragment>
				<Head>
					<title>{this.props.title}</title>
				</Head>
				
				<div id="button-container">
					<button onClick={this.readFile}>Load File</button>
					<button onClick={this.test1}>Test1</button>
					<button onClick={this.test2}>Test2</button>
					<button onClick={this.test3}>Test3</button>
				</div>
				
			</React.Fragment>
		);
	}

}

export default Player;