import { useContext } from 'react';

import Cookies from 'js-cookie';

import DefaultContext from '../../../DefaultContext';

import './my-account-context-menu.css';

export default function MyAccountContextMenu(props) {
	let ctx = useContext(DefaultContext);

	return (
		<div id="my-account-context-menu">
			<div id="profile-details">
				<p className="heading-strong">{props.user.fname} {props.user.lname}</p>
				<p className="sub-heading">{props.user.email}</p>
				<div id="line" />
			</div>
			<div id="main-action">
				<a href="/account">MY ACCOUNT</a>
			</div>
			<div id="sub-action" onClick={() => Cookies.remove('auth', { domain: ctx.host })}>
				<p>or </p>
				<a href="/login">Log out</a>
			</div>
		</div>
	);
}