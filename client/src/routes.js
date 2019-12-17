import Account from "./Account.svelte";
import Home from "./Home.svelte";
import Index from "./Index.svelte";
import Login from "./Login.svelte";
import Register from "./Register.svelte";

export default function loggedIn() {
	return document.cookie.includes("sid");
}

export const routes = [
	{
		name: "/",
		component: Index,
	},
	{
		name: "/home",
		component: Home,
		onlyIf: { guard: loggedIn, redirect: "/login" },
	},
	{
		name: "login",
		component: Login,
	},
	{
		name: "register",
		component: Register,
	},
	{
		name: "account",
		component: Account,
		onlyIf: { guard: loggedIn, redirect: "/login" },
	}
];
