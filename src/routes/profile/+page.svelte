<script lang="ts">
    import { onMount } from "svelte";
    import { supabase } from "$lib/supabaseClient";
    import { goto } from "$app/navigation";
    import { fade } from "svelte/transition";
    import { Button } from "bits-ui";

    let loading = true;
    let saving = false;
    let username = "";
    let message = "";
    let error = "";
    let user: any = null;

    onMount(async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            goto("/login");
            return;
        }

        user = session.user;
        await loadProfile();
    });

    async function loadProfile() {
        try {
            loading = true;
            const { data, error: fetchError } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", user.id)
                .single();

            if (fetchError) throw fetchError;
            if (data) {
                username = data.username || "";
            }
        } catch (e: any) {
            console.error("Error loading profile:", e);
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function updateProfile() {
        try {
            saving = true;
            message = "";
            error = "";

            const updates = {
                id: user.id,
                username,
                updated_at: new Date().toISOString(),
            };

            const { error: upsertError } = await supabase
                .from("profiles")
                .upsert(updates);

            if (upsertError) throw upsertError;
            message = "Profile updated successfully!";
        } catch (e: any) {
            console.error("Error updating profile:", e);
            error = e.message;
        } finally {
            saving = false;
        }
    }
</script>

<div class="min-h-screen bg-white">
    <header class="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div
            class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between"
        >
            <div class="flex items-center gap-4">
                <button
                    onclick={() => goto("/dashboard")}
                    class="text-gray-500 hover:text-black transition-colors"
                    title="Back to Dashboard"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-arrow-left"
                        ><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg
                    >
                </button>
                <h1 class="text-2xl font-bold text-black">Profile</h1>
            </div>
        </div>
    </header>

    <div class="max-w-2xl mx-auto px-6 py-12">
        <div class="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <h2 class="text-xl font-bold mb-6">Your Information</h2>

            {#if loading}
                <div class="flex justify-center py-8">
                    <div
                        class="animate-spin rounded-full h-8 w-8 border-b-2 border-black"
                    ></div>
                </div>
            {:else}
                <div class="space-y-6">
                    <div>
                        <label
                            for="email"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >Email</label
                        >
                        <input
                            type="text"
                            id="email"
                            value={user?.email}
                            disabled
                            class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                        />
                        <p class="mt-1 text-xs text-gray-500">
                            Email cannot be changed.
                        </p>
                    </div>

                    <div>
                        <label
                            for="username"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >Username</label
                        >
                        <div class="relative">
                            <input
                                type="text"
                                id="username"
                                bind:value={username}
                                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                                placeholder="Choose a username"
                            />
                        </div>
                        <!-- Helper text showing public URL if username exists -->
                        {#if username}
                            <p class="mt-1 text-xs text-gray-500">
                                Your forms will be available at: quill.com/form/<span
                                    class="font-bold text-gray-700"
                                    >{username}</span
                                >/[slug]
                            </p>
                        {/if}
                    </div>

                    <div class="pt-4">
                        <button
                            type="button"
                            onclick={updateProfile}
                            disabled={saving}
                            class="w-full sm:w-auto px-6 py-2.5 bg-black text-white rounded-xl font-semibold hover:bg-black/90 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-sm inline-flex h-12 items-center justify-center px-[21px] text-[15px]"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>

                    {#if message}
                        <div
                            transition:fade
                            class="p-4 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm"
                        >
                            {message}
                        </div>
                    {/if}

                    {#if error}
                        <div
                            transition:fade
                            class="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm"
                        >
                            {error}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>
