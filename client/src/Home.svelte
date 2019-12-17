<script>
	let state = "loading";
	let fav_num;
	let new_num;
	let submit_error;

	(async function() {
		try {
			const res = await fetch("/api/fav-num");
			const json = await res.json();

			fav_num = json["fav-num"];
			state = "success";
		}
		catch (e) {
			state = "error";
		}
	})();

	async function submit() {
		try {
			await fetch("/api/fav-num", {
					method: "post",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					"fav-num": new_num,
				}),
			});

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
	.bg {
		width: 100vw;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #4080ff;
	}
	main {
		width: 100%;
		height: 40%;
		background-color: white;
		text-align: center;
		box-shadow: 0 0 10px -5px black;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	h1 {
		margin-bottom: 20px;
	}
</style>

<div class="bg">
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
</div>
