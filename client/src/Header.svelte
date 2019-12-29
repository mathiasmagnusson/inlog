<script>
	import { logged_in_store, username_store } from "./account.js";
	import { navigateTo, Navigate, routeIsActive } from "svelte-router-spa";

	let logged_in;

	logged_in_store.subscribe(value => {
		logged_in = value;
	});

	let show_drowdown = false;

	let username;
	username_store.subscribe(value => {
		username = value;
	});

	function toggle_dropdown(event) {
		if (event.target.classList.contains("toggle-dropdown"))
			show_drowdown = !show_drowdown;
	}

	async function logout() {
		show_drowdown = false;

		const res = await fetch("/api/logout", {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
		});

		let json;
		try {
			json = await res.json();
		}
		catch (err) {
			return;
		}

		logged_in_store.set(false);

		if (json.redirect)
			navigateTo(json.redirect);
	}
</script>

<style>
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;

		background-color: white;
		padding: 10px;
		height: 60px;
	}

	nav ul {
		display: flex;
		flex-direction: row;
		list-style: none;
	}

	nav ul a {
		padding: 5px 8px;
		margin: 0 5px;
		color: black;
		text-decoration: none;
		background-color: #d4d4d4;
		border-radius: 2px;
	}

	.account {
		position: relative;
	}

	.account button.toggle-dropdown {
		display: flex;
		align-items: center;
		border: none;
		padding: 6px 10px;
		background-color: #5c5c5c;
		color: white;
		font-size: 14px;
	}

	.arrow {
		width: 20px;
		height: 20px;
	}

	.account-dropdown {
		position: absolute;
		display: block;
		top: calc(100% + 5px);
		right: 0;
		color: black;
		border: 1px solid #e3e3e3;
		background-color: white;
		border-radius: 3px;
		width: 200px;
		text-align: left;
		font-size: 16px;
	}

	.account-dropdown a {
		color: black;
		text-decoration: none;
	}

	.account-dropdown button {
		background: none;
		border: none;
		width: 100%;
		text-align: left;
		cursor: pointer;
		font-size: inherit;
	}

	.account-dropdown > :not(.dropdown-divider) {
		margin: 10px;
	}

	.dropdown-divider {
		width: 100%;
		border-top: 1px solid #e1e4e8;
	}
</style>

<header>
	<nav>
		<ul>
			<a href="/">Hem</a>
			<a href="/fav-num">Favoritnummer</a>
			<a href="/login">Logga in</a>
			<a href="/register">Registrera konto</a>
		</ul>
	</nav>
	{#if logged_in}
		<div class="account">
			<button on:click={toggle_dropdown} class="toggle-dropdown">
				<span class="username toggle-dropdown">{username}</span>
				<svg class="arrow toggle-dropdown" viewBox="0 0 10 10">
					<line class="toggle-dropdown" x1="2" y1="4" x2="5" y2="7" stroke="white" stroke-width="0.8" />
					<line class="toggle-dropdown" x1="8" y1="4" x2="5" y2="7" stroke="white" stroke-width="0.8" />
				</svg>
			</button>
			{#if show_drowdown}
				<section class="account-dropdown">
					<p>Inloggad som<br /><strong>{username}</strong></p>
					<div class="dropdown-divider"></div>
					<p><a on:click={() => show_drowdown = false} href="/account">Kontoinställningar</a></p>
					<div class="dropdown-divider"></div>
					<p><button on:click={logout}>Logga ut</button></p>
				</section>
			{/if}
		</div>
	{/if}
</header>