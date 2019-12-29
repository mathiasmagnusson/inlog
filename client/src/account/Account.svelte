<script>
	import { navigateTo } from "svelte-router-spa";

	import ChangeEmail from "./ChangeEmail.svelte";
	import ChangePassword from "./ChangePassword.svelte";
	import ChangeUsername from "./ChangeUsername.svelte";
	import { username_store, email_store, logged_in_store } from ".";

	let username;
	username_store.subscribe(value => username = value);

	let email;
	email_store.subscribe(value => email = value);

	logged_in_store.subscribe(logged_in => {
		if (logged_in === false)
			navigateTo("/login")
	});
</script>

<style>
	main {
		width: 80%;
		max-width: 500px;
		background-color: white;
		padding: 20px;
		border-radius: 5px;
	}

	.info {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	p {
		font-weight: bold;
	}

	h1 {
		text-align: left;
		margin-bottom: 20px;
	}

	.divider {
		width: calc(100% + 40px);
		height: 0px;
		border-bottom: 1px solid #e1e4e8;
		margin: 25px -20px 20px -20px;
	}
</style>

<main>
	<h1>Kontoinställningar</h1>
	<div class="info">
		<p>{username}</p>
		<p>{email}</p>
	</div>
	<ChangeUsername />
	<div class="divider" />
	<ChangeEmail />
	<div class="divider" />
	<ChangePassword />
</main>
