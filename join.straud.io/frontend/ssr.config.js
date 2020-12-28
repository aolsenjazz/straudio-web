const path = require('path');

module.exports = {
	id: 'default',
	distDir: '.ssr',
	viewsDir: './views',
	staticViews: [],
	webpack: (config, env) => {
		return config;
	},
};
