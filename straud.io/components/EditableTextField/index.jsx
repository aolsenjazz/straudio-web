import { useState, Fragment } from 'react';

export default function EditableTextField(props) {
	return (
		<Fragment>
			 { props.edit ? null : <p>{props.value}</p>}
			 { props.edit ? <input name={props.name} value={props.value} onChange={e => props.setter(e.target.value)} /> : null }
		</Fragment>
	);
}