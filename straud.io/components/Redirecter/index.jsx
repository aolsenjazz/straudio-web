import { useEffect } from 'react'

// Just redirects to the given URL when rendered.
export default function Redirecter(props) {
	useEffect(() => {
		window.location = props.url;
	}, []);

	return (<div />);
}