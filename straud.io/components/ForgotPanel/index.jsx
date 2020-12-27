import { useState, useEffect, useContext } from 'react';

import Cookies from 'js-cookie';

import LoadingPanel from '../LoadingPanel';
import RequestPanel from './RequestPanel';
import ResetPanel from './ResetPanel';

import DefaultContext from '../../default-context';

import './forgot-panel.css';

export default function ForgotPanel(props) {
	const ctx = useContext(DefaultContext);

	const [view, setView] = useState('loading');
	const [error, setError] = useState(undefined);
	const [token, setToken] = useState(undefined);

	useEffect(() => {
		let params = new URLSearchParams(window.location.search);
		setToken(params.get('token'));

		if (token === undefined) {
			setView('request');
		} else {
			ctx.api.checkForgotToken(token)
				.then(success => {
					setView('reset');
					setToken(token);
				}).catch(response => {
					if (response.status === 400) setError(response.data.errors[0].msg);
					setView('request');
				});
		}
	}, [token]);

	return (
		<section id="forgot-panel">
			{ view === 'reset' ? <ResetPanel error={error} /> : null }
			{ view === 'loading' ? <LoadingPanel /> : null }
			{ view === 'request' ? <RequestPanel error={error} /> : null }
		</section>
	);
}