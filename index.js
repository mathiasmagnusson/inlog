const bcrypt = require("bcrypt");
const cookie_parser = require("cookie-parser");
const { validate: validate_email } = require("email-validator");
const escape_html = require("escape-html");
const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const uid = require("uid-safe");

const creds = require("./creds.js");
const db = require("./db.js");
const sessions = require("./sessions.js");
const { delay } = require("./util.js");

const SALT_ROUNDS = 11;

const server = express();
const api = express();

server.use(cookie_parser());
server.use(express.json());

server.use("/", express.static("client/public"));

[
	"/",
	"/account",
	"/fav-num",
	"/login",
	"/register",
	"/reset-password",
]
	.forEach(route => {
		server.get(route, (req, res) => res.sendFile(path.resolve("client/public/index.html")));
	});

server.use("/api/", api);

function error500(err, res) {
	console.error(err);
	res.status(500).send({ msg: "Internt serverfel" });
}

function withAuth(handler) {
	return function(req, res) {
		if (sessions.has(req)) {
			handler(sessions.get(req), ...arguments).catch(err => {
				error500(err, res);
			});
		} else {
			res.status(401).send({ msg: "Du måste logga in först", redirect: "/login/" });
		}
	};
}

function error_wrapper(handler) {
	return function(req, res) {
		handler(...arguments).catch(err => {
			error500(err, res);
		});
	};
}

api.get("/username", withAuth(async (session, req, res) => {
	const result = await db.query(
		"SELECT username FROM account WHERE id = ?",
		session.id,
	);

	if (result.length !== 1) throw `result.length is ${result.length}, but should be 1 at api.get("username", ...)`;

	const { username } = result[0];

	await delay(500);

	res.status(200).send({ username });
}));

api.post("/fav-num", withAuth(async (session, req, res) => {
	const { "fav-num": fav_num } = req.body;

	if (typeof fav_num !== "number")
		return res.status(400).send({ msg: "Inte ett nummer" });

	const select_res = await db.query(
		"SELECT id FROM fav_nums WHERE account_id = ?",
		session.id,
	);

	if (select_res.length == 0) {
		const insert_res = await db.query(
			"INSERT INTO fav_nums (account_id, fav_num) VALUES (?, ?)",
			[session.id, fav_num],
		);
	} else {
		const update_res = await db.query(
			"UPDATE fav_nums SET fav_num = ? WHERE id = ?",
			[fav_num, select_res[0].id],
		);
	}

	res.status(200).send({});
}));

api.get("/fav-num", withAuth(async (session, req, res) => {
	const result = await db.query(
		"SELECT fav_num FROM fav_nums WHERE account_id = ?",
		session.id,
	);

	let fav_num = result[0] ? result[0].fav_num : undefined;

	res.status(200).send({ "fav-num": fav_num });
}));

api.post("/register", error_wrapper(async (req, res) => {
	const { username, email, password } = req.body;

	if (!username || !email || !password)
		return res.status(400).send({ msg: "Användarnamn, e-postadress och/eller lösenord saknas" });

	if (!validate_email(email))
		return res.status(400).send({ msg: "Felformaterad e-postadress" });

	const result = await db.query(
		"SELECT COUNT(*) as taken FROM account WHERE username = ?",
		username,
	);

	if (result[0].taken > 0)
		return res.status(406).send({ "msg": "Användarnamn upptaget" });

	const hash = await bcrypt.hash(password, SALT_ROUNDS);

	const result2 = await db.query(
		"INSERT INTO account (username, email, password) VALUES (?, ?, ?)",
		[username, email, hash],
	);

	res.status(200).send({ msg: "Användare skapad", redirect: "/login/" });
}));

api.post("/login", error_wrapper(async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password)
		return res.status(400).send({ msg: "Användanamn och/eller lösenord saknas" });

	const result = await db.query(
		"SELECT id, password FROM account WHERE username = ?",
		username,
	);

	let username_exists = result.length > 0;

	const hash = username_exists ? result[0].password : "$2b$10$iegfsCC2ODTkuDemvEGIGeAf7/vEUjU2QUITW27cHtS08kGTRAO4e";

	const password_correct = await bcrypt.compare(password, hash);

	if (!(password_correct && username_exists))
		return res.status(406).send({ msg: "Felaktiga inloggningsuppgifter" });

	const cookie = await sessions.create({ id: result[0].id });
	res.status(200).cookie("sid", cookie).send({ msg: "Inloggad", redirect: "/" });
}));

api.post("/reset-password", async (req, res) => {
	const { email, code, password } = req.body;

	if (code && password)
		submit_reset_code(code, password, res).catch(err => {
			error500(err, res);
		});
	else if (email)
		request_reset_code(email, res).catch(err => {
			error500(err, res);
		});
	else
		res.status(400).send({ msg: "E-postadress eller kod och lösenord saknas" });
});

// Dessa är temporära och bör därmed inte sparas i databasen
// TODO: ta bort dem från `Map`en efter att de gått ut
// TODO: spara hashar av koderna istället?
let password_reset_codes = new Map();
async function submit_reset_code(code, password, res) {
	if (!password_reset_codes.has(code))
		return res.status(406).send({ msg: "Ogiltig kod" });

	const { account_id, expiration } = password_reset_codes.get(code);

	password_reset_codes.delete(code);

	if (Date.now() > expiration)
		return res.status(406).send({ msg: "Ogiltig kod" });

	// I fall att någon är inloggad på kontot när lösenordet ändras
	// så loggas denna ut.
	sessions.remove_if((key, val) => val.id === account_id);

	const hash = await bcrypt.hash(password, SALT_ROUNDS);

	const result = await db.query(
		"UPDATE account SET password = ? WHERE id = ?",
		[hash, account_id],
	);

	if (result.affectedRows !== 1)
		throw `Error: Password change affected ${result.affectedRows} rows. Should be 1`;

	res.status(200).send({ msg: "Lösenord ändrat", redirect: "/login/" });
}

async function request_reset_code(email, res) {
	if (!validate_email(email))
		return res.status(400).send({ msg: "Felformaterad e-postadress" });

	const result = await db.query(
		"SELECT id AS account_id, username FROM account WHERE email = ?",
		email,
	);

	const msg = "Lösenordsåterställningsmail skickat om mailen är registrerad (kolla skräpposten!)";
	const min_time = 1000;

	// För att det inte ska gå att se vilka adresser som är registrerade så returneras
	// samma sak oavsett om emailen är registrerad eller inte. Dessutom tar det (förhoppningsvis)
	// lika lång tid oavsett fallet. (Annars går det att se beroende på hur lång tid det tar innan)
	// servern svarar.
	if (result.length == 0) {
		await delay(min_time);
		return res.status(200).send({ msg });
	}

	const end_time = Date.now() + min_time;

	const transporter = nodemailer.createTransport({
		host: "mail.magnusson.space",
		port: 587,
		secure: false,
		auth: {
			user: creds.smtp.user,
			pass: creds.smtp.pass,
		},
	});

	const codes_names = await Promise.all(result.map(async ({ account_id, username }) => {
		let reset_code;
		do {
			reset_code = await uid(18);
		} while (password_reset_codes.has(reset_code));

		password_reset_codes.set(reset_code, {
			account_id,
			expiration: Date.now() + 1000 * 60 * 10,
		});

		return { reset_code, username };
	}));

	const mail_res = await transporter.sendMail({
		from: "no-reply <noreply@magnusson.space>",
		to: email,
		subject: "Lösenordsåterställning",
		text: codes_names.map(({ reset_code, username }) =>
			`Använd koden "${reset_code}" för att återställa lösenordet till kontot "${escape_html(username)}".\n\n`).join(""),
		html: codes_names.map(({ reset_code, username }) =>
			"<p>Använd koden " +
			`<span style="font-family: monospace; background: lightgray; padding: 3px; margin: 3px; border-radius: 3px">${reset_code}</span>` +
			` för att återställa lösenordet till kontot <i>${escape_html(username)}</i>.</p>`
		).join(""),
	});

	if (end_time > Date.now())
		await delay(end_time - Date.now());

	res.status(200).send({ msg });
}

api.post("/logout", async (req, res) => {
	sessions.remove(req);
	res.clearCookie("sid").status(200).send({ msg: "Utloggad", redirect: "/" });
});

server.listen(4433, () => console.log("server started at http://localhost:4433"));
