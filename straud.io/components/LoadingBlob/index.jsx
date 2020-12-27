export default function LoadingBlob(props) {
	return (
		<div className="loading-block" style={{backgroundColor: props.color, borderRadius: '10px', height: props.height, width: props.width}}></div>
	);
}