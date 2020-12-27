import {useState, useContext} from 'react';

import Cookies from 'js-cookie';

import DefaultContext from '../../../DefaultContext';

import './logout-panel.css';

export default function LogoutPanel(props) {
	const ctx = useContext(DefaultContext);

	const submit = () => {
		Cookies.remove('auth', { domain: ctx.host });
		window.location = '/login';
	}

	return (
		<div id="logout-panel">
			<div>
				<div id="profile-details">
					<p className="heading-strong">Currently logged in as:</p>
					<p className="sub-heading">{props.user.fname} {props.user.lname}</p>
					<p className="sub-heading">{props.user.email}</p>
				</div>
				<button id="main-action" onClick={submit}>LOG OUT</button>
			</div>
		</div>
	);
}
