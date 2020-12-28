module.exports = {
	apps:[
		{
			name: 'join.straud.io',
			script: 'app.js',
			watch: true,
			env: {
				HOST: 'localhost',
				PORT: 3000,

				SIGNAL_URL: 'ws://localhost:4443',

				DEBUG: 'straudio:*',
			}
		}
	]
}
