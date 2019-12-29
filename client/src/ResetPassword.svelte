<script>
	import { navigateTo } from "svelte-router-spa";

	let errors = [];
	let successes = [];
	let waiting = false;

	let email = "";
	let code = "";
	let password = "";
	let repeat_password = "";

	let state = "email";

	async function request_reset_code() {
		errors = [];
		successes = [];

		if (email === "")
			errors = [...errors, "E-postadress saknas"];

		if (errors.length) return;

		waiting = true;

		const res = await fetch("/api/reset-password", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});

		let json;
		try {
			json = await res.json();
		}
		catch (err) {
			waiting = false;
			return errors = [...errors, "Serverfel"];
		}

		waiting = false;

		if (res.status !== 200)
			return errors = [...errors, json.msg];
		else if (json.msg)
			successes = [...successes, json.msg];

		state = "code";
	}

	async function go_back() {
		state = "email";
		errors = [];
		successes = [];
	}

	async function submit_reset_code() {
		errors = [];
		successes = [];

		if (code === "")
			errors = [...errors, "Återställningskod saknas"];

		if (password === "")
			errors = [...errors, "Lösenord saknas"];
		else if (password !== repeat_password)
			errors = [...errors, "Lösenorden matchar inte"];

		if (errors.length) return;

		waiting = true;

		const res = await fetch("/api/reset-password", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ code, password }),
		});

		let json;
		try {
			json = await res.json();
		}
		catch (err) {
			waiting = false;
			return errors = [...errors, "Serverfel"];
		}

		waiting = false;

		if (res.status !== 200)
			return errors = [...errors, json.msg];
		else if (json.msg)
			successes = [...successes, json.msg];

		successes = [...successes, "Inloggad, omdirigerar..."];

		waiting = true;
		if (json.redirect)
			setTimeout(() => navigateTo(json.redirect), 500);
	}
</script>

<style>
	main {
		width: 80%;
		max-width: 500px;
		background-color: white;
		padding: 20px;
		border-radius: 5px;
	}

	h1 {
		text-align: center;
		margin-bottom: 20px;
	}
</style>

<main>
	<h1>Återställ lösenord</h1>
	<div class="grid-form">
		{#if state === "email"}
			<label for="email">E-postadress</label>
			<input type="email" id="email" bind:value={email} placeholder="johnsmith@domain.com" autofocus>
			<button disabled={waiting} class="wide" on:click={request_reset_code}>Vidare</button>
		{:else}
			<label for="code">Återställningskod</label>
			<input type="text" id="code" bind:value={code} autofocus>
			<label for="password">Lösenord</label>
			<input type="password" id="password" bind:value={password} placeholder="************" />
			<label for="repeat-password">Repetera Lösenord</label>
			<input type="password" id="repeat-password" bind:value={repeat_password} placeholder="************" />
			<button on:click={go_back}>Tillbaka</button>
			<button disabled={waiting} on:click={submit_reset_code}>Skicka</button>
		{/if}
		<ul class="error-text">
			{#each errors as error}
				<li>{error}</li>
			{/each}
		</ul>
		<ul class="success-text">
			{#each successes as success}
				<li>{success}</li>
			{/each}
		</ul>
	</div>
</main>
