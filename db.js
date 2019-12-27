const fs = require("fs");
const mysql = require("mysql");

let db;
function connectDB() {
	const creds = JSON.parse(fs.readFileSync("creds.json")).mysql;
	db = mysql.createConnection({
		host: "localhost",
		user: creds.user,
		password: creds.pass,
		database: "inlog",
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
