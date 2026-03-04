<script lang="ts">
    import { onMount } from "svelte";
    import { authClient } from "$lib/authClient";
    import { goto } from "$app/navigation";
    import { fade } from "svelte/transition";
    import { Button } from "bits-ui";

    let loading = true;
    let saving = false;
    let username = "";
    let displayName = "";
    let bio = "";
    let location = "";
    let website = "";
    let avatarUrl = "";
    let twitterUrl = "";
    let linkedinUrl = "";
    let githubUrl = "";
    let themePreference = "light";
    let message = "";
    let error = "";
    let user: any = null;
    let avatarFile: File | null = null;
    let avatarPreview = "";

    import {
        themePreference as themeStore,
        applyTheme,
    } from "$lib/stores/theme";

    // Subscribe to theme store and reflect changes
    $: themePreference = $themeStore;

    function handleThemeChange() {
        themeStore.set(themePreference as "light" | "dark" | "auto");
        applyTheme(themePreference as "light" | "dark" | "auto");
    }

    onMount(async () => {
        const { data: session } = await authClient.getSession();
        if (!session?.user) {
            goto("/login");
            return;
        }
        user = session.user;
        await loadProfile();
    });

    async function loadProfile() {
        try {
            loading = true;
            const res = await fetch("/api/profile");
            if (!res.ok) throw new Error("Failed to load profile");
            const { profile } = await res.json();

            if (profile) {
                username = profile.username || "";
                displayName = profile.display_name || profile.name || "";
                bio = profile.bio || "";
                location = profile.location || "";
                website = profile.website || "";
                twitterUrl = profile.twitter_url || "";
                linkedinUrl = profile.linkedin_url || "";
                githubUrl = profile.github_url || "";
                themePreference = profile.theme_preference || "light";
                avatarUrl = profile.image || "";
                avatarPreview = avatarUrl;
            }
        } catch (e: any) {
            console.error("Error loading profile:", e);
            error = e.message;
        } finally {
            loading = false;
        }
    }

    function handleAvatarChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            avatarFile = file;
            const reader = new FileReader();
            reader.onload = (event) => {
                avatarPreview = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    async function updateProfile() {
        try {
            saving = true;
            message = "";
            error = "";

            // TODO: Avatar upload will use R2 once configured
            let newAvatarUrl = avatarUrl;

            const updates = {
                username,
                display_name: displayName,
                bio,
                location,
                website,
                avatar_url: newAvatarUrl,
                twitter_url: twitterUrl,
                linkedin_url: linkedinUrl,
                github_url: githubUrl,
                theme_preference: themePreference,
            };

            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update profile");
            }

            avatarUrl = newAvatarUrl;
            avatarFile = null;
            message = "Profile updated successfully!";
            setTimeout(() => (message = ""), 3000);
        } catch (e: any) {
            console.error("Error updating profile:", e);
            error = e.message;
        } finally {
            saving = false;
        }
    }
</script>

<div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors"
>
    <!-- Header -->
    <header
        class="border-b border-slate-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 shadow-sm transition-colors"
    >
        <div
            class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between"
        >
            <div class="flex items-center gap-4">
                <button
                    onclick={() => goto("/dashboard")}
                    class="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg"
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
                <div>
                    <h1
                        class="text-2xl font-bold text-slate-900 dark:text-white"
                    >
                        Your Profile
                    </h1>
                    <p class="text-sm text-slate-500 dark:text-gray-400">
                        Manage your account and settings
                    </p>
                </div>
            </div>
        </div>
    </header>

    <div class="max-w-4xl mx-auto px-6 py-12">
        {#if loading}
            <div class="flex flex-col items-center justify-center py-24">
                <div
                    class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-900 mb-4"
                ></div>
                <p class="text-slate-600">Loading your profile...</p>
            </div>
        {:else}
            <div class="space-y-8">
                <!-- Avatar & Basic Info Section -->
                <div
                    class="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden transition-colors"
                >
                    <div
                        class="bg-gradient-to-r from-blue-500 to-blue-600 h-32"
                    ></div>
                    <div class="px-8 pb-8">
                        <div
                            class="flex flex-col sm:flex-row gap-6 items-start"
                        >
                            <!-- Avatar -->
                            <div class="mt-0 sm:mt-0 relative -mt-16">
                                <div
                                    class="w-32 h-32 rounded-xl border-4 border-white bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg overflow-hidden"
                                >
                                    {#if avatarPreview}
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar"
                                            class="w-full h-full object-cover"
                                        />
                                    {:else}
                                        {displayName
                                            ? displayName
                                                  .charAt(0)
                                                  .toUpperCase()
                                            : user?.email
                                                  ?.charAt(0)
                                                  .toUpperCase() || "U"}
                                    {/if}
                                </div>
                                <label
                                    for="avatar-input"
                                    class="absolute bottom-2 right-2 bg-slate-900 dark:bg-gray-800 hover:bg-slate-800 dark:hover:bg-gray-700 border border-transparent dark:border-gray-600 text-white p-2 rounded-lg cursor-pointer transition-colors shadow-lg"
                                    title="Change avatar"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        ><path
                                            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                                        /></svg
                                    >
                                </label>
                                <input
                                    type="file"
                                    id="avatar-input"
                                    accept="image/*"
                                    onchange={handleAvatarChange}
                                    class="hidden"
                                />
                            </div>

                            <!-- Name Info -->
                            <div class="flex-1 pt-4">
                                <h2
                                    class="text-3xl font-bold text-slate-900 dark:text-white"
                                >
                                    {displayName ||
                                        user?.email?.split("@")[0] ||
                                        "Welcome"}
                                </h2>
                                <p
                                    class="text-slate-600 dark:text-gray-400 mt-1"
                                >
                                    {username
                                        ? `quill.geekroom-srmist.co.in/form/${username}`
                                        : "Set a username to get started"}
                                </p>
                                {#if user?.email}
                                    <p
                                        class="text-sm text-slate-500 dark:text-gray-500 mt-2"
                                    >
                                        {user.email}
                                    </p>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Form -->
                <form
                    onsubmit={(e) => {
                        e.preventDefault();
                        updateProfile();
                    }}
                    class="space-y-6"
                >
                    <!-- Basic Information -->
                    <div
                        class="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm p-8 transition-colors"
                    >
                        <h3
                            class="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path
                                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                                /><circle cx="12" cy="7" r="4" /></svg
                            >
                            Basic Information
                        </h3>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label
                                    for="displayName"
                                    class="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
                                    >Display Name</label
                                >
                                <input
                                    type="text"
                                    id="displayName"
                                    bind:value={displayName}
                                    placeholder="Your full name"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:placeholder:text-gray-500"
                                />
                                <p
                                    class="text-xs text-slate-500 dark:text-gray-400 mt-1"
                                >
                                    How your name appears to others
                                </p>
                            </div>

                            <div>
                                <label
                                    for="username"
                                    class="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
                                    >Username</label
                                >
                                <input
                                    type="text"
                                    id="username"
                                    bind:value={username}
                                    placeholder="Choose a username"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:placeholder:text-gray-500"
                                />
                                {#if username}
                                    <p
                                        class="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium"
                                    >
                                        ✓ quill.com/form/<span
                                            class="font-semibold"
                                            >{username}</span
                                        >
                                    </p>
                                {/if}
                            </div>

                            <div class="sm:col-span-2">
                                <label
                                    for="bio"
                                    class="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
                                    >Bio</label
                                >
                                <textarea
                                    id="bio"
                                    bind:value={bio}
                                    placeholder="Tell us about yourself..."
                                    rows="3"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none dark:placeholder:text-gray-500"
                                ></textarea>
                                <p
                                    class="text-xs text-slate-500 dark:text-gray-400 mt-1"
                                >
                                    {bio.length} / 500 characters
                                </p>
                            </div>

                            <div>
                                <label
                                    for="location"
                                    class="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
                                    >Location</label
                                >
                                <input
                                    type="text"
                                    id="location"
                                    bind:value={location}
                                    placeholder="City, Country"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:placeholder:text-gray-500"
                                />
                            </div>

                            <div>
                                <label
                                    for="website"
                                    class="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
                                    >Website</label
                                >
                                <input
                                    type="url"
                                    id="website"
                                    bind:value={website}
                                    placeholder="https://example.com"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:placeholder:text-gray-500"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Social Links -->
                    <div
                        class="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm p-8 transition-colors"
                    >
                        <h3
                            class="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><circle cx="12" cy="12" r="1" /><circle
                                    cx="19"
                                    cy="12"
                                    r="1"
                                /><circle cx="5" cy="12" r="1" /></svg
                            >
                            Social Links
                        </h3>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label
                                    for="github"
                                    class="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"
                                    ><i class="fab fa-github text-base"></i> GitHub</label
                                >
                                <input
                                    type="url"
                                    id="github"
                                    bind:value={githubUrl}
                                    placeholder="https://github.com/username"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:placeholder:text-gray-500"
                                />
                            </div>
                            <div>
                                <label
                                    for="twitter"
                                    class="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"
                                    ><i class="fab fa-x-twitter text-base"></i> X</label
                                >
                                <input
                                    type="url"
                                    id="twitter"
                                    bind:value={twitterUrl}
                                    placeholder="https://x.com/username"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:placeholder:text-gray-500"
                                />
                            </div>
                            <div>
                                <label
                                    for="linkedin"
                                    class="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"
                                    ><i class="fab fa-linkedin text-base"></i> LinkedIn</label
                                >
                                <input
                                    type="url"
                                    id="linkedin"
                                    bind:value={linkedinUrl}
                                    placeholder="https://linkedin.com/in/username"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:placeholder:text-gray-500"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Preferences -->
                    <div
                        class="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm p-8 transition-colors"
                    >
                        <h3
                            class="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><circle cx="12" cy="12" r="3" /><path
                                    d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 0l4.24-4.24M1 12h6m6 0h6m-1.78 7.78l-4.24-4.24m-3.08 0l-4.24 4.24"
                                /></svg
                            >
                            Preferences
                        </h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label
                                    for="theme"
                                    class="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
                                    >Theme Preference</label
                                >
                                <select
                                    id="theme"
                                    bind:value={themePreference}
                                    onchange={handleThemeChange}
                                    class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="auto">Auto</option>
                                </select>
                                <p
                                    class="text-xs text-slate-500 dark:text-gray-400 mt-1"
                                >
                                    Choose your preferred interface theme
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-col sm:flex-row gap-4 items-start">
                        <button
                            type="submit"
                            disabled={saving}
                            class="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-md inline-flex items-center justify-center gap-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path
                                    d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                                /></svg
                            >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onclick={() => loadProfile()}
                            disabled={saving}
                            class="w-full sm:w-auto px-6 py-3 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-gray-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><polyline points="23 4 23 10 17 10" /><path
                                    d="M20.49 15a9 9 0 1 1-2-8.83"
                                /></svg
                            >
                            Reset
                        </button>
                    </div>

                    <!-- Messages -->
                    {#if message}
                        <div
                            transition:fade
                            class="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-sm flex items-center gap-3"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><polyline points="20 6 9 17 4 12" /></svg
                            >
                            {message}
                        </div>
                    {/if}

                    {#if error}
                        <div
                            transition:fade
                            class="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50 text-sm flex items-center gap-3"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><circle cx="12" cy="12" r="10" /><path
                                    d="M12 8v4M12 16h.01"
                                /></svg
                            >
                            {error}
                        </div>
                    {/if}
                </form>
            </div>
        {/if}
    </div>
</div>
