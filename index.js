const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");

const server = express();
const api = express();

server.use(express.json());
server.use("/", express.static("public"));
server.use("/api/", api);

let db;
function connectDB() {
	db = mysql.createConnection({
		host: "localhost",
		user: "inlog",
		password: "1_?65cn<T8I6gPku",
		database: "inlog",
	});

	db.connect(err => {
		if (err)
			setTimeout(connectDB, 2000);
	});

	db.on("error", err => {
		setTimeout(connectDB, 2000);
	});
}
connectDB();

api.get("/hello-there", (req, res) => {
	res.send("general kenobi");
});

api.post("/register", (req, res) => {
	console.log(req.body);
	res.send({
		"ok": "great",
	});
});

server.listen(4433, "127.0.0.1", () => console.log("server started"));
