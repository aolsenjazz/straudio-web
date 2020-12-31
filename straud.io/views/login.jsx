import React from 'react';
import { Head } from '@react-ssr/express';

import Favicon from 'react-favicon';
import Header from '@Components/Header';
import LoginRegisterPanel from '@Components/LoginRegisterPanel';

import DefaultContext from '@Root/default-context';
import Api from '@Services/api';

import './login.css';
import './global.css';

export default function Login(props) {
	return (
		<React.Fragment>
			<Head>
				<title>Straudio - Login</title>
			</Head>
			<Favicon url="images/icon.ico" />

			<DefaultContext.Provider value={{
				api: new Api(props.api), 
				host: props.host,
			}}>
				<Header showLogin={false} />
				<section id="main">
					<LoginRegisterPanel />
				</section>
			</DefaultContext.Provider>
		</React.Fragment>
	);
}