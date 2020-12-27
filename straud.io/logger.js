const debug = require('debug');

class Logger {

	constructor(subspace) {
		 this.debug = debug(`straudio:${subspace}`);

		 this.info = this.info.bind(this);
	}

	info(msg) {
		this.debug(`[INFO] ${msg}`)
	}

	warn(msg) {
		this.debug(`[WARN] ${msg}`);
	}

	error(msg) {
		this.debug(`[ERROR] ${msg}`);
	}

}

module.exports = function(subspace) {
	return new Logger(subspace);
}