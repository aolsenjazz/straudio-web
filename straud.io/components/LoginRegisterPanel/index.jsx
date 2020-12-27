import { useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';

import LoadingPanel from '../LoadingPanel';
import LoginPanel from './LoginPanel';
import RegisterPanel from './RegisterPanel';
import LogoutPanel from './LogoutPanel';

import DefaultContext from '../../DefaultContext';
import useUserStatus from '../../hooks/UseUserStatus';

import './login-register-panel.css';

export default function LoginRegisterPanel(props) {
	const ctx = useContext(DefaultContext);

	const user = useUserStatus();
	const [register, setRegister] = useState(undefined);

	useEffect(() => {
		let params = new URLSearchParams(window.location.search);
		setRegister(params.get('register') !== null);
	});

	return (
		<section id="login-register-panel">
			{ !user && register === true  ? <RegisterPanel /> : null }
			{ !user && register === undefined ? <LoadingPanel /> : null }
			{ user === null && register === false ? <LoginPanel /> : null }
			{ user                       ? <LogoutPanel user={user} /> : null }
		</section>
	);
}