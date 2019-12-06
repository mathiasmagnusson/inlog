const mysql = require("mysql");

let db;
function connectDB() {
	db = mysql.createConnection({
		host: "localhost",
		user: "inlog",
		password: "1_?65cn<T8I6gPku",
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
