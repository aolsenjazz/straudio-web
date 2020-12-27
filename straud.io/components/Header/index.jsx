import { useState, useEffect, useContext } from 'react';

import AccountIcon from '../AccountIcon';


import './header.css';

export default function Header(props) {

	return (
		<header>
			<img id="logo" src="/images/logo.svg"/>
			<nav>
				<div className="nav-item"><a href="/">HOME</a></div>
				<div className="nav-item"><a href="https://demo.straud.io">DEMO</a></div>
				<div className="nav-item"><a href="/support">SUPPORT</a></div>
			</nav>
			
			{props.showLogin ? <AccountIcon /> : null}
		</header>
	);
}
