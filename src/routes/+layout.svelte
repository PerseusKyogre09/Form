<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import NotificationContainer from "$lib/components/NotificationContainer.svelte";
	import { themePreference, applyTheme } from "$lib/stores/theme";

	let { children } = $props();

	onMount(() => {
		const pref = $page.data.themePreference as "light" | "dark" | "auto";
		if (pref) {
			themePreference.set(pref);
			applyTheme(pref);
		}
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

<div class="min-h-screen">
	{@render children()}
</div>
