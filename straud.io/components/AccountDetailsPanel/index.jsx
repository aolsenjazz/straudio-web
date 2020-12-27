import { useState, useContext, useEffect } from 'react';

import LoadingPanel from './LoadingPanel';
import Redirecter from '../Redirecter';
import DetailsPanel from './DetailsPanel';

import useUserStatus from '../../hooks/use-user-status';

import './account-details-panel.css';

export default function AccountDetailsPanel(props) {
	const [error, setError] = useState('');
	const user = useUserStatus();

	return (
		<section id="account-details-panel">
			<h2>Account Settings</h2>
			{ user === null      ? <Redirecter url="/login" /> : null }
			{ user === undefined ? <LoadingPanel /> : null }
			{ user               ? <DetailsPanel user={user} /> : null }
		</section>
	);
}