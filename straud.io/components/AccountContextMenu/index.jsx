import { useEffect, useState, useContext } from 'react';

import Cookies from 'js-cookie';

import LoadingAccountContextMenu from './LoadingAccountContextMenu';
import LoginContextMenu from './LoginContextMenu';
import MyAccountContextMenu from './MyAccountContextMenu';

import './login-context-menu.css';

export default function AccountContextMenu(props) {
	return (
		<div id="account-context-menu">
 			{ props.user ? <MyAccountContextMenu user={props.user} /> : <LoginContextMenu /> }
		</div>
	);
}

