import Axios from 'axios';

class Api {
	
	constructor(endpoint) {
		this.endpoint = endpoint;
	}

	getMe(auth) {
		return new Promise((resolve, reject) => {
			Axios.get(`${this.endpoint}/me?auth=${auth}`)
				.then(response => {
					resolve(response.data);
				}).catch(err => {
					if (err.response.status == 422 || err.response.status == 400) {
						// bad UUID, init login/register. no-op
					} else {
						// super bad error
						console.error(`Super bad error checking auth: ${err}`);
					}

					reject(err.response);
				});
		});
	}

	login(email, password) {
		return new Promise((resolve, reject) => {
			Axios.post(`${this.endpoint}/login`, {
				email: email,
				password: password
			}).then(response => {
				resolve(response);
			}).catch(err => {
				reject(err.response);
			});
		});
	}

	register(email, password, fname, lname) {
		return new Promise((resolve, reject) => {
			Axios.post(`${this.endpoint}/users`, {
				email: email,
				password: password,
				fname: fname,
				lname: lname,
			}).then(response => {
				resolve(response);
			}).catch(err => {
				reject(err.response);
			});
		});
	}

	checkForgotToken(token) {
		return new Promise((resolve, reject) => {
			Axios.get(`${this.endpoint}/forgot?token=${token}`)
				.then(response => {
					resolve(true);
				}).catch(err => {
					reject(err.response);
				});
		});
	}

	resetPassword(token, newPassword) {
		return new Promise((resolve, reject) => {
			Axios.post(`${this.endpoint}/reset`, {
				token: token,
				password: newPassword
			}).then(response => {
				resolve(response.data.user);
			}).catch(err => {
				reject(err.response);
			})
		});
	}

	createResetRequest(email) {
		return new Promise((resolve, reject) => {
			Axios.post(`${this.endpoint}/forgot`, {
				email: email
			}).then(response => {
				resolve(true);
			}).catch(err => {
				reject(err.response);
			});
		});
	}

	updateAccount(email, fname, lname, auth) {
		return new Promise((resolve, reject) => {
			Axios.put(`${this.endpoint}/users`, {
				email: email,
				fname: fname,
				lname: lname,
				auth: auth,
			}).then(response => {
				resolve(response);
			}).catch(err => {
				reject(err.response);
			});
		});
	}
}

export default Api;