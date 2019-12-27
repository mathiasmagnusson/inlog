const bcrypt = require("bcrypt");
const cookie_parser = require("cookie-parser");
const escape_html = require("escape-html");
const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const uid = require("uid-safe");

const creds = require("./creds.js");
const db = require("./db.js");
const session = require("./session.js");

const server = express();
const api = express();

server.use(cookie_parser());
server.use(express.json());

server.use("/", express.static("client/public"));
[
	"/",
	"/home",
	"/login",
	"/register",
	"/account",
]
	.forEach(route => {
		server.get(route, (req, res) => res.sendFile(path.resolve("client/public/index.html")));
	});

server.use("/api/", api);

api.post("/fav-num", async (req, res) => {
	if (!session.has(req))
		return res.status(401).send({ msg: "Du måste logga för att göra detta", redirect: "/login/" });

	let account_id = session.get(req.cookies.sid).id;

	try {
		const { "fav-num": fav_num } = req.body;

		const select_res = await db.query(
			"SELECT id FROM fav_nums WHERE account_id = ?",
			account_id
		);

		if (select_res.length == 0) {
			const insert_res = await db.query(
				"INSERT INTO fav_nums (account_id, fav_num) VALUES (?, ?)",
				[account_id, fav_num]
			);
		} else {
			const update_res = await db.query(
				"UPDATE fav_nums SET fav_num = ? WHERE id = ?",
				[fav_num, select_res[0].id]
			);
		}

		res.status(204).send();
	}
	catch (e) {
		console.error(e);
		res.status(500).send({ msg: "Internt serverfel" });
	}
});

api.get("/fav-num", async (req, res) => {
	if (!session.has(req))
		return res.status(401).send({ msg: "Du måste logga för att göra detta", redirect: "/login/" });

	let id = session.get(req.cookies.sid).id;

	try {
		const result = await db.query(
			"SELECT fav_num FROM fav_nums WHERE account_id = ?",
			id
		);

		let fav_num = result[0] ? result[0].fav_num : undefined;

		res.status(200).send({ "fav-num": fav_num });
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

	if (!username || !password)
		return res.status(400).send({ msg: "Användanamn / Lösenord saknas" });

	try {
		const result = await db.query(
			"SELECT id, password FROM account WHERE username = ?",
			username,
		);

		let username_exists = result.length > 0;

		const hash = username_exists ? result[0].password : "$2b$10$iegfsCC2ODTkuDemvEGIGeAf7/vEUjU2QUITW27cHtS08kGTRAO4e";

		const password_correct = await bcrypt.compare(password, hash);

		if (!(password_correct && username_exists))
			return res.status(402).send({ msg: "Felaktiga inloggningsuppgifter" });

		const cookie = await session.create({ id: result[0].id });
		res.status(200).cookie("sid", cookie).send({ msg: "Inloggad", redirect: "/home" });
	}
	catch (e) {
		console.error(e);
		res.status(500).send({ msg: "Internt serverfel" });
	}
});

let reset_password_codes = new Map();
api.post("/reset-password", async (req, res) => {
	const { email, code } = req.body;

	try {
		const result = await db.query(
			"SELECT id, username FROM account WHERE email = ?",
			email,
		);

		// För att det inte ska gå att se vilka adresser som finns är registrerade så ljuger vi ihop
		// något här. Det kanske ändå går att upptäcka detta m.h.a. tiden det tar för servern att svara
		// men jag känner att det här får duga.
		if (result.length == 0)
			return res.status(500).send({ msg: "Lösenordsåterställningsmail skickat (kolla skräppost!)" });

		const transporter = nodemailer.createTransport({
			host: "mail.magnusson.space",
			port: 587,
			secure: false,
			auth: {
				user: creds.smtp.user,
				pass: creds.smtp.pass,
			},
		});

		const codes_names = await Promise.all(result.map(async ({ id, username }) => {
			let reset_code;
			do {
				reset_code = await uid(18);
			} while (reset_password_codes.has(reset_code));

			reset_password_codes.set(reset_code, {
				account_id: id,
				expiration: Date.now() + 1000 * 60 * 10,
			});

			return { reset_code, username };
		}));

		const mail_res = await transporter.sendMail({
			from: "no-reply <noreply@magnusson.space>",
			to: email,
			subject: "Lösenordsåterställning",
			text: codes_names.map(({ reset_code, username }) =>
				`Använd koden "${reset_code}" för att återställa lösenordet till kontot "${escape_html(username)}".\n\n`),
			html: codes_names.map(({ reset_code, username }) =>
				`<p>Använd koden <pre>${reset_code}</pre> för att återställa lösenordet till kontot <i>${escape_html(username)}</i>.</p>`),
		});

		res.status(500).send({ msg: "Lösenordsåterställningsmail skickat (kolla skräpposten!)" });
	}
	catch (err) {
		console.error(err);
		res.status(500).send({ msg: "Internt serverfel: " + err });
		console.log(nodemailer);
	}
});

api.post("/logout", async (req, res) => {
	session.remove(req.cookies.sid);
	res.clearCookie("sid").status(200).send({ redirect: "/" });
});

server.use("/", (err, req, res, next) => {
	res.status(500).send({ msg: "Internt serverfel" });
	console.error(err);
});

server.listen(4433, () => console.log("server started at http://localhost:4433"));
