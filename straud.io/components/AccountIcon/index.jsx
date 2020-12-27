import { useState, useEffect, useContext } from 'react';

import AccountContextMenu from '../AccountContextMenu';

import useUserStatus from '../../hooks/use-user-status';

export default function AccountIcon(props) {
	const [showMenu, setShowMenu] = useState(false);
	const user = useUserStatus();

	return (
		<div id="account" className="nav-item" onClick={() => setShowMenu(!showMenu)}>
			<img src="/images/person.svg" />

			{showMenu ? <AccountContextMenu user={user} /> : null}
		</div>
	);
}