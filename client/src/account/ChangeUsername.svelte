<script>
	import { username_store } from ".";

	let current_username;
	username_store.subscribe(value => {
		current_username = value;
	});

	let errors = [];
	let successes = [];
	let waiting = false;

	let username = "";
	let password = "";

	async function submit() {
		errors = [];
		successes = [];

		if (username === "")
			errors = [...errors, "Användarnamn saknas"];

		if (password === "")
			errors = [...errors, "Lösenord saknas"];

		if (errors.length) return;

		waiting = true;

		const res = await fetch("/api/username", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username,
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
			username_store.set(username);
			successes = [...successes, json.msg];
			username = "";
			password = "";
		}
	}
</script>

<style>
</style>

<h2 class="wide">Ändra användarnamn</h2>
<div class="grid-form">
	<label for="username">Nytt användarnamn</label>
	<input type="text" id="username" bind:value={username} placeholder={current_username} />
	<label for="password">Lösenord</label>
	<input type="password" id="password" bind:value={password} placeholder="************" />
	<button class="wide" on:click={submit}>Ok</button>
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
