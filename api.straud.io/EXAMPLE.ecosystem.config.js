module.exports = {
	apps:[
		{
			name: 'straudio-frontend',
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
				
				API_PORT: 3002,
				CORS_POLICY: 'https://straud.io',

				AWS_ACCESS_KEY_ID: 'lolnotforyou',
				AWS_SECRET_ACCESS_KEY: 'lolnotforyou',

				DEBUG: 'straudio:*',
			}
		}
	]
}
