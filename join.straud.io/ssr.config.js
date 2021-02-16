const path = require('path');

module.exports = {
	id: 'default',
	distDir: '.ssr',
	viewsDir: './views',
	staticViews: [],
	webpack: (config, env) => {
		config.devServer = {
			port: process.env.DEV_SERVER_PORT | 8888
		}
		return config;
	},
};
