import React from 'react';
import './join-panel.css';

class JoinPanel extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			roomId: '',
			displayName: ''
		}

		this.submit = this.submit.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	/**
	Catches enter events and submits the form - as long as the room has already been preloaded. The room needs
	to be preloaded first because we need to construct the AudioContext in response to a gesture, and in order
	to create the audio context, we need the sample rate. So we preload the room.
	*/
	handleKeyDown(event) {
		if (event.key === 'Enter' && this.props.room.sampleRate != undefined) {
			this.submit();
		}
	}

	/**
	Makes all lowercase letters uppercase and submits a request for room details once four chars have been entered.
	*/
	handleChange(event) {
		let parsedTarget = event.target.value;
		if (event.target.name === 'roomId') {
			parsedTarget = event.target.value.toUpperCase();
		}

		this.setState({
			[event.target.name]: parsedTarget
		});

		if (event.target.name == 'roomId' && event.target.value.length == 4) {
			this.props.wsm.preloadRoom(parsedTarget);
		}
	}

	/**
	If a valid room was entered, enters the room and initializes the AudioPlayer. Unfortunately AudioPlayer initialization
	needs to happen in resposne to a gesture, so it happens here.
	*/
	submit() {
		this.props.audioPlayer.init(this.props.room.sampleRate, this.props.room.nChannels, this.props.room.bitDepth);

		let roomId = this.state.roomId;
		let error = '';
		this.props.onError(null, null);
		if (roomId.length > 10 || roomId.length < 4) error = 'Room id must be 4-10 characters.';

		if (error.length > 0) {
			this.props.onError('user', error);
			return;
		}			
		
		this.props.wsm.ws.joinRoom(this.state.roomId, '');
	}

	render() {
		return (
			<div id="join-panel">
				<input id="room-id" placeholder="Room Id" value={this.state.roomId} onChange={this.handleChange} onKeyDown={this.handleKeyDown} name="roomId" />
				<button type="button" onClick={this.submit} >JOIN</button>
				<p className="error">{this.props.error && this.props.error.severity == 'user' ? this.props.error.message : null}</p>
			</div>
		);
	}

}

export default JoinPanel;