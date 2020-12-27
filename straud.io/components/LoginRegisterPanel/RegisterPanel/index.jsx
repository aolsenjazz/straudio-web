import { useState, useContext } from 'react';
import DefaultContext from '../../../DefaultContext';

import './register-panel.css';

export default function RegisterPanel(props) {
	const ctx = useContext(DefaultContext);

	const [error, setError] = useState(undefined);
	const [loading, setLoading] = useState(false);

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [lname, setLName] = useState('');
	const [fname, setFName] = useState('');

	const submit = () => {
		setError(undefined);
		setLoading(true);

		ctx.api.register(email, password, fname, lname)
			.then(response => console.log(response))
			.catch(response => {
				if (response.status === 401 || response.status === 422) setError(response.data.errors[0].msg);
			}).then(() => setLoading(false));
	};

	return (
		<section id="register-panel">
			<h2>Create an Account</h2>
			<p className="error">{error}</p>
			<div>
				<input id="email" className="field" placeholder="Email" name="email" value={email} onChange={e => setEmail(e.target.value)} />
				<input id="password" className="field" type="password" name="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
				<input id="fname" className="field" placeholder="First name" name="fname" value={fname} onChange={e => setFName(e.target.value)} />
				<input id="lname" className="field" placeholder="Last name" name="lname" value={lname} onChange={e => setLName(e.target.value)} />
				<button id="main-action" onClick={submit}>SIGN UP</button>
				<div id="sub-action">
					<p>or </p>
					<a href="/login">Login</a>
				</div>
			</div>
		</section>
	);
}
