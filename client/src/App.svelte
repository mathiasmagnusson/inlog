<script>
	import { Router } from "svelte-router-spa";
	import { routes } from "./routes";
	import Header from "./Header.svelte";
</script>

<style>
</style>

<Header />
<Router {routes} />
