const mysql = require('promise-mysql');
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

	constructor(pool) {
		this.pool = pool;
	}

	static async init(params) {
		if (params === undefined) {
			params = DEFAULT_CONFIG;
		}

		let pool = await mysql.createPool(params);
		return new MySqlDatabase(pool);
	}

	async createUser(email, password, fname, lname, auth) {
		let stmt = `INSERT INTO users (email, password, fname, lname, auth) VALUES (?,?,?,?,?)`;
		let vals = [email, password, fname, lname, auth];

		let conn = await this.pool.getConnection();
		let results = await conn.query(stmt, vals);
		let id = results.insertId;

		await conn.release();
		return id;
	}

	async deleteUser(id) {
		let stmt = `DELETE FROM users WHERE ID = ?`;
		let vals = [id];

		let conn = await this.pool.getConnection();
		let results = await conn.query(stmt, vals);
		let success = results.affectedRows === 1;

		await conn.release();
		return success ? id : Promise.reject('ID does not exist');
	}

	async updateUser(id, email, password, fname, lname, auth) {
		let stmt = `UPDATE users SET email = ?, password = ?, fname = ?, lname = ?, auth = ? WHERE id = ?`;
		let vals = [email, password, fname, lname, auth, id];

		let conn = await this.pool.getConnection();
		let results = await conn.query(stmt, vals);
		let success = results.affectedRows === 1;

		await conn.release();
		return success ? id : Promise.reject('ID does not exist');
	}

	async login(email, password) {
		let stmt = `SELECT auth FROM users WHERE email = ? AND password = ?`;
		let vals = [email, password];

		let conn = await this.pool.getConnection();
		let results = await conn.query(stmt, vals);
		let result = results.length === 1 ? results[0].auth : Promise.reject('bad credentials');

		await conn.release();
		return result;
	}

	async getUser(emailOrAuthToken) {
		let activeField = validator.isEmail(emailOrAuthToken) ? 'email' : 'auth';
		let stmt = `SELECT * FROM users WHERE ${activeField} = ?`;
		let vals = [emailOrAuthToken];

		let conn = await this.pool.getConnection();
		let results = await conn.query(stmt, vals);
		let result = results.length === 1 ? results[0] : Promise.reject(`${activeField} does not exist`);

		await conn.release();
		return result;
	}

	async createResetRequest(token, email) {
		let stmt = `INSERT INTO forgot (email, token) VALUES (?,?)`;
		let vals = [email, token];

		let conn = await this.pool.getConnection();
		let results = await conn.query(stmt, vals);
		let id = results.insertId;

		await conn.release();
		return id;
	}

	async getResetRequest(token) {
		let stmt = `SELECT * FROM forgot WHERE token = ?`;
		let vals = [token];

		let conn = await this.pool.getConnection();
		let results = await conn.query(stmt, vals);
		let result = results.length === 1 ? results[0] : Promise.reject(`token does not exist`);

		await conn.release();
		return result;
	}

	async deleteResetRequest(id) {
		let stmt = `DELETE FROM forgot WHERE ID = ?`;
		let vals = [id];

		let conn = await this.pool.getConnection();
		let results = await conn.query(stmt, vals);
		let success = results.affectedRows === 1;

		await conn.release();
		return success ? id : Promise.reject('ID does not exist');
	}
}

module.exports = MySqlDatabase.init;