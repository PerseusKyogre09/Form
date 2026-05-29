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
	<title>Quill - Beautiful Form Builder</title>
	<meta name="description" content="Create beautiful, customizable forms with Quill. No coding required. Collect responses, analyze data, and share instantly." />
	<meta name="keywords" content="form builder, survey, questionnaire, form creation, form responses" />
	
	<!-- Open Graph Tags for Social Sharing -->
	<meta property="og:title" content="Quill - Beautiful Form Builder" />
	<meta property="og:description" content="Create beautiful, customizable forms without coding. Collect responses and analyze data instantly." />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://quill.geekroom-srmist.co.in/preview.jpg" />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	
	<!-- Twitter Card Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Quill - Beautiful Form Builder" />
	<meta name="twitter:description" content="Create beautiful, customizable forms without coding. Collect responses and analyze data instantly." />
	<meta name="twitter:image" content="https://quill.geekroom-srmist.co.in/preview.jpg" />

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
