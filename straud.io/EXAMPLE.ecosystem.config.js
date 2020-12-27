module.exports = {
	apps:[
		{
			name: 'straud.io',
			script: 'app.js',
			watch: true,
			env: {
				USE_TLS: false,

				HOST: '127.0.0.1',
				API: 'https://api.straud.io',

				SIGNAL_PORT: 4443,
				JOIN_PORT: 3000,
				ROOT_PORT: 3001,

				DEBUG: 'straudio:*',
			}
		}
	]
}
