module.exports = {
	apps:[
		{
			name: 'join.straud.io',
			script: 'app.js',
			watch: true,
			env: {
				USE_TLS: false,

				DB_HOST: 'sample.host',
				DB_PORT: 3306,
				DB_USER: 'sample.user',
				DB_PASS: 'sample.pass',
				DB_NAME: 'sample.name',

				HOST: '127.0.0.1',

				SIGNAL_PORT: 4443,
				JOIN_PORT: 3000,
				ROOT_PORT: 3001,

				DEBUG: 'straudio:*',
			}
		}
	]
}
