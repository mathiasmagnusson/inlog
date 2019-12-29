<script>
	import { Route } from "svelte-router-spa";

	export let currentRoute;
</script>

<style>
	.container {
		width: 100%;
		height: calc(100vh - 60px);
		background-color: #4080ff;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
</style>

<div class="container">
	<Route {currentRoute} />
</div>
