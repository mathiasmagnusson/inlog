import Login from "./Login.svelte";
import Register from "./Register.svelte";
import Home from "./Home.svelte";

function isLoggedIn() {
	return false;
}

export const routes = [
	{
		name: "/",
		component: Home,
		onlyIf: { guard: isLoggedIn, redirect: "/login" },
	},
	{
		name: "login",
		component: Login,
	},
	{
		name: "register",
		component: Register,
	},
];
