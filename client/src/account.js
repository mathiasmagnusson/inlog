import { writable } from "svelte/store";

export const logged_in_store = writable(document.cookie.includes("sid"));

export const username_store = writable("...");

logged_in_store.subscribe(async logged_in => {
	if (logged_in) {
		const res = await fetch("/api/username");

		let json;
		try {
			json = await res.json();
		}
		catch (err) {}

		username_store.set(json.username);
	}
	else {
		username_store.set("...");
	}
});
