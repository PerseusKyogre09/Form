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
			const currentPath = $page.url.pathname as string;
			const isPublicRoute =
				currentPath === "/login" ||
				currentPath === "/signup" ||
				currentPath.startsWith("/form/");

			if (!session && !isPublicRoute) {
				goto("/login");
			} else if (
				session &&
				(currentPath === "/login" || currentPath === "/signup")
			) {
				goto("/");
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen">
	{@render children()}
</div>
