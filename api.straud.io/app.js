const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./logger')('ApiServer');
const fs = require('fs');
const WaveFile = require('wavefile').WaveFile;

const { check, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const cors = require('cors');

const Db = require('./db');
const Mailer = require('./mail-service');

const MS_IN_DAY = 86400000;

const wavBuffer = fs.readFileSync('./demo.wav', null);
let wavFile = new WaveFile(wavBuffer);
let demoSamples = wavFile.getSamples(true, Int16Array);

(async function() {
	logger.info('starting api server...')

	let app = express();
	let db = await Db();
	let mailer = Mailer();

	app.use(bodyParser.json());
	app.use(cors({
		origin: process.env.CORS_POLICY,
		optionsSuccessStatus: 200,
	}));
	app.options('*', cors({
		origin: process.env.CORS_POLICY,
		optionsSuccessStatus: 200,
	}));

	app.get('/', (req, res) => {
		res.send('welcome to the API! gtfo');
	});

	app.post('/users', [
		check('email').isEmail().normalizeEmail()
			.withMessage('Please enter a valid email.'),
		check('fname').isLength({min: 1}).trim()
			.withMessage('Please enter a first name.'),
		check('fname').isLength({max: 255}).trim()
			.withMessage('First name must be less than 255 characters.'),
		check('lname').isLength({min: 1, max: 255}).trim()
			.withMessage('Please enter a last name.'),
		check('password')
			.matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/)
			.withMessage('Password must be 6-20 characters with at least one lowercase letter, one uppercase letter, and one number.')
	], (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let auth = uuidv4();
		let saltRounds = 12;

		bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
			db.createUser(req.body.email, hash, req.body.fname, req.body.lname, auth)
				.then((id) => {
					res.json({
						email: req.body.email, fname: req.body.fname, lname: req.body.lname, auth: auth
					});
				})
				.catch(() => {
					res.status(422).json(error('Email is already taken.', 'body'));
				});
		});
	});

	app.put('/users', [
		check('email').isEmail().normalizeEmail()
			.withMessage('Please enter a valid email.'),
		check('fname').isLength({min: 1}).trim()
			.withMessage('Please enter a first name.'),
		check('fname').isLength({max: 255}).trim()
			.withMessage('First name must be less than 255 characters.'),
		check('lname').isLength({min: 1, max: 255}).trim()
			.withMessage('Please enter a last name.'),
		check('auth').isUUID()
			.withMessage('Please enter a valid auth token.'),
	], (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		db.getUser(req.body.auth)
			.then((user) => db.updateUser(user.id, req.body.email, user.password, req.body.fname, req.body.lname, user.auth))
			.then((id) => res.json('success'))
			.catch((err) => {
				res.status(401).json(error('Email is already in use.', 'body'));
			});
	});

	app.post('/login', [
		check('email').isEmail().normalizeEmail()
			.withMessage('Please enter a valid email.'),	
		check('password').isLength({min: 1})
			.withMessage('Please enter a password.'),
		check('password').isLength({max: 255})
			.withMessage('Password must be less than 255 characters.')
	], (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		db.getUser(req.body.email)
			.then((user) => {
				bcrypt.compare(req.body.password, user.password, (err, doesItMatch) => {
					if (doesItMatch) {
						res.json({auth: user.auth});
					} else {
						res.status(401).json(error('Incorrect email or password.', 'body'));
					}
				});
			})
			.catch((err) => {
				res.status(401).json(error('Incorrect email or password.', 'body'));
			});
	});

	app.get('/me', [
		check('auth').isUUID()
	], (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let auth = req.query.auth;

		db.getUser(auth)
			.then((user) => res.json({email: user.email, fname: user.fname, lname: user.lname, name: `${user.fname} ${user.lname}`}))
			.catch(() => res.status(400).json(error('Auth does not exist.', 'query')));
	});

	app.get('/forgot', [
		check('token').isUUID()
			.withMessage('Invalid token')
	], (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let token = req.query.token;

		db.getResetRequest(token)
			.then((resetRequest) => {
				let now = Date.now();
				let then = new Date(resetRequest.created_at);
				let thenMs = then.getTime();

				if (now - then > MS_IN_DAY) {
					res.status(400).json(error('Reset time expired. Please submit another reset request.', 'query'));
				} else {
					res.status(200).json('success');
				}
			});
	});

	app.post('/forgot', [
		check('email').isEmail().normalizeEmail()
			.withMessage('Please enter a valid email.'),
	], (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let token = uuidv4();
		let email = req.body.email;

		db.getUser(email)
			.then(() => db.createResetRequest(token, email))
			.then(() => {
				mailer.sendPasswordReset(email, token);
				res.status(200).json('success');
			})
			.catch((err) => res.status(422).json(error('Email does not exist.', 'query')));
	});

	app.post('/reset', [
		check('token').isUUID()
			.withMessage('Invalid token'),
		check('password')
			.matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/)
			.withMessage('Password must be 6-20 characters with at least one lowercase letter, one uppercase letter, and one number.')
	], (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let token = req.body.token;
		let password = req.body.password;
		let saltRounds = 12;

		bcrypt.hash(password, saltRounds, (err, hash) => {
			db.getResetRequest(token)
				.then((resetRequest) => db.getUser(resetRequest.email))
				.then((user) => db.updateUser(user.id, user.email, hash, user.fname, user.lname, user.auth))
				.then((id) => db.getResetRequest(token))
				.then((resetRequest) => db.getUser(resetRequest.email))
				.then((user) => {
					res.json({
						email: user.email, fname: user.fname, lname: user.lname, auth: user.auth
					});
				});
		});

	});

	app.get('/demo', (req, res) => {
		let bytesPerInt16 = 2;
		let nChannels = 2;
		let offsetIndex = 0 | req.query.offset;
		let offset = offsetIndex * (44100 * nChannels * bytesPerInt16 / 10);
		let chunk = demoSamples.buffer.slice(offset, offset + (44100 * nChannels * bytesPerInt16 / 10));
		let int16 = new Int16Array(chunk);
		res.send(Buffer.from(chunk, 'binary'))
	});

	app.listen(process.env.API_PORT, () => {
		logger.info(`api server running on port ${process.env.API_PORT}`);
	});
})();

function error(msg, location) {
	return { errors: [{
			msg: msg,
			location: location,
		},
	]};
}