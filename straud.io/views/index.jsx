import React from 'react';
import { Head } from '@react-ssr/express';
import './index.css';

import Favicon from 'react-favicon';

class Index extends React.Component {

	constructor(props) {
		super();

	}

	componentDidMount() {
		
	}

	render() {
		return (
			<React.Fragment>
				<Head>
					<title>Straudio</title>
				</Head>

				<Favicon url="images/icon.ico" />
				
			</React.Fragment>
		);
	}

}

export default Index;
