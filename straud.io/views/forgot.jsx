import React from 'react';
import { Head } from '@react-ssr/express';

import Header from '@Components/Header';
import ForgotPanel from '@Components/ForgotPanel';

import DefaultContext from '@Root/default-context';
import Api from '@Services/api';

import './forgot.css';
import './global.css';

export default function Forgot(props) {
	return (
		<React.Fragment>
			<Head>
				<title>{props.title}</title>
			</Head>

			<DefaultContext.Provider value={{api: new Api(props.api)}}>
				<Header />
				<ForgotPanel />
			</DefaultContext.Provider>
		</React.Fragment>
	);
}