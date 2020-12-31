import { useEffect, Fragment } from 'react';
import { Head } from '@react-ssr/express';

import JoinApp from '@Components/JoinApp';
import ServicesContainer from '@Components/ServicesContainer';

import useBrowserCompat from '@Hooks/use-browser-compat';

import './global.css';

export default function Home(props) {
	const browserCompat = useBrowserCompat();

	return (
		<Fragment>
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


		