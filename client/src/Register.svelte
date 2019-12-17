<script>
	import { navigateTo } from "svelte-router-spa";

	let errors = [];
	let username = "";
	let email = "";
	let password = "";
	let repeat_password = "";

	async function submit() {
		errors = [];

		if (password === "")
			errors = [...errors, "Lösenord saknas"];

		if (email === "")
			errors = [...errors, "E-postadress saknas"];

		if (password === repeat_password)
			errors = [...errors, "Lösenorden matchar inte"];

		if (username === "")
			errors = [...errors, "Användarnamn saknas"];

		if (errors) return;

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
			json = await json();
		}
		catch (e) {
			return errors = [...errors, "Serverfel"];
		}

		if (res.status !== 200)
			return errors = [...errors, json.msg];

		if (json.redirect)
			navigateTo(json.redirect);
	}
</script>

<style>
	.bg {
		background-color: #4080ff;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100vw;
		height: 100vh;
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

<div class="bg">
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
			<button on:click={submit}>Registrera</button>
			<ul class="error-text">
				{#each errors as error}
					<li>{error}</li>
				{/each}
			</ul>
		</div>
	</main>
</div>