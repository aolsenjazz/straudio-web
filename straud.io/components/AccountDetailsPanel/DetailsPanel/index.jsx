import { useState, useContext, useEffect } from 'react';

import EditableTextField from '../../EditableTextField';
import DefaultContext from '../../../default-context';
import useAuth from '../../../hooks/use-auth';

import './details-panel.css';

export default function DetailsPanel(props) {
	const ctx = useContext(DefaultContext);

	const [error, setError] = useState(undefined);
	const [edit, setEdit] = useState(false);

	const [fname, setFName] = useState(props.user.fname);
	const [lname, setLName] = useState(props.user.lname);
	const [email, setEmail] = useState(props.user.email);

	const auth = useAuth();

	const save = () => {
		if (edit) {
			ctx.api.updateAccount(email, fname, lname, auth)
				.then((response) => {})
				.catch((response) => setError(response.data.errors[0].msg));
		}

		setEdit(!edit);
	}

	return (
		<div id="details-panel">
			<p className="error">{error}</p>
			<div id="details">
				<div className="details-row">
					<p className="header">First Name:</p>
					<EditableTextField value={fname} setter={setFName} name="fname" edit={edit} />
				</div>
				<div className="details-row">
					<p className="header">Last Name:</p>
					<EditableTextField value={lname} setter={setLName} name="lname" edit={edit} />
				</div>
				<div className="details-row">
					<p className="header">Email:</p>
					<EditableTextField value={email} setter={setEmail} name="email" edit={edit} />
				</div>
				<div className="details-row">
					<p className="header">Password:</p>
					{ edit ? <a href="/forgot">Reset Password</a> : <p className="value">**********</p> }
				</div>
			</div>
			<button id="main-action" onClick={save}>{edit ? 'SAVE' : 'EDIT'}</button>
		</div>
	);
}