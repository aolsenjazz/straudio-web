import { useState, useEffect, useContext } from 'react';

import DefaultContext from '../DefaultContext';

import Cookies from 'js-cookie';

export default function useUserStatus() {
	const ctx = useContext(DefaultContext);

	const [user, setUser] = useState(undefined);

	useEffect(() => {
		let auth = Cookies.get('auth', { domain: ctx.host });
		
		ctx.api.getMe(auth)
			.then((user) => setUser(user))
			.catch(() => setUser(null));
	}, []);

	return user;
}