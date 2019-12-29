<script>
	import { navigateTo } from "svelte-router-spa";
	import { logged_in_store } from "./account.js";

	let errors = [];
	let successes = [];
	let waiting = false;

	let username = "";
	let password = "";

	async function submit() {
		errors = [];
		successes = [];

		if (password === "")
			errors = [...errors, "Lösenord saknas"];

		if (username === "")
			errors = [...errors, "Användarnamn saknas"];

		if (errors.length > 0) return;

		waiting = true;

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
		catch (e) {
			waiting = false;
			return errors = [...errors, "Serverfel"];
		}

		waiting = false;

		if (res.status !== 200)
			return errors = [...errors, json.msg];
		else if (json.msg)
			successes = [...successes, json.msg];

		logged_in_store.set(true);

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

	a {
		text-align: right;
	}
</style>

<main>
	<h1>Logga in</h1>
	<div class="grid-form">
		<label for="username">Användarnamn</label>
		<input type="text" bind:value={username} placeholder="johnsmith" />
		<label for="password">Lösenord</label>
		<input type="password" bind:value={password} placeholder="************" />
		<button disabled={waiting} class="wide" on:click={submit}>Logga in</button>
		<a class="wide" href="/reset-password">Glömt lösenordet?</a>
		{#if errors.length}
			<ul class="error-text">
				{#each errors as error}
					<li>{error}</li>
				{/each}
			</ul>
		{/if}
		{#if successes.length}
			<ul class="success-text">
				{#each successes as success}
					<li>{success}</li>
				{/each}
			</ul>
		{/if}
	</div>
</main>
