const express = require('express');
const logger = require('../logger')('HttpServer');
const register = require('@react-ssr/express/register');

logger.info('Starting http server...')

let app = express();

app.use(express.static('./public'));

register(app);

app.get('/', (req, res) => {
	res.render('index', { 
		host: process.env.HOST, 
		signalUrl: process.env.SIGNAL_URL, 
		apiUrl: process.env.API_URL
	});
});

app.listen(process.env.PORT, () => {
	logger.info(`http server running on port ${process.env.PORT}`);
});
