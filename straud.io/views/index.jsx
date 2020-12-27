import React from 'react';
import { Head } from '@react-ssr/express';
import './index.css';

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
					<title>{this.props.title}</title>
				</Head>
				
			</React.Fragment>
		);
	}

}

export default Index;
