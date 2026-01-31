<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";
	import { supabase } from "$lib/supabaseClient";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";

	let { children } = $props();

	onMount(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			const currentPath = $page.url.pathname;
			const isPublicRoute =
				currentPath === "/" ||
				currentPath === "/login" ||
				currentPath === "/signup" ||
				currentPath.startsWith("/form/");

			// Protected route logic
			if (!session && !isPublicRoute) {
				goto("/login");
				return;
			}

			// Redirect logged-in users away from auth pages to dashboard
			if (
				session &&
				(currentPath === "/login" || currentPath === "/signup")
			) {
				goto("/dashboard");
				return;
			}

			// If we are logged in and at root, we STAY at root (user wants this)
			// No logic needed here, just letting the component render.
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<title>Quill</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen">
	{@render children()}
</div>
