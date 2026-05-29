<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import NotificationContainer from "$lib/components/NotificationContainer.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { themePreference, applyTheme } from "$lib/stores/theme";

	let { children } = $props();

	onMount(() => {
		const pref = $page.data.themePreference as "light" | "dark" | "auto";
		if (pref) {
			themePreference.set(pref);
			applyTheme(pref);
		}
	});

	// List of paths where the footer should be hidden (builder, certificate, login, dashboard, etc.)
	const excludedPaths = [
		"/form-builder",
		"/certificate-generator",
		"/login",
		"/signup",
		"/form",
		"/preview",
		"/checkin",
		"/dashboard"
	];

	// Derived state to determine if footer should be rendered
	let showFooter = $derived.by(() => {
		const path = $page.url.pathname;
		return !excludedPaths.some(p => path === p || path.startsWith(p + "/"));
	});
</script>

<svelte:head>
	<title>Quill</title>
	<link rel="icon" href={favicon} />
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<NotificationContainer />

<div class="min-h-screen flex flex-col">
	<div class="flex-1">
		{@render children()}
	</div>
	{#if showFooter}
		<Footer />
	{/if}
</div>
