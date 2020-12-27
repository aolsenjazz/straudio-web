import React from 'react';
import './terminated-view.css';

class TerminatedView extends React.Component {

	constructor(props) {
		super(props);

		this.homeClick = this.homeClick.bind(this);
		this.reloadClick = this.reloadClick.bind(this);
	}

	homeClick() {
		this.props.wsm.ws.setRoomState({joined: false, state: null});
	}

	reloadClick() {
		window.location.reload(false);
	}

	render() {
		return (
			<section id="terminated-view">
				<h3>
				{(() => {
					if (!this.props.isConnectedToInternet) {
						return 'The internet disappeared.';
					} else if (this.props.room.state === 'open') {
						return 'You left the room.'
					} else if (this.props.room.state === 'closed') {
						return 'The host closed the room.';
					}

				})()}
				</h3>
				{ this.props.isConnectedToInternet ? <button className="terminated-button" onClick={this.reloadClick}>Back Home</button> : null}
				{ !this.props.isConnectedToInternet ?  <button className="terminated-button" onClick={this.reloadClick}>Reload</button> : null}
			</section>
		);
	}

}

export default TerminatedView;