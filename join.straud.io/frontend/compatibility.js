const Bowser = require('bowser');

// While it would be nice to provide a more detailed reason for incompatibility, it would be such
// a pain to use this method. Can probably delete this in thee future.
function compatCheckBrowser() {

	let browser = Bowser.getParser(window.navigator.userAgent);
	let details = Bowser.parse(window.navigator.userAgent);

	const invalidBrowser = ['Internet Explorer',
		'Opera Mini',
		'QQ Browser',
		'Baidu Browser'
	].includes(browser.name);

	if (invalidBrowser) {
		return {
			valid: false,
			message: `${browser.getBrowserName()} doesn\'t work with Straudio. Try Chrome, Firefox, or Safari.`
		};
	}

	// manually check to make sure that iOS version is >=12.2. more useful to user to inform if os is too low level vs browser
	if (details.os.name.toLowerCase() == 'ios') {
		let iosVersion = parseFloat(details.os.version);
		if (iosVersion < 12.2) {
			return {
				valid: false,
				message: `Your iOS version is too low. Please update your device to use Straudio.`,
			};
		}
	}

	const isValidVersion = browser.satisfies({
		desktop: {
			'chrome': '>=56',
			'firefox': '>=44',
			'edge': '>=79',
			'safari': '>=12.1',
			'opera': '>=43',
		},
		mobile: {
			'safari': '>=12.1',
			'android browser': '>=81',
			'opera': '<=46',
			'samsung internet for android': '>=4',
		},
		tablet: {
			'safari': '>=12.1',
			'android browser': '>=81',
			'firefox': '>=68',
			'chrome': '>=68',
			'opera': '<=46',
			'samsung internet for android': '>=4',
		},
		ios: {
			'chrome': '>=86',
			'firefox': '>=29',
		},
		android: {
			'chrome': '>=68',
			'firefox': '>=82',
		},
	});

	if (!isValidVersion) {
		return {
			valid: false,
			message: `This version of ${browser.getBrowserName()} doesn't work with Straudio. Please update.`,
		};
	}

	return {
		valid: true
	};
}

function compatCheckFeature() {
	let valid = window.RTCPeerConnection && new window.RTCPeerConnection().createDataChannel;
	return {
		valid: valid,
		message: 'Browser incompatible. Use a current version of Chrome, Firefox, or Safari.'
	}
}

export default compatCheckBrowser;
