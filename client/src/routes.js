import Account from "./account/Account.svelte";
import FavNum from "./FavNum.svelte";
import Index from "./Index.svelte";
import Login from "./Login.svelte";
import Register from "./Register.svelte";
import ResetPassword from "./ResetPassword.svelte";
import BannerLayout from "./BannerLayout.svelte";
import PopupLayout from "./PopupLayout.svelte";
import { logged_in_store } from "./account";

let logged_in;
logged_in_store.subscribe(value => {
	logged_in = value;
});

export const routes = [
	{
		name: "/",
		component: Index,
		layout: BannerLayout,
	},
	{
		name: "fav-num",
		component: FavNum,
		onlyIf: { guard: () => logged_in !== false, redirect: "/login" },
		layout: BannerLayout,
	},
	{
		name: "login",
		component: Login,
		layout: PopupLayout,
	},
	{
		name: "register",
		component: Register,
		layout: PopupLayout,
	},
	{
		name: "reset-password",
		component: ResetPassword,
		layout: PopupLayout,
	},
	{
		name: "account",
		component: Account,
		onlyIf: { guard: () => logged_in !== false, redirect: "/login" },
		layout: PopupLayout,
	},
];
