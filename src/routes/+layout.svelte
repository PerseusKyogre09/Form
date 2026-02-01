<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";
	import { supabase } from "$lib/supabaseClient";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import NotificationContainer from "$lib/components/NotificationContainer.svelte";

	let { children } = $props();

	// Whitelist of allowed GitHub usernames
	const ALLOWED_GITHUB_USERS = ["PerseusKyogre09", "Googoochadwick"];

	onMount(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			const currentPath = $page.url.pathname;
			const isPublicRoute =
				currentPath === "/" ||
				currentPath === "/login" ||
				currentPath === "/signup" ||
				currentPath === "/unauthorized" ||
				currentPath.startsWith("/form/");

			// Protected route logic
			if (!session && !isPublicRoute) {
				goto("/login");
				return;
			}

			// If user is logged in, verify they're in the whitelist
			if (session) {
				const userMetadata = session.user?.user_metadata;
				const githubUsername = userMetadata?.user_name;

				if (!githubUsername || !ALLOWED_GITHUB_USERS.includes(githubUsername)) {
					// User is not authorized, redirect to unauthorized page
					goto("/unauthorized");
					return;
				}
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
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
</svelte:head>

<NotificationContainer />

<div class="min-h-screen">
	{@render children()}
</div>
