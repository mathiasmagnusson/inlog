const inp_username = document.querySelector("#username");
const inp_email = document.querySelector("#email");
const inp_password = document.querySelector("#password");
const inp_repeat_password = document.querySelector("#repeat-password");
const sumbit = document.querySelector("#sumbit");
const error_text_el = document.querySelector("#error-text");

function error_text() {

}

submit.addEventListener("click", async () => {
	let username = inp_username.value;
	let email = inp_email.value;
	let password = inp_password.value;
	let repeat_password = inp_repeat_password.value;

	if (repeat_password !== password) {
		return error_text("Lösenorden matchar inte");
	} else {
		error_text.textContent = "";
	}

	const res = await fetch("/api/register", {
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
		console.error(e);
	}

	console.log(json);
});
