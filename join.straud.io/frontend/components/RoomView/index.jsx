import React from 'react';
import MainControls from '../MainControls';
import RoomIdView from '../RoomIdView';
import Visualizer from '../Visualizer';
import ParticipantsPanel from '../ParticipantsPanel';
import './room-view.css';

class RoomView extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div id="room-view">
				<Visualizer {... this.props }/>
				<MainControls {... this.props} />
			</div>
		);
	}

}

export default RoomView;