<!-- src/lib/components/DashboardHeader.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { Avatar } from "bits-ui";
    import { supabase } from "$lib/supabaseClient";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import favicon from "$lib/assets/favicon.svg";

    let user = $state<any>(null);
    let currentPath = $derived($page.url.pathname);

    onMount(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            user = session?.user;
        });

        // Listen for auth changes to update user state
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            user = session?.user;
        });

        return () => subscription.unsubscribe();
    });

    async function handleLogout() {
        await supabase.auth.signOut();
        goto("/login");
    }
</script>

<header
    class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shrink-0 transition-colors"
>
    <div
        class="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between"
    >
        <div class="flex items-center gap-4 sm:gap-8">
            <!-- Logo -->
            <a href="/dashboard" class="flex items-center gap-2 sm:gap-3 group">
                <img
                    src={favicon}
                    alt="Quill Logo"
                    class="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-105 transition-transform"
                />
                <span
                    class="text-lg sm:text-xl font-bold text-slate-800 dark:text-white tracking-tight hidden min-[400px]:inline"
                    >Quill</span
                >
            </a>

            <!-- Global App Tabs -->
            <div class="flex bg-gray-100/80 dark:bg-gray-800 p-1 rounded-lg">
                <a
                    href="/dashboard"
                    class="px-2.5 sm:px-4 py-1 sm:py-1.5 transition-all text-xs sm:text-sm font-medium {currentPath ===
                        '/dashboard' || currentPath.startsWith('/form-builder')
                        ? 'bg-white dark:bg-gray-700 rounded-md shadow-sm text-slate-800 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}"
                >
                    My Forms
                </a>
                <a
                    href="/certificate-generator"
                    class="px-2.5 sm:px-4 py-1 sm:py-1.5 transition-all text-xs sm:text-sm font-medium flex items-center gap-2 {currentPath ===
                    '/certificate-generator'
                        ? 'bg-white dark:bg-gray-700 rounded-md shadow-sm text-slate-800 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}"
                >
                    Certificate
                </a>
            </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-4">
            <!-- New Form Button -->
            <!-- Only show on dashboard and hidden on mobile -->
            {#if currentPath === "/dashboard"}
                <a
                    href="/form-builder"
                    class="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#6366F1] hover:bg-[#5558DD] text-white text-sm font-medium rounded-lg transition-colors shadow-md shadow-indigo-100 dark:shadow-indigo-900/30"
                >
                    <i class="fas fa-plus"></i>
                    <span>New Form</span>
                </a>
            {/if}

            <!-- Profile -->
            {#if user}
                <div class="relative group cursor-pointer ml-1 sm:ml-2">
                    <Avatar.Root
                        class="h-8 w-8 sm:h-9 sm:h-9 border-2 border-white dark:border-gray-700 shadow-sm rounded-full overflow-hidden transition-transform hover:scale-105"
                    >
                        <Avatar.Image
                            src={user.user_metadata?.avatar_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                            alt={user.email || "User avatar"}
                            class="h-full w-full object-cover"
                        />
                        <Avatar.Fallback
                            class="flex items-center justify-center w-full h-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-bold text-xs"
                        >
                            {user.email?.charAt(0).toUpperCase() || "U"}
                        </Avatar.Fallback>
                    </Avatar.Root>

                    <!-- Profile Menu -->
                    <div
                        class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right group-hover:scale-100 scale-95"
                    >
                        <div class="p-2">
                            <a
                                href="/profile"
                                class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <i class="fas fa-user w-4"></i> Profile
                            </a>
                            <button
                                onclick={handleLogout}
                                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <i class="fas fa-sign-out-alt w-4"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</header>
