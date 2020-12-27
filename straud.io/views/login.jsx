import React from 'react';
import { Head } from '@react-ssr/express';

import Header from '../components/Header';
import LoginRegisterPanel from '../components/LoginRegisterPanel';

import DefaultContext from '../DefaultContext';
import Api from '../api';

import './login.css';
import './global.css';

class Login extends React.Component {

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

				<DefaultContext.Provider value={{
					api: new Api(this.props.api), 
					host: process.env.HOST,
				}}>
					<Header showLogin={true} />
					<section id="main">
					<LoginRegisterPanel />
					</section>
				</DefaultContext.Provider>
			</React.Fragment>
		);
	}

}

export default Login;
