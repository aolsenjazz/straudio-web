import React from 'react';
import { Head } from '@react-ssr/express';

import Header from '../components/Header';
import AccountDetailsPanel from '../components/AccountDetailsPanel';
import useUserStatus from '../hooks/use-user-status';

import DefaultContext from '../default-context';
import Api from '../api';

import './global.css';
import './account.css';

export default function Account(props) {
	return (
		<React.Fragment>
			<Head>
				<title>{props.title}</title>
			</Head>

			<DefaultContext.Provider value={{
				api: new Api(props.api), 
				host: props.host,
			}}>
				<Header showLogin={true} />
				<div id="main">
					<section id="content-wide">
						<AccountDetailsPanel />
					</section>
				</div>
			</DefaultContext.Provider>
		</React.Fragment>
	);
}