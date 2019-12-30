const mysql = require("mysql");

const creds = require("./creds.js");

let db;
function connectDB() {
	const { host, user, pass, database } = creds.mysql;

	db = mysql.createConnection({
		host,
		user,
		password: pass,
		database,
	});

	db.connect(err => {
		if (err) {
			console.error("db.connect err => " + err);
			setTimeout(connectDB, 2000);
		}
	});

	db.on("error", err => {
		console.error("db.on(\"error\") => " + err);
		setTimeout(connectDB, 2000);
	});
}
connectDB();

class Database {
	constructor() {
		[
			`CREATE TABLE IF NOT EXISTS account (
				id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
				username VARCHAR(20) NOT NULL,
				email VARCHAR(40) NULL,
				password VARCHAR(60) NOT NULL
			)`,

			`CREATE TABLE IF NOT EXISTS fav_num (
				id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
				account_id INT NOT NULL,
				num INT NOT NULL,
				FOREIGN KEY (account_id) REFERENCES account(id)
			)`
		].forEach(q => {
			this.query(q)
				.catch(err => {
					console.error(err);
					process.exit(-1);
				});
		});
	}

	query(query, args) {
		return new Promise((res, rej) => {
			db.query(query, args, (err, rows) => {
				if (err)
					rej(err);
				else
					res(rows);
			});
		});
	}

	inner() {
		return db;
	}
}

module.exports = new Database();
