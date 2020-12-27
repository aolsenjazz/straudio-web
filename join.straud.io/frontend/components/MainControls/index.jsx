import React from 'react';
import { ReactSVG } from 'react-svg';
import './main-controls.css';

class RoomView extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			audioPlayback: true
		};

		this.toggleAudioState = this.toggleAudioState.bind(this);
		this.hangUp = this.hangUp.bind(this);
	}

	toggleAudioState() {
		this.props.audioPlayer.toggleMute();

		let state = this.state;
		let playback = state.audioPlayback;
		this.setState({audioPlayback: !playback});
	}

	hangUp() {
		this.props.wsm.ws.leaveRoom();
	}

	render() {
		return (
			<div id="main-controls">
				<div className={this.state.audioPlayback ? '' : 'inactive'} onClick={this.toggleAudioState} id="audio-control">
					<img src="/images/speaker.svg" />
					<div className={`slash ${this.state.audioPlayback ? 'inactive' : ''}`}></div>
				</div>
				<div id="hang-up">
					<img src="/images/phone.svg" onClick={this.hangUp} />
				</div>
			</div>
		);
	}

}

export default RoomView;