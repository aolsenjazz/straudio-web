const nodemailer = require('nodemailer');
const aws = require('aws-sdk');
const EmailLiterals = require('./emails/email-literals.js');

class MailService {

	constructor() {
		aws.config.update({region:'us-east-2'});
		this.transporter = nodemailer.createTransport({
			SES: new aws.SES({apiVersion: '2010-12-01'})
		});
	}

	sendPasswordReset(email, token) {
		this.transporter.sendMail({
			from: '"Alex at Straud.io" alex@straud.io',
			to: email,
			subject: 'Reset Password',
			text: 'You requested a password reset for Straud.io',
			html: EmailLiterals.forgot(email, token),
		}, (err, info) => {

		});
	}
}

module.exports = function() {
	return new MailService();
}