const express = require("express");
const bcrypt = require("bcrypt");

const db = require("./db.js");

const server = express();
const api = express();

server.use(express.json());
server.use("/", express.static("public"));
server.use("/api/", api);


api.get("/hello-there", (req, res) => {
	res.send("general kenobi");
});

api.post("/register", async (req, res) => {
	const { username, email, password } = req.body;

	try {
		const result = await db.query(
			"SELECT COUNT(*) as taken FROM account WHERE username = ?",
			username,
		);

		if (result[0].count > 0) {
			return res.status(402).send({ "msg": "username taken" });
		}
	}
	catch(e) {
		console.error(e);
		res.status(500).send({ msg: "internal server error" });
	}
});

server.use("/", (err, req, res, next) => {
	res.status(500).send({ msg: "internal server error" });
	console.error(err);
});

server.listen(4433, () => console.log("server started at http://locahost:4433"));
