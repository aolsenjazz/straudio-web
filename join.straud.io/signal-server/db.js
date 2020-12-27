const mysql = require('mysql');
const validator = require('validator');

const DEFAULT_CONFIG = {
	'connectionLimit': 5,
	'host': process.env.DB_HOST,
	'user': process.env.DB_USER,
	'password': process.env.DB_PASS,
	'port': process.env.DB_PORT,
	'database': process.env.DB_NAME
};

class MySqlDatabase {

	constructor(params) {
		this.pool = mysql.createPool(params);
		
		this.createUser.bind(this);
		this.deleteUser.bind(this);
		this.updateUser.bind(this);
		this.login.bind(this);
	}

	createUser(email, password, fname, lname, auth, cb) {
		this.pool.getConnection(function(error, connection) {
			let stmt = `INSERT INTO users (email, password, fname, lname, auth) VALUES (?,?,?,?,?)`;
			let vals = [email, password, fname, lname, auth];
			
			connection.query(stmt, vals, (err, results, fields) => {
				let success = (err) ? false : true;
				if (err) cb(success);
				else cb(success, results.insertId);
			});

			connection.release();
		});
	}

	deleteUser(id, cb) {
		let stmt, vals;
		if (!id) {
			throw Error('No ID supplied while deleting User');
		} else {
			stmt = `DELETE FROM users WHERE ID = ?`;
			vals = [id];
		}

		this.pool.getConnection((err, connection) => {
			connection.query(stmt, vals, (err, results) => {
				let success = (err) ? false : true;
				cb(success);
			});

			connection.release();
		});
	}

	updateUser(id, email, password, fname, lname, auth, cb) {
		this.pool.getConnection(function(error, connection) {
			let stmt = `UPDATE users SET email = ?, password = ?, fname = ?, lname = ?, auth = ? WHERE id = ?`;
			let vals = [email, password, fname, lname, auth, id];
			
			connection.query(stmt, vals, (err, results) => {
				let success = results.affectedRows == 1 ? true : false;
				cb(success);
			});

			connection.release();
		});
	}

	login(email, password, cb) {
		this.pool.getConnection(function(error, connection) {
			let stmt = `SELECT auth FROM users WHERE email = ? AND password = ?`;
			let vals = [email, password];
			
			connection.query(stmt, vals, (err, results) => {
				if (results.length == 1) cb(true, results[0].auth);
				else cb(false);
			});

			connection.release();
		});
	}

	getUser(emailOrAuthToken, cb) {
		this.pool.getConnection(function(error, connection) {
			let stmt = '';
			if (validator.isEmail(emailOrAuthToken)) {
				stmt = `SELECT * FROM users WHERE email = ?`;	
			} else {
				stmt = `SELECT * FROM users WHERE auth = ?`;
			}
			
			let vals = [emailOrAuthToken];
			
			connection.query(stmt, vals, (err, results) => {
				let success = results.length == 1;
				if (success) cb(success, results[0]);
				else cb(success);
			});

			connection.release();
		});
	}
}

module.exports = (configOrNone) => {
	if (configOrNone) return new MySqlDatabase(configOrNone);
	else return new MySqlDatabase(DEFAULT_CONFIG);
}