const inp_username = document.querySelector("#username");
const inp_password = document.querySelector("#password");
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
	let password = inp_password.value;

	let fail;

	if (password === "") {
		error_text("Lösenord saknas");
		fail = true;
	}

	if (username === "") {
		error_text("Användarnamn saknas");
		fail = true;
	}

	if (fail) return;

	const res = await fetch("/api/login", {
		method: "post",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username,
			password,
		}),
	});

	let json;
	try {
		json = await res.json();
	}
	catch(e) {
		return error_text("Serverfel");
	}

	if (res.status !== 200)
		return error_text(json.msg);

	if (json.redirect)
		window.location = json.redirect;
});
