import { useState, useContext, useEffect, Fragment } from 'react';

import LoadingBlob from '../../LoadingBlob';

import './loading-panel.css';

export default function LoadingPanel(props) {
	return (
		<div id="loading-panel">
			<p className="error"></p>
			<div id="details">
				<div className="details-row">
					<LoadingBlob color="#E6E6E6" height="36px" width="30%" />
					<LoadingBlob color="#B3B3B3" height="36px" width="50%" />
				</div>
				<div className="details-row">
					<LoadingBlob color="#E6E6E6" height="36px" width="30%" />
					<LoadingBlob color="#B3B3B3" height="36px" width="50%" />
				</div>
				<div className="details-row">
					<LoadingBlob color="#E6E6E6" height="36px" width="30%" />
					<LoadingBlob color="#B3B3B3" height="36px" width="50%" />
				</div>
				<div className="details-row">
					<LoadingBlob color="#E6E6E6" height="36px" width="30%" />
					<LoadingBlob color="#B3B3B3" height="36px" width="50%" />
				</div>
			</div>
			<div id="main-action" className="loading-block">
				<LoadingBlob height="35px" width="292px" color="#60C1EF" />
			</div>
		</div>
	);
}