const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

module.exports = function(db) {
	router.get('/', function(req, res) {
	  res.send('gtfo');
	});

	router.post('/users', [
		check('email').isEmail().normalizeEmail()
			.withMessage('Please enter a valid email.'),
		check('fname').isLength({min: 1, max: 255}).trim()
			.withMessage('Please enter a first name.'),
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
			db.createUser(req.body.email, hash, req.body.fname, req.body.lname, auth, (success, id) => {
				if (success) {
					res.json({
						email: req.body.email, fname: req.body.fname, lname: req.body.lname, auth: auth
					});
				} else {
					let errors = [{
						msg: 'Email is already taken.',
						value: req.body.email,
						param:'email',
						location: 'body'
					}]

					res.status(422).json({ errors: errors});
				}
			});
		});
	});

	router.post('/login', [
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

		db.getUser(req.body.email, (success, user) => {
			bcrypt.compare(req.body.password, user.password, (err, doesItMatch) => {
				if (doesItMatch) {
					res.json({auth: user.auth})
				} else {
					let errors = [{
						msg: 'Incorrect email or password.',
						location: 'body'
					}]

					res.status(401).json({ errors: errors});
				}
			});
		});
	});

	return router;
}