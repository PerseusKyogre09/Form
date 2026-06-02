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

	const footerPaths = ["/", "/terms", "/unauthorized"];

	let showFooter = $derived.by(() => footerPaths.includes($page.url.pathname));
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
