const bcrypt = require("bcrypt");
const cookie_parser = require("cookie-parser");
const express = require("express");

const db = require("./db.js");
const session = require("./session.js");

const server = express();
const api = express();

server.use(cookie_parser());
server.use(express.json());

server.use("/", express.static("public"));
server.use("/api/", api);

api.post("/num", async (req, res) => {
	console.log(req.body);

	if (!session.has(req))
		return res.status(401).send({ msg: "Du måste logga för att göra detta", redirect: "/login/" });

	let id = session.get(req.cookies.sid).id;

	try {
		const { num } = req.body;

		const result = await db.query(
			"UPDATE fav_nums WHERE account_id = ? SET fav_num = ?",
			[ id, num ]
		);

		res.status(204).send();
	}
	catch (e) {
		console.error(e);
		res.status(500).send({ msg: "Internt serverfel" });
	}
});

api.get("/num", async (req, res) => {
	if (!session.has(req))
		return res.status(401).send({ msg: "Du måste logga för att göra detta", redirect: "/login/" });

	let id = session.get(req.cookies.sid).id;

	try {
		const result = await db.query(
			"SELECT favnum FROM fav_nums WHERE account_id = ?",
			id
		);

		let favnum = result[0] ? result[0].favnum : 0;

		res.status(200).send({ favnum });
	}
	catch (e) {
		console.error(e);
		res.status(500).send({ msg: "Internt serverfel" });
	}
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
			"SELECT id, password FROM account WHERE username = ?",
			username,
		);

		let username_exists = result.length > 0;

		// För att det inte ska gå att brute-forca vilka användarnamn som finns
		// i databasen genom att mäta med tid om servern hashar ett lösenord så
		// hashas och jämförs ändå det angivna lösenordet med en exempelhash.
		// Därmed tar det lika lång tid för servern att svara oavsett vad som
		// var fel; användarnamn eller lösenord.
		const hash = username_exists ? result[0].password : "$2b$10$iegfsCC2ODTkuDemvEGIGeAf7/vEUjU2QUITW27cHtS08kGTRAO4e";

		const password_correct = await bcrypt.compare(password, hash);

		if (!(password_correct && username_exists))
			return res.status(402).send({ msg: "Felaktiga inloggningsuppgifter" });

		// log in
		const cookie = await session.create({ id: result[0].id });
		res.status(200).cookie("sid", cookie, { httpOnly: true }).send({ msg: "Inloggad", redirect: "/home/" });
	}
	catch (e) {
		console.error(e);
		res.status(500).send({ msg: "Internt serverfel" });
	}
});

api.post("/logout", async (req, res) => {
	session.remove(req.cookies.sid);
	res.clearCookie("sid", { httpOnly: true }).status(200).send({ redirect: "/" });
});

server.use("/", (err, req, res, next) => {
	res.status(500).send({ msg: "Internt serverfel" });
	console.error(err);
});

server.listen(4433, () => console.log("server started at http://locahost:4433"));
