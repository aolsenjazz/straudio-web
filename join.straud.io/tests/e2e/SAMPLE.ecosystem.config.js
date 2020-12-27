module.exports = {
	apps:[
		{
			name: 'straudio-tests',
			script: 'all.js',
			watch: false,
			autorestart: false,
			env: {
				USE_TLS: false,

				DB_HOST: 'sample.host',
				DB_PORT: 3306,
				DB_USER: 'sample.user',
				DB_PASS: 'sample.pass',
				DB_NAME: 'sample.name',

				
				HOST: '127.0.0.1',
				SIGNAL_PORT: 4443,

				DEBUG: 'straudio:*',
			}
		}
	]
}
