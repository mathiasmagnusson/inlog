<script>
	import { slide } from "svelte/transition";

	import { email_store } from ".";

	let errors = [];
	let successes = [];
	let waiting = false;

	let email = "";
	let password = "";

	async function submit() {
		errors = [];
		successes = [];

		if (email === "")
			errors = [...errors, "E-postadress saknas"];

		if (password === "")
			errors = [...errors, "Lösenord saknas"];

		if (errors.length) return;

		waiting = true;

		const res = await fetch("/api/email", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email,
				password
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
		else {
			email_store.set(email);
			successes = [...successes, json.msg];
			email = "";
			password = "";
		}
	}
</script>

<style>
</style>

<h2 class="wide">Ändra e-postadress</h2>
<div class="grid-form">
	<label for="email">Ny e-postadress</label>
	<input type="email" id="email" bind:value={email} placeholder="john.smith@domain.com" />
	<label for="password">Lösenord</label>
	<input type="password" id="password" bind:value={password} placeholder="************" />
	<button class="wide" on:click={submit}>Ok</button>
	{#if errors.length}
		<ul class="error-text">
			{#each errors as error}
				<li in:slide>{error}</li>
			{/each}
		</ul>
	{/if}
	{#if successes.length}
		<ul class="success-text">
			{#each successes as success}
				<li in:slide>{success}</li>
			{/each}
		</ul>
	{/if}
</div>
