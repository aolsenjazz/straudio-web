module.exports = {
	apps:[
		{
			name: 'straudio-signal-server',
			script: 'app.js',
			watch: true,
			env: {
				USE_TLS: false,
				FULLCHAIN: '/path/to/fullchain.pem (not used in localhost)',
				PRIVKEY: '/path/to/privkey.pem (not used in localhost)',
				PORT: 4443,
				DEV_SERVER_PORT: 8890,

				DEBUG: 'straudio:*',
			}
		}
	]
}
