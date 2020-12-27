import { useState, useEffect, useContext } from 'react';

import DefaultContext from '../default-context';

import Cookies from 'js-cookie';

export default function useAuth() {
	const ctx = useContext(DefaultContext);

	const [auth, setAuth] = useState(undefined);

	useEffect(() => {
		setAuth(Cookies.get('auth', { domain: ctx.host }));
	}, []);

	return auth;
}