import React from 'react';
import { Head } from '@react-ssr/express';

import Favicon from 'react-favicon';
import Header from '@Components/Header';

import DemoServicesContainer from '@Components/DemoServicesContainer';
import JoinApp from '@Components/JoinApp';

import './login.css';
import './global.css';

export default function Demo(props) {
	return (
		<React.Fragment>
			<Head>
				<title>Straudio - Login</title>
			</Head>
			<Favicon url="images/icon.ico" />

			<DemoServicesContainer {... props}>
				<JoinApp />
			</DemoServicesContainer>
		</React.Fragment>
	);
}