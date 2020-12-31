import React from 'react';
import { Head } from '@react-ssr/express';

import Favicon from 'react-favicon';
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
				<title>Straudio - Forgot</title>
			</Head>
			<Favicon url="images/icon.ico" />

			<DefaultContext.Provider value={{api: new Api(props.api)}}>
				<Header />
				<ForgotPanel />
			</DefaultContext.Provider>
		</React.Fragment>
	);
}