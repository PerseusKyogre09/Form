<script lang="ts">
    import { supabase } from "$lib/supabaseClient";

    let loading = false;
    let errorMsg = "";

    async function handleGitHubLogin() {
        try {
            loading = true;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "github",
                options: {
                    redirectTo: `${window.location.protocol}//${window.location.host}/dashboard`,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            errorMsg = error.message;
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
                Sign up with GitHub
            </h2>
        </div>
        <div class="mt-8 space-y-6">
            {#if errorMsg}
                <div class="text-red-500 text-sm text-center">{errorMsg}</div>
            {/if}
                <button
                    type="button"
                    on:click={handleGitHubLogin}
                    disabled={loading}
                    class="w-full flex justify-center py-2 px-4 rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                    <svg
                        class="h-5 w-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.337-3.369-1.337-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.597 1.028 2.688 0 3.848-2.339 4.685-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10c0-5.523-4.477-10-10-10z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    Sign in with GitHub
                </button>
            </div>
        </div>
    </div>
</div>
