import { useState, useContext, useEffect } from 'react';

import DefaultContext from '../../../DefaultContext';

import './reset-panel.css';

export default function ResetPanel() {
	const ctx = useContext(DefaultContext);

	const [error, setError] = useState(undefined);
	const [loading, setLoading] = useState(false);
	const [password, setPassword] = useState('');
	const [token, setToken] = useState('');

	useEffect(() => {
		let params = new URLSearchParams(window.location.search);
		setToken(params.get('token'));
	});

	const submit = () => {
		setLoading(true);
		setError(undefined);

		ctx.api.resetPassword(token, password)
			.then(success => {
				// REDIRECT
			})
			.catch(response => setError(response.data.errors[0].msg))
			.then(() => setLoading(false));
	}

	return (
		<section id="reset-panel">
			<h2>Reset Password</h2>
			<p className="error">{error}</p>
			<div>
				<input id="password" className="field" type="password" placeholder="New password" name="password" value={password} onChange={e => setPassword(e.target.value)} />
				<button id="main-action" className={loading ? 'loading-block' : ''} onClick={submit} disabled={loading}>RESET</button>
			</div>
		</section>
	);
}