import React from 'react';
import './room-id-view.css';

class TerminatedView extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<h2 id="room-id-view">Room id: {this.props.roomId}</h2>
		);
	}

}

export default TerminatedView;