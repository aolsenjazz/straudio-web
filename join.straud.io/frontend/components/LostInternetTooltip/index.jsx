import React from 'react';
import './lost-internet-tooltip.css';

class LostInternetTooltip extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div id="lost-internet">
				<p>Internet connection interrupted.</p>
				<button>Reload</button>
			</div>
		);
	}

}

export default LostInternetTooltip;