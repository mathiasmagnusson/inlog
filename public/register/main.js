const inp_username = document.querySelector("#username");
const inp_email = document.querySelector("#email");
const inp_password = document.querySelector("#password");
const inp_repeat_password = document.querySelector("#repeat-password");
const sumbit = document.querySelector("#sumbit");
const error_text_el = document.querySelector("#error-text");

function reset_error() {
	document.querySelectorAll("#error-text > li")
		.forEach(li => li.remove());
}

function error_text(str) {
	const li = document.createElement("li");
	li.textContent = str;
	error_text_el.appendChild(li);
}

submit.addEventListener("click", async () => {
	reset_error();

	let username = inp_username.value.trim();
	let email = inp_email.value.trim();
	let password = inp_password.value;
	let repeat_password = inp_repeat_password.value;

	let fail;

	if (password !== repeat_password) {
		error_text("Lösenorden matchar inte");
		fail = true;
	}

	if (password === "") {
		error_text("Lösenord saknas");
		fail = true;
	}

	if (username === "") {
		error_text("Användarnamn saknas");
		fail = true;
	}

	if (email === "") {
		error_text("E-postadress saknas");
		fail = true;
	}

	if (fail) return;

	const res = await fetch("/api/register", {
		method: "post",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username,
			email,
			password,
		}),
	});

	let json;
	try {
		json = await res.json();
	}
	catch(e) {
		return error_text("Serverfel");
		console.error(e);
	}

	console.log(json);
});
