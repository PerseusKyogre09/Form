<script lang="ts">
	import { supabase } from "$lib/supabaseClient";

	async function handleLogout() {
		await supabase.auth.signOut();
	}
</script>

<div
	class="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8"
>
	<div class="max-w-md w-full space-y-8 text-center">
		<div>
			<svg
				class="mx-auto h-20 w-20 text-red-500 mb-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4v2m0 4v2m0-12a9 9 0 110-18 9 9 0 010 18z"
				/>
			</svg>
			<h1 class="text-4xl font-extrabold text-white mb-2">Unauthorized Access</h1>
			<p class="text-xl text-gray-400 mb-8">Turn Back</p>
		</div>

		<div class="space-y-4">
			<p class="text-gray-300 text-sm">
				You do not have permission to access this application. Please contact the administrator if you
				believe this is an error.
			</p>
			<button
				on:click={handleLogout}
				class="w-full flex justify-center py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors active:scale-[0.98]"
			>
				Sign Out
			</button>
		</div>
	</div>
</div>
