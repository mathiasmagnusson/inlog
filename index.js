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

		if (result[0].taken > 0)
			return res.status(402).send({ "msg": "Användarnamn upptaget" });

		const hash = await bcrypt.hash(password, 11);

		const result2 = await db.query(
			"INSERT INTO account (username, email, password) VALUES (?, ?, ?)",
			[username, email, hash]
		);

		res.status(200).send({ msg: "Användare skapad", redirect: "/login/" });
	}
	catch (e) {
		console.error(e);
		res.status(500).send({ msg: "Internt serverfel" });
	}
});

api.post("/login", async (req, res) => {
	const { username, password } = req.body;

	try {
		const result = await db.query(
			"SELECT password FROM account WHERE username = ?",
			username,
		);

		let username_exists = result.length == 0;

		// För att det inte ska gå att brute-forca vilka användarnamn som finns
		// i databasen genom att mäta med tid om servern hashar ett lösenord så
		// hashas och jämförs ändå det angivna lösenordet med en exempelhash.
		const hash = username_exists ? result[0].password : "$2b$10$iegfsCC2ODTkuDemvEGIGeAf7/vEUjU2QUITW27cHtS08kGTRAO4e";

		const password_correct = await bcrypt.compare(password, hash);

		if (!(password_correct && username_exists))
			return res.status(402).send({ "msg": "Felaktiga inloggningsuppgifter" });

		// log in
	}
	catch (e) {
		console.error(e);
		res.status(500).send({ msg: "Internt serverfel" });
	}
})

server.use("/", (err, req, res, next) => {
	res.status(500).send({ msg: "Internt serverfel" });
	console.error(err);
});

server.listen(4433, () => console.log("server started at http://locahost:4433"));
