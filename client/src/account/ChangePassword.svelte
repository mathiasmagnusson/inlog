<script>
	import { slide } from "svelte/transition";

	let errors = [];
	let successes = [];
	let waiting = false;

	let old_password = "";
	let new_password = "";
	let repeat_password = "";

	async function submit() {
		errors = [];
		successes = [];

		if (old_password === "")
			errors = [...errors, "Gammalt lösenord saknas"];

		if (new_password === "")
			errors = [...errors, "Nytt lösenord saknas"];
		else if (new_password !== repeat_password)
			errors = [...errors, "Lösenorden matchar inte"];

		if (errors.length) return;

		waiting = true;

		const res = await fetch("/api/change-password", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				"old-password": old_password,
				"new-password": new_password,
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
			successes = [...successes, json.msg];
			old_password = "";
			new_password = "";
			repeat_password = "";
		}
	}
</script>

<style>
</style>

<h2 class="wide">Ändra lösenord</h2>
<div class="grid-form">
	<label for="old-password">Gammalt lösenord</label>
	<input type="password" id="old-password" bind:value={old_password} placeholder="************" />
	<label for="new-password">Nytt lösenord</label>
	<input type="password" id="new-password" bind:value={new_password} placeholder="************" />
	<label for="repeat-password">Upprepa nytt lösenord</label>
	<input type="password" id="repeat-password" bind:value={repeat_password} placeholder="************" />
	<button on:click={submit} class="wide">Ok</button>
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
