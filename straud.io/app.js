const express = require('express');
const logger = require('./logger')('HttpServer');
const register = require('@react-ssr/express/register');

logger.info('starting http server...')

let app = express();

app.use(express.static('./public'));

register(app);

app.get('/', (req, res) => {
	res.render('index', { title: 'Straudio' });
});

app.get('/login', (req, res) => {
	res.render('login', { title: 'Straud.io - Login', api: process.env.API, host: process.env.HOST });
});

app.get('/forgot', (req, res) => {
	res.render('forgot', { title: 'Straud.io - Forgot', api: process.env.API, host: process.env.HOST });
});

app.get('/account', (req, res) => {
	res.render('account', { title: 'Straud.io - Account', api: process.env.API, host: process.env.HOST });
});

app.listen(process.env.ROOT_PORT, () => {
	logger.info(`http server running on port ${process.env.ROOT_PORT}`);
});