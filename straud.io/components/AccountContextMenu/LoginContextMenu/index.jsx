export default function LoginContextMenu() {
	return (
		<div>
			<div id="main-action">
				<a href="/login">LOGIN</a>
			</div>
			<div id="sub-action">
				<p>or </p>
				<a href="/login?register">Make an Account</a>
			</div>
		</div>
	);
}