<script lang="ts">
    import { authClient } from "$lib/authClient";
    import { goto } from "$app/navigation";

    let loading = false;
    let errorMsg = "";
    let email = "";
    let password = "";

    async function handleLogin() {
        try {
            loading = true;
            errorMsg = "";

            const { error } = await authClient.signIn.email({
                email,
                password,
            });

            if (error) throw error;
            goto("/dashboard");
        } catch (error: any) {
            errorMsg = error.message || "Failed to sign in";
        } finally {
            loading = false;
        }
    }
</script>

<div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors"
>
    <div class="max-w-md w-full space-y-8">
        <div>
            <h2
                class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white"
            >
                Sign into your account
            </h2>
        </div>
        <form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
            {#if errorMsg}
                <div
                    class="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg p-3"
                >
                    {errorMsg}
                </div>
            {/if}

            <div class="space-y-4">
                <div>
                    <label
                        for="email"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >Email</label
                    >
                    <input
                        type="email"
                        id="email"
                        bind:value={email}
                        required
                        placeholder="you@example.com"
                        class="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-gray-500 transition-all text-sm dark:text-white dark:placeholder:text-gray-500"
                    />
                </div>
                <div>
                    <label
                        for="password"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >Password</label
                    >
                    <input
                        type="password"
                        id="password"
                        bind:value={password}
                        required
                        placeholder="••••••••"
                        class="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-gray-500 transition-all text-sm dark:text-white dark:placeholder:text-gray-500"
                    />
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={loading}
                    class="w-full flex justify-center py-3 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black shadow-sm hover:bg-black/90 dark:hover:bg-gray-100
	h-12 items-center justify-center text-[15px]
	font-semibold active:scale-[0.98] active:transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white dark:focus:ring-offset-gray-950 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </div>
        </form>
    </div>
</div>
