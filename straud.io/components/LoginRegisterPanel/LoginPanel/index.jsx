import {useState, useContext} from 'react';

import Cookies from 'js-cookie';

import DefaultContext from '../../../DefaultContext';

import './login-panel.css';

export default function LoginPanel(props) {
	const ctx = useContext(DefaultContext);

	const [error, setError] = useState(undefined);
	const [loading, setLoading] = useState(false);

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const submit = () => {
		setLoading(true);
		setError(undefined);

		ctx.api.login(email, password)
			.then(response => {
				Cookies.set('auth', response.data.auth, { domain: ctx.host });
			})
			.catch(response => { 
				if (response.status === 401 || response.status === 422) {
					setError(response.data.errors[0].msg);
				}
			})
			.then(() => setLoading(false));
	}

	return (
		<div id="login-panel">
			<h2>Log in to Straud.io</h2>
			<p className="error">{error}</p>
			<div>
				<input id="email" className="field" placeholder="Email" name="email" value={email} onChange={e => setEmail(e.target.value)} />
				<input id="password" className="field" type="password" name="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
				<div id="sub-action">
					<a href="/forgot">Forgot Password</a>
				</div>
				<button id="main-action" className={loading ? 'loading-block' : ''} onClick={submit} disabled={loading}>LOGIN</button>
				<div id="sub-action">
					<p>or </p>
					<a href="/login?register">Make an Account</a>
				</div>
			</div>
		</div>
	);
}
