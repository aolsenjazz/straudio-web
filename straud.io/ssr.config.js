module.exports = {
	id: 'default',
	distDir: '.ssr',
	viewsDir: './views',
	staticViews: [],
	webpack: (config, env) => {
		config.devServer = {
			port: process.env.DEV_SERVER_PORT | 8888
		} // remember to modify @react-ssr/packages/core/dist/development/development-xxxxxx.js !!
		return config;
	},
};
