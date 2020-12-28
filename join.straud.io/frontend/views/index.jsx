import { useEffect } from 'react';
import { Head } from '@react-ssr/express';

import Header from '@Components/Header';
import JoinApp from '@Components/JoinApp';

import Api from '@Services/api';
import SignalService from '@Services/signal-service';
import PeerConnectionService from '@Services/peer-connection-service';
import DefaultContext from '../default-context';

import './global.css';
// import watchVisiblity from '../visibility';
// import isMobile from 'ismobilejs';
// import watch from '../disruption';
// import compatCheckBrowser from '../compatibility'

// import './join.css';

// import Header from '../components/Header';
// import JoinPanel from '../components/JoinPanel';
// import RoomView from '../components/RoomView';
// import TerminatedView from '../components/TerminatedView';
// import BadBrowserView from '../components/BadBrowserView';
// import LostInternetTooltip from '../components/LostInternetTooltip';
// import LoadingAnim from '../components/LoadingAnim';

import AudioPlayer from '../audio-player.js';
// import AnalyticsPanel from '../components/AnalyticsPanel';

export default function Home(props) {
	const api = new Api(props.apiUrl);
	const audioPlayer = new AudioPlayer();
	const signalService = new SignalService(props.signalUrl);
	const peerConnectionService = new PeerConnectionService(signalService, audioPlayer);

	useEffect(() => {
		signalService.connect();
	}, []);

	// ????????????????????????????
	// useEffect(() => {
	// 	let result = compatCheckBrowser();

	// 	if (!result.valid) {
	// 		this.updateState('error', {
	// 			severity: 'browser',
	// 			message: result.message,
	// 		});
	// 		return;
	// 	}
	// }, []);

	// ??????????????????????????????
	// useEffect(() => {
	// 	watch(this.onDisruption);
	// }, []);

	// useEffect(() => {
	// 	require('unmute-ios-audio')();
	// });

	// ??????????????????????????????
	// useEffect(() => {
	// 	let params = new URLSearchParams(window.location.search);
	// 	if (params.get('analytics') !== null) {
	// 		this.updateState('analytics', true);
	// 	}
	// })

	return (
		<DefaultContext.Provider value={{
			signalService: signalService, 
			api: api, 
			peerConnectionService: peerConnectionService,
			audioPlayer: audioPlayer,
		}}>
			<Header showLogin={true} />

			<JoinApp />
		</DefaultContext.Provider>
	);
}