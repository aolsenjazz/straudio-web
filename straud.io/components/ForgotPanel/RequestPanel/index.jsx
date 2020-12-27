import { useState, useEffect, useContext } from 'react';

import DefaultContext from '../../../DefaultContext';

import './request-panel.css';

export default function RequestPanel(props) {
	const ctx = useContext(DefaultContext);

	const [error, setError] = useState(props.error);
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState('');
	const [requestSent, setRequestSent] = useState(false);

	const submit = () => {
		setLoading(true);
		setError(undefined);

		ctx.api.createResetRequest(email)
			.then(success => setRequestSent(true))
			.catch(response => setError(response.data.errors[0].msg))
			.then(() => setLoading(false));
	}

	return (
		<div id="request-panel">
			<h2>{ requestSent ? 'Request sent. Check your email.' : 'Reset Password'}</h2>
			<p className="error">{error}</p>
			{ requestSent ? null :
				<div>
					<input id="email" className="field" placeholder="Email" name="email" value={email} onChange={e => setEmail(e.target.value)} />
					<button id="main-action" className={loading === true ? 'loading-block' : ''} onClick={submit} disabled={loading}>SEND RESET LINK</button>
				</div>
			}
		</div>
	);
}