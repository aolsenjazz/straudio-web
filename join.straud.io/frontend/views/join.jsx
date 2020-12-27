import React from 'react';
import { Head } from '@react-ssr/express';
import WebServicesManager from '../web-services-manager'
import watchVisiblity from '../visibility';
import isMobile from 'ismobilejs';
import watch from '../disruption';
import compatCheckBrowser from '../compatibility'

import './join.css';

import Header from '../components/Header';
import JoinPanel from '../components/JoinPanel';
import RoomView from '../components/RoomView';
import TerminatedView from '../components/TerminatedView';
import BadBrowserView from '../components/BadBrowserView';
import LostInternetTooltip from '../components/LostInternetTooltip';
import LoadingAnim from '../components/LoadingAnim';

import AudioPlayer from '../audio-player.js';
import AnalyticsPanel from '../components/AnalyticsPanel';

class Home extends React.Component {

	constructor(props) {
		super();

		this.onSignalStateChange = this.onSignalStateChange.bind(this);
		this.onRoomStateChange = this.onRoomStateChange.bind(this);
		this.onError = this.onError.bind(this);
		this.onDataChannelStateChange = this.onDataChannelStateChange.bind(this);
		this.onDisruption = this.onDisruption.bind(this);
		this.updateState = this.updateState.bind(this);

		this.host = props.host;
		this.signalPort = props.signalPort;
		this.analyticsPort = props.analyticsPort;
		this.useTls = props.useTls;

		this.state = {
			host: props.host,
			signalPort: props.signalPort,
			analyticsPort: props.analyticsPort,
			useTls: props.useTls,
			audioPlayer: new AudioPlayer(),

			isConnectedToInternet: true,
			signalState: 'closed',
			dataChannelState: 'uninitialized',
			room: {joined: false, state: null},
			error: {severity: null, message: null},
			onError: this.onError,
		};
	}

	componentDidMount() {
		let result = compatCheckBrowser();

		if (!result.valid) {
			this.updateState('error', {
				severity: 'browser',
				message: result.message,
			});
			return;
		}

		watch(this.onDisruption);
		require('browser-report');
		require('unmute-ios-audio')();

		let wsm = new WebServicesManager(this.host, this.signalPort, this.state.useTls, this.onSignalStateChange, 
			this.onRoomStateChange, this.onError, this.state.audioPlayer.dataReceived, this.onDataChannelStateChange);
		wsm.ws.connect();
		this.updateState('wsm', wsm);

		let params = new URLSearchParams(window.location.search);
		if (params.get('analytics') !== null) {
			this.updateState('analytics', true);
		}
	}

	onDisruption(type) {
		if (type === 'connectivity') {
			this.updateState('isConnectedToInternet', false);
		}

		this.state.wsm.closeAll();

		if (this.state.audioPlayer) {
			this.state.audioPlayer.stop();
		}
	}

	updateState(key, value) {
		let state = this.state;
		state[key] = value;
		this.setState(state);
	}
	onDataChannelStateChange(dcData) { this.updateState('dataChannelState', dcData); }
	onError(severity, message)       { this.updateState('error', {severity: severity, message: message}); }
	onSignalStateChange(sigState) { this.updateState('signalState', sigState); }

	onRoomStateChange(room) {
		let staleState = this.state;
		let staleRoom = staleState.room;

		// Connect to or disconnect from room
		if (staleRoom.joined === false && room.joined === true) {
			// We just joined. connect to host
			staleState.wsm.pcm.initiatePeerConnection(room.host.id);
		} else if (room.joined === false) {
			// we just left the room. disconnect from peer connections
			this.state.wsm.closePeerConnections();
			this.state.audioPlayer.stop();
		}

		// If the sampleRate/nChannels changes, we need to reload audio.
		if (shouldUpdateAudioPlayer(staleRoom, room)) {
			if (this.state.audioPlayer) {
				this.state.audioPlayer.stop();
			}
			
			this.state.audioPlayer.init(room.sampleRate, room.nChannels, room.bitDepth);
		}

		staleState.room = room;
		this.setState(staleState);
	}

	render() {
		return (
			<React.Fragment>
				<Head>
					<title>{this.props.title}</title>
				</Head>
				
				<Header />
				<MainView {... this.state} />
				<ConditionalAnalyticsPanel {... this.state} />
				<ConditionalLoadingAnim {... this.state} />
			</React.Fragment>
		);
	}

}

function MainView(props) {
	if (props.error.severity === 'browser') {
		return <BadBrowserView {... props} />
	}

	if (props.isConnectedToInternet === false) {
		return <TerminatedView {... props} />;
	}

	if (props.room.joined === false && !props.room.state) {
		return <JoinPanel {... props} />;
	}

	if (props.room.joined === true  && props.room.state === 'open') {
		return <RoomView {... props} />;
	}
	
	return <TerminatedView {... props} />; // redundant, but simple
}

function ConditionalAnalyticsPanel(props) {
	if (props.analytics === true) {
		return <AnalyticsPanel {... props} />
	}

	return null;
}

function ConditionalLoadingAnim(props) {
	if (props.dataChannelState === 'connecting') {
		return <LoadingAnim />
	}

	return null;
}

function shouldUpdateAudioPlayer(staleRoom, newRoom) {
	return (staleRoom.sampleRate != newRoom.sampleRate || staleRoom.nChannels != newRoom.nChannels
		|| staleRoom.bitDepth != newRoom.bitDepth) && staleRoom.sampleRate != undefined;
}

export default Home;
