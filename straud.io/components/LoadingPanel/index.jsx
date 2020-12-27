import React from 'react';
import { Head } from '@react-ssr/express';

import './loading-panel.css';

class LoginLoadingPanel extends React.Component {

	constructor(props) {
		super();

	}

	componentDidMount() {
		
	}

	render() {
		return (
			<div id="loading-panel">
				<div id="title" className="loading-block"></div>
				<div>
					<div className="loading-block field"/>
					<div className="loading-block field" />
					<div id="main-action" className="loading-block"/>
				</div>
			</div>
		);
	}

}

export default LoginLoadingPanel;
