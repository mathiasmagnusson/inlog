<script>
	import { Navigate } from "svelte-router-spa";

	let errors = [];
	let username = "";
	let password = "";

	async function submit() {
		errors = [];

		if (password === "")
			errors = [...errors, "Lösenord saknas"];

		if (username === "")
			errors = [...errors, "Användarnamn saknas"];

		if (errors) return;

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

		console.log("hej");

		let json;
		try {
			json = await json();
		}
		catch (e) {
			return errors = [...errors, "Serverfel"];
		}

		if (res.status !== 200)
			return errors = [...errors, json.msg];

		if (json.redirect)
			window.location = json.redirect;
	}
</script>

<style>
	:global(body) {
		background-color: #4080ff;
		display: flex;
		justify-content: center;
		align-items: center;
	}

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

	.error-text {
		color: red;
	}
</style>

<main>
	<h1>Logga in</h1>
	<div class="grid-form">
			<label for="username">Användarnamn</label>
			<input type="text" bind:value={username} placeholder="johnsmith" />
			<label for="password">Lösenord</label>
			<input type="password" bind:value={password} placeholder="************" />
			<button on:click={submit}>Logga in</button>
			<ul class="error-text">
				{#each errors as error}
					<li>{error}</li>
				{/each}
			</ul>
	</div>
</main>
