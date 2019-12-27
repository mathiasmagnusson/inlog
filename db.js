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
