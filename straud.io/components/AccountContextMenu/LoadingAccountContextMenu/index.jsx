import './loading-account-context-menu.css';

export default function LoadingAccountContextMenu() {
	return (
		<div id="loading-account-context-menu">
			<div id="main-action" className="loading-blob-blue loading-block"></div>
			<div id="sub-action" className="loading-blob-grey loading-block"></div>
			<div id="sub-action" className="loading-blob-grey loading-block"></div>
		</div>
	);
}