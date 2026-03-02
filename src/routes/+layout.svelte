<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";
	import { supabase } from "$lib/supabaseClient";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import NotificationContainer from "$lib/components/NotificationContainer.svelte";
	import { themePreference, applyTheme } from "$lib/stores/theme";

	let { children } = $props();

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
				currentPath === "/certificate-generator" ||
				currentPath.startsWith("/form/") ||
				currentPath.startsWith("/preview/");

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

			// Load theme preference from profile when user is logged in
			if (
				session &&
				(event === "SIGNED_IN" || event === "INITIAL_SESSION")
			) {
				try {
					const { data: profile } = await supabase
						.from("profiles")
						.select("theme_preference")
						.eq("id", session.user.id)
						.single();

					if (profile?.theme_preference) {
						const pref = profile.theme_preference as
							| "light"
							| "dark"
							| "auto";
						themePreference.set(pref);
						applyTheme(pref);
					}
				} catch (e) {
					// Profile may not exist yet, use default
				}
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
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<NotificationContainer />

<div class="min-h-screen">
	{@render children()}
</div>
