import React from 'react';
import { Head } from '@react-ssr/express';

import Header from '../components/Header';
import LoginRegisterPanel from '../components/LoginRegisterPanel';

import DefaultContext from '../default-context';
import Api from '../api';

import './login.css';
import './global.css';

export default function Login(props) {
	return (
		<React.Fragment>
			<Head>
				<title>{props.title}</title>
			</Head>

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