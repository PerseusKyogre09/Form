<script lang="ts">
    import { supabase } from "$lib/supabaseClient";
    import { goto } from "$app/navigation";

    let loading = false;
    let errorMsg = "";
    let email = "";
    let password = "";

    async function handleLogin() {
        try {
            loading = true;
            errorMsg = "";

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            goto("/dashboard");
        } catch (error: any) {
            errorMsg = error.message;
        } finally {
            loading = false;
        }
    }
</script>

<div
    class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
>
    <div class="max-w-md w-full space-y-8">
        <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Sign into your account
            </h2>
        </div>
        <form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
            {#if errorMsg}
                <div
                    class="text-red-500 text-sm text-center bg-red-50 border border-red-100 rounded-lg p-3"
                >
                    {errorMsg}
                </div>
            {/if}

            <div class="space-y-4">
                <div>
                    <label
                        for="email"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Email</label
                    >
                    <input
                        type="email"
                        id="email"
                        bind:value={email}
                        required
                        placeholder="you@example.com"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-sm"
                    />
                </div>
                <div>
                    <label
                        for="password"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Password</label
                    >
                    <input
                        type="password"
                        id="password"
                        bind:value={password}
                        required
                        placeholder="••••••••"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-sm"
                    />
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={loading}
                    class="w-full flex justify-center py-3 px-4 rounded-xl bg-black text-white shadow-sm hover:bg-black/90
	h-12 items-center justify-center text-[15px]
	font-semibold active:scale-[0.98] active:transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </div>
        </form>
    </div>
</div>
