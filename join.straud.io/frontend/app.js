const express = require('express');
const HttpServer = require('./http-server');

let httpServer = new HttpServer({
	useTls: process.env.USE_TLS === 'true',
	host: process.env.HOST,
	signalPort: process.env.SIGNAL_PORT,
	httpPort: process.env.JOIN_PORT,
	analyticsPort: process.env.ANALYTICS_PORT,
});

httpServer.start();
