import { useEffect, Fragment } from 'react';
import { Head } from '@react-ssr/express';
import Favicon from 'react-favicon';
import Logger from '@Services/logger';
import debug from 'debug';

import ServicesContainer from '@Components/ServicesContainer';
import JoinApp from '@Components/JoinApp';

import useBrowserCompat from '@Hooks/use-browser-compat';

import './global.css';

export default function Home(props) {
	const browserCompat = useBrowserCompat();
	
	useEffect(() => {
		debug.disable('sockjs-client');
		debug.enable(props.debug);
	}, []);

	return (
		<Fragment>
			<Head>
				<title>Straudio - Join</title>
			</Head>
			<Favicon url="images/icon.ico" />
			{ browserCompat.compat === true  ? 
				<ServicesContainer {... props}>
					<JoinApp />
				</ServicesContainer> 
				: 
				null 
			}
			{ browserCompat.compat === false ? <h1>noncompat</h1> : null }
		</Fragment>
	);
}


		