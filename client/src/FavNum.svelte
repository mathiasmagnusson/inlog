<script>
	import { navigateTo } from "svelte-router-spa";

	let state = "loading";
	let fav_num;
	let new_num;
	let submit_error = null;

	(async function() {
		try {
			const res = await fetch("/api/fav-num");
			const json = await res.json();

			if (json.redirect)
				navigateTo(json.redirect);

			fav_num = json["fav-num"];
			state = "success";
		}
		catch (e) {
			state = "error";
		}
	})();

	async function submit() {
		try {
			const res = await fetch("/api/fav-num", {
					method: "post",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					"fav-num": new_num,
				}),
			});

			let json;
			try {
				json = await res.json();
			}
			catch (err) {
				return submit_error = "Serverfel";
			}

			if (res.status !== 200)
				return submit_error = json.msg;

			submit_error = null;

			fav_num = new_num;
			new_num = "";
		}
		catch (e) {
			if (e.msg) {
				submit_error = e.msg;
			}
		}
	}
</script>

<style>
	main {
		background-color: white;
		text-align: center;
		box-shadow: 0 0 10px -5px black;
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 400px;
	}

	h1 {
		margin-bottom: 20px;
	}

	p {
		color: red;
	}
</style>

<main>
	{#if state === "loading"}
		<h1>Hämtar ditt favoritnummer...</h1>
	{:else if state === "error"}
		<h1>Kunde inte hämta ditt favoritnummer, försök igen senare</h1>
	{:else if typeof fav_num === "undefined"}
		<h1>Du har för närvarande inte registrerat ett favoritnummer</h1>
	{:else}
		<h1>Ditt favoritnummer är {fav_num}!</h1>
	{/if}

	<div>
		<label for="new-num">
			{#if typeof fav_num === "undefined"}
				Registrera
			{:else}
				Ändra
			{/if}
			ditt favoritnummer:
		</label>
		<input id="new-num" type="number" bind:value={new_num}>
		<button on:click={submit}>Ok</button>
		{#if submit_error}
			<p>{submit_error}</p>
		{/if}
	</div>
</main>
