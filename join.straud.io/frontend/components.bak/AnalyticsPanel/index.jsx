import React from 'react';

import './analytics-panel.css';

class AnalyticsPanel extends React.Component {

	constructor(props) {
		super();

		this.getAnalytics = this.getAnalytics.bind(this);

		this.state = {};
	}

	componentDidMount() {

	}

	getAnalytics() {
		this.props.wsm.getAnalytics().then((wsmAnalytics) => {
			let audioAnalytics = this.props.audioPlayer.getAnalytics();

			let state = this.state;
			state.signalAnalytics = wsmAnalytics.signalAnalytics;
			state.peerAnalytics = wsmAnalytics.peerAnalytics;
			state.audioAnalytics = this.props.audioPlayer.getAnalytics();
			this.setState(state);
		}).catch((e) => {
			console.log(`Oops: ${e}`);
		});
	}

	renderSignalAnalytics() {
		return (
			<div>
				<h2>Analytics</h2>
				<h3>Server</h3>
				<h5>Global</h5>
				<p>Open rooms: {this.state.signalAnalytics.nRooms}</p>
				<p>Connected clients: {this.state.signalAnalytics.nClients}</p>
				<h5>Incoming</h5>
				<p>Timeframe: {this.state.signalAnalytics.incoming.timeframe / 1000}s</p>
				<p>RPS: {this.state.signalAnalytics.incoming.rps}</p>
				<p>BWPS: {this.state.signalAnalytics.incoming.bandwidth}</p>
				<h5>Outgoing</h5>
				<p>Timeframe: {this.state.signalAnalytics.outgoing.timeframe / 1000}s</p>
				<p>RPS: {this.state.signalAnalytics.outgoing.rps}</p>
				<p>BWPS: {this.state.signalAnalytics.outgoing.bandwidth}</p>
			</div>
		);
	}

	renderAudioPlayerAnalytics() {
		return (
			<div>
				<h3>Audio Player</h3>
				{
					Object.entries(this.state.audioAnalytics).map(([k, v]) => {
						return <p key={k}>{k}: {v}</p>
					})
				}
			</div>
		);
	}

	renderPeerAnalytics() {
		return (
			<div>
				<h3>Peer Connection</h3>
				<p>RPS: {this.state.peerAnalytics.rps}</p>
				<p>Total Data: {this.state.peerAnalytics.bytesReceived}</p>
				<p>Data/Sec: {this.state.peerAnalytics.bps}</p>
			</div>
		);
	}

	render() {
		return (
			<section id="analytics">
				<button onClick={this.getAnalytics}>Get Analytics</button>
				{ this.state.signalAnalytics !== undefined ? this.renderSignalAnalytics() : null }
				{ this.state.audioAnalytics !== undefined ? this.renderAudioPlayerAnalytics() : null }
				{ this.state.peerAnalytics !== undefined ? this.renderPeerAnalytics() : null }

			</section>
		);
	}

}

export default AnalyticsPanel;