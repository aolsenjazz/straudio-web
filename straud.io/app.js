const express = require('express');
const register = require('@react-ssr/express/register');

console.log('Starting http server...');

let app = express();

app.use(express.static('./public'));

register(app);

app.get('/', (req, res) => {
	res.render('index', {  });
});

app.get('/login', (req, res) => {
	res.render('login', { api: process.env.API, host: process.env.HOST });
});

app.get('/forgot', (req, res) => {
	res.render('forgot', { api: process.env.API, host: process.env.HOST });
});

app.get('/account', (req, res) => {
	res.render('account', { api: process.env.API, host: process.env.HOST });
});

app.get('/demo', (req, res) => {
	res.render('demo', { 
		api: process.env.API_URL, 
		host: process.env.HOST, 
		signalUrl: process.env.SIGNAL_URL, 
		debug: process.env.DEBUG,
	});
});

app.listen(process.env.ROOT_PORT, () => {
	console.log(`http server running on port ${process.env.ROOT_PORT}`);
});