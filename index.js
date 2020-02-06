const bcrypt = require("bcrypt");
const { validate: validate_email } = require("email-validator");
const escape_html = require("escape-html");
const express = require("express");
const express_session = require("express-session");
const nodemailer = require("nodemailer");
const path = require("path");
const uid = require("uid-safe");

const creds = require("./creds.js");
const db = require("./db.js");
const SessionStore = require("./session-store.js")(express_session);
const { delay } = require("./util.js");

const SALT_ROUNDS = 11;

const server = express();

server.set("trust proxy", 1);

server.use(express.json());
server.use(express_session({
	cookie: {
		secure: server.get("env") === "production",
	},
	resave: false,
	saveUninitialized: false,
	secret: "TODO: fix secret",
	store: new SessionStore(),
	unset: "destroy",
}));

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

const api = express();
server.use("/api/", api);

function error500(err, res) {
	console.error(err);
	res.status(500).send({ msg: "Internt serverfel" });
}

function withAuth(handler) {
	return function(req, res) {
		if (req.session.aid) {
			handler(...arguments).catch(err => {
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

api.get("/logged-in", error_wrapper(async (req, res) => {
	res.status(200).send({ "logged-in": req.session.aid ? true : false });
}));

api.get("/username", withAuth(async (req, res) => {
	const result = await db.query(
		"SELECT username FROM account WHERE id = ?",
		req.session.aid,
	);

	if (result.length !== 1) throw `result.length is ${result.length}, but should be 1 at api.get("username", ...)`;

	const { username } = result[0];

	res.status(200).send({ username });
}));

api.post("/username", withAuth(async (req, res) => {
	const { username, password } = req.body;

	if (!username)
		return res.status(400).send({ msg: "E-postadress saknas" });

	if (!password)
		return res.status(400).send({ msg: "Lösenord saknas" });

	const result = await db.query(
		"SELECT password AS hash FROM account WHERE id = ?",
		req.session.aid,
	);

	if (result.length !== 1) throw `result.length is ${result.length}, but should be 1 at api.get("change-email", ...)`;

	const { hash } = result[0];

	const password_correct = await bcrypt.compare(password, hash);

	if (!password_correct)
		return res.status(406).send({ msg: "Inkorrekt lösenord" });

	const taken_result = await db.query(
		"SELECT COUNT(*) AS taken FROM account WHERE username = ?",
		username,
	);

	if (taken_result[0].taken > 0)
		return res.status(406).send({ "msg": "Användarnamn upptaget" });

	const update_result = await db.query(
		"UPDATE account SET username = ? WHERE id = ?",
		[username, req.session.aid],
	);

	if (update_result.affectedRows !== 1)
		throw `Error: Username change affected ${update_result.affectedRows} rows. Should be 1`;

	res.status(200).send({ msg: "Användarnamn ändrat" });
}));

api.get("/email", withAuth(async (req, res) => {
	const result = await db.query(
		"SELECT email FROM account WHERE id = ?",
		req.session.aid,
	);

	if (result.length !== 1) throw `result.length is ${result.length}, but should be 1 at api.get("email", ...)`;

	const { email } = result[0];

	res.status(200).send({ email });
}));

api.post("/email", withAuth(async (req, res) => {
	const { email, password } = req.body;

	if (!email)
		return res.status(400).send({ msg: "E-postadress saknas" });

	if (!password)
		return res.status(400).send({ msg: "Lösenord saknas" });

	if (!validate_email(email))
		return res.status(400).send({ msg: "Felformaterad e-postadress" });

	const result = await db.query(
		"SELECT password AS hash FROM account WHERE id = ?",
		req.session.aid,
	);

	if (result.length !== 1) throw `result.length is ${result.length}, but should be 1 at api.get("change-email", ...)`;

	const { hash } = result[0];

	const password_correct = await bcrypt.compare(password, hash);

	if (!password_correct)
		return res.status(406).send({ msg: "Inkorrekt lösenord" });

	const update_result = await db.query(
		"UPDATE account SET email = ? WHERE id = ?",
		[email, req.session.aid]
	);

	if (update_result.affectedRows !== 1)
		throw `Error: Email change affected ${result.affectedRows} rows. Should be 1`;

	res.status(200).send({ msg: "E-postadress ändrad" });
}));

api.post("/change-password", withAuth(async (req, res) => {
	const {
		"old-password": old_password,
		"new-password": new_password,
	} = req.body;

	if (!old_password)
		return res.status(400).send({ msg: "Gammalt lösenord saknas" });

	if (!new_password)
		return res.status(400).send({ msg: "Nytt lösenord saknas" });

	const result = await db.query(
		"SELECT password AS hash FROM account WHERE id = ?",
		req.session.aid,
	);

	if (result.length !== 1) throw `result.length is ${result.length}, but should be 1 at api.get("change-email", ...)`;

	const { hash } = result[0];

	const password_correct = await bcrypt.compare(old_password, hash);

	if (!password_correct)
		return res.status(406).send({ msg: "Inkorrekt lösenord" });


	// Alla sessioner som är inloggade på det här kontot, men som inte är just
	// den här sessionen, loggas ut.
	req.sessionStore.destroy_if(session => req.session.aid === session.aid && req.session !== session);

	const new_hash = await bcrypt.hash(new_password, SALT_ROUNDS);

	const update_result = await db.query(
		"UPDATE account SET password = ? WHERE id = ?",
		[new_hash, req.session.aid],
	);

	if (update_result.affectedRows !== 1)
		throw `Error: Password change affected ${update_result.affectedRows} rows. Should be 1`;

	res.status(200).send({ msg: "Lösenord ändrat" });
}));

api.post("/fav-num", withAuth(async (req, res) => {
	const { "fav-num": fav_num } = req.body;

	if (typeof fav_num !== "number")
		return res.status(400).send({ msg: "Inte ett nummer" });

	const select_res = await db.query(
		"SELECT id FROM fav_num WHERE account_id = ?",
		req.session.aid,
	);

	if (select_res.length == 0) {
		const insert_res = await db.query(
			"INSERT INTO fav_num (account_id, num) VALUES (?, ?)",
			[req.session.aid, fav_num],
		);
	} else {
		const update_res = await db.query(
			"UPDATE fav_num SET num = ? WHERE id = ?",
			[fav_num, select_res[0].id],
		);
	}

	res.status(200).send({ msg: "Favoritnummer updaterat" });
}));

api.get("/fav-num", withAuth(async (req, res) => {
	const result = await db.query(
		"SELECT num FROM fav_num WHERE account_id = ?",
		req.session.aid,
	);

	let num = result[0] ? result[0].num : undefined;

	res.status(200).send({ "fav-num": num });
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

	console.log(`Skapar kontot ${username} <${email}>.`):

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

	console.log(`Loggar in ${username}.`):

	req.session.aid = result[0].id;
	res.status(200).send({ msg: "Inloggad", redirect: "/" });
}));

api.post("/reset-password", async (req, res) => {
	return res.status(402).send({ msg: "Sorry, men har problem med mailservern" });

	const { email, code, password } = req.body;

	if (code && password)
		submit_reset_code(req, res, code, password).catch(err => {
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
let password_reset_codes = new Map();
async function submit_reset_code(req, res, code, password) {
	const aid = password_reset_codes.get(code);

	if (!aid)
		return res.status(406).send({ msg: "Ogiltig kod" });

	password_reset_codes.delete(code);

	// I fall att någon är inloggad på kontot när lösenordet ändras
	// så loggas denna ut.
	req.sessionStore.destroy_if(session => aid === session.aid);

	const hash = await bcrypt.hash(password, SALT_ROUNDS);

	const result = await db.query(
		"UPDATE account SET password = ? WHERE id = ?",
		[hash, aid],
	);

	if (result.affectedRows !== 1)
		throw `Error: Password change affected ${result.affectedRows} rows. Should be 1`;

	res.status(200).send({ msg: "Lösenord ändrat", redirect: "/login/" });
}

async function request_reset_code(email, res) {
	if (!validate_email(email))
		return res.status(400).send({ msg: "Felformaterad e-postadress" });

	const result = await db.query(
		"SELECT id AS aid, username FROM account WHERE email = ?",
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
		host: creds.smtp.host,
		port: creds.smtp.port,
		secure: false,
		auth: {
			user: creds.smtp.user,
			pass: creds.smtp.pass,
		},
	});

	const codes_names = await Promise.all(result.map(async ({ aid, username }) => {
		let reset_code;
		do {
			reset_code = await uid(18);
		} while (password_reset_codes.has(reset_code));

		password_reset_codes.set(reset_code, aid);

		setTimeout(() => {
			password_reset_codes.delete(reset_code);
		}, 1000 * 60 * 10);

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
	delete req.session;
	res.status(200).send({ msg: "Utloggad", redirect: "/" });
});

server.listen(8097, "127.0.0.1", () => console.log("http://localhost:8097"));
