import isMobile from 'ismobilejs';

function watchVisibility(visibilityChangeCb) {
	var hidden, visibilityChange;
	if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
		hidden = "hidden";
		visibilityChange = "visibilitychange";
	} else if (typeof document.msHidden !== "undefined") {
		hidden = "msHidden";
		visibilityChange = "msvisibilitychange";
	} else if (typeof document.webkitHidden !== "undefined") {
		hidden = "webkitHidden";
		visibilityChange = "webkitvisibilitychange";
	}

	function handleVisibilityChange() {
		if (document[hidden]) {
			visibilityChangeCb(false);
		} else {
			visibilityChangeCb(true);
		}
	}

	document.addEventListener(visibilityChange, handleVisibilityChange, false);
}

/**
 * As of 7/29/2020 this is still unsupported by most browsers :(
 */
function watchConnectionChanges(connectionChangeCb) {
	if (navigator.connection) {
		navigator.connection.onchange = (e) => {
			connectionChangeCb();
		}
	} else {
		console.log('navigator.connection unsupported');
	}
}

function watchConnectivity(connectivityChangeCb) {

	function onConnectivityChange() {
		let online = event.type === 'online' ? true : false;

		connectivityChangeCb(online);
	}

	window.addEventListener('online', onConnectivityChange);
	window.addEventListener('offline', onConnectivityChange);
}

/**
 * Watches changes to internet change and if mobile, visibility.
 */
function watch(disruptedCb) {
	if (isMobile(window.navigator).any) {
		watchVisibility((visible) => {
			if (!visible) {
				disruptedCb('visibility');
			} else {
				window.location.reload(false);
			}
		});
	}

	watchConnectionChanges(() => {
		// noop. we want watchConnecivity to handle disconnects since it's more widely available
	});

	watchConnectivity((isOnline) => {
		if (!isOnline) {
			disruptedCb('connectivity');
		} else {
			window.location.reload(false);
		}
	});
}

export default watch;