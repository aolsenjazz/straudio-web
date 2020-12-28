import React from 'react';
import FlipMove from 'react-flip-move';
import './participants-panel.css';

class ParticipantsPanel extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div id="participant-panel">
			{this.props.room.participants.map((c) => (
					<div className="participant" key={c.displayName}>
						<div className="connection-status"></div>
						<p>{c.displayName}</p>
					</div>
				))}
			</div>
		);
	}

}

export default ParticipantsPanel;