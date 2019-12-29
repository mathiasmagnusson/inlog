<script>
	import { navigateTo } from "svelte-router-spa";

	let errors = [];
	let successes = [];
	let waiting = false;

	let username = "";
	let email = "";
	let password = "";
	let repeat_password = "";

	async function submit() {
		errors = [];

		if (username === "")
			errors = [...errors, "Användarnamn saknas"];

		if (email === "")
			errors = [...errors, "E-postadress saknas"];

		if (password === "")
			errors = [...errors, "Lösenord saknas"];
		else if (password !== repeat_password)
			errors = [...errors, "Lösenorden matchar inte"];

		if (errors.length) return;

		let waiting = true;

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
		catch (err) {
			waiting = false;
			return errors = [...errors, "Serverfel"];
		}

		waiting = false;

		if (res.status !== 200)
			return errors = [...errors, json.msg];
		else if (json.msg)
			successes = [...successes, json.msg];

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
	<h1>Registrera</h1>
	<div class="grid-form">
		<label for="username">Användarnamn</label>
		<input type="text" bind:value={username} placeholder="johnsmith" />
		<label for="email">E-postadress</label>
		<input type="email" bind:value={email} placeholder="johnsmith@domain.com" />
		<label for="password">Lösenord</label>
		<input type="password" bind:value={password} placeholder="************" />
		<label for="repeat-password">Repetera Lösenord</label>
		<input type="password" bind:value={repeat_password} placeholder="************" />
		<button class="wide" on:click={submit}>Registrera</button>
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
