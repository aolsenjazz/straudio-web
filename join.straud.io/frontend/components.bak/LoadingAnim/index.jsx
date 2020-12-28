import React from 'react';
import './loading-anim.css';

class LoadingAnim extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
		);
	}

}

export default LoadingAnim;