import { writable } from "svelte/store";

export const logged_in_store = writable(null);
export const username_store = writable("...");
export const email_store = writable("...");

async function get_and_store(name, store) {
	const res = await fetch(`/api/${name}`);

	let json;
	try {
		json = await res.json();
	}
	catch (err) {
		return;
	}

	if (res.status === 401)
		logged_in_store.set(false);
	if (res.status === 200)
		store.set(json[name]);
}

logged_in_store.subscribe(async logged_in => {
	if (logged_in) {
		get_and_store("username", username_store);
		get_and_store("email", email_store);
	}
	else {
		username_store.set("");
		email_store.set("");
	}
});

(async function() {
	const res = await fetch("/api/logged-in");

	let json;
	try {
		json = await res.json();
	}
	catch (err) {}

	logged_in_store.set(json["logged-in"]);
})();
