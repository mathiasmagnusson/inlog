(async function() {
	try {
		const res = await fetch("/api/logout", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
		});

		const json = await res.json();

		if (json.redirect)
			window.location = json.redirect;
	}
	catch(e) {}
})();
