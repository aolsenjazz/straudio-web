const logger = require('../logger')('HttpServer');
const express = require('express');
const http = require('http');
const https = require('https');
const register = require('@react-ssr/express/register');

// Not using the API right now
// const db = require('./db')();
// const apiRouter = require('./routes/api')(db);

class HttpServer {

	constructor(config={}) {
		logger.info('starting http server...')

		let app = express();

		app.use(express.static('./public'));

		register(app);

		app.get('/', (req, res) => {
			res.render('join', { title: 'Straudio', useTls: config.useTls, host: config.host, 
				signalPort: config.signalPort, analyticsPort:  config.analyticsPort});
		});

		// not using API right now
		// app.use('/api', apiRouter);

		this.app = app;
		this.port = config.httpPort;

		this.start = this.start.bind(this);
	}

	start() {
		this.app.listen(this.port, () => {
			logger.info(`http server running on port ${this.port}`);
		});
	}

}

module.exports = HttpServer;
