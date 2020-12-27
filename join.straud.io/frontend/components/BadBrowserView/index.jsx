import React from 'react';
import './bad-browser-view.css';

class BadBrowserView extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<section id="bad-browser-view">
				<h3>{this.props.error.message}</h3>
			</section>
		);
	}

}

export default BadBrowserView;