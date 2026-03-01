<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { gsap } from "gsap";
  import { Avatar } from "bits-ui";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";
  import type { Form } from "../../lib/types";
  import favicon from "$lib/assets/favicon.svg";

  let allForms = $state<Form[]>([]);
  let sharedForms = $state<Form[]>([]);
  let loading = $state(true);
  let loadingMore = $state(false);
  let hasMore = $state(true);
  let searchQuery = $state("");
  let activeTab = $state<"personal" | "workspace">("personal");
  const PAGE_SIZE = 20;
  let user = $state<any>(null);

  // Derived filtered forms based on active tab
  let filteredForms = $derived(
    (activeTab === "personal" ? allForms : sharedForms).filter((form) =>
      form.title.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  onMount(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    user = session?.user;
    await loadForms();
    await loadSharedForms();
  });

  function generateGradient(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `linear-gradient(135deg, hsl(${hue}, 70%, 96%) 0%, hsl(${(hue + 60) % 360}, 70%, 96%) 100%)`;
  }

  async function loadForms() {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;

      // Fetch questions for all forms
      const formsWithQuestions = await Promise.all(
        (data as Form[])?.map(async (form) => {
          const { data: questionsData } = await supabase
            .from("questions")
            .select("data")
            .eq("form_id", form.id)
            .order("order_index", { ascending: true });

          return {
            ...form,
            questions: questionsData?.map((q) => q.data) || [],
          };
        }) || [],
      );

      allForms = formsWithQuestions;
      hasMore = data && data.length === PAGE_SIZE;

      // Animate in forms
      setTimeout(() => {
        document.querySelectorAll(".form-card").forEach((card, idx) => {
          gsap.fromTo(
            card,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "back.out",
              delay: idx * 0.05,
            },
          );
        });
      }, 0);
    } catch (error) {
      console.error("Error loading forms:", error);
    } finally {
      loading = false;
    }
  }

  async function loadSharedForms() {
    try {
      if (!user) return;

      // Get forms where current user is a collaborator
      const { data: collaborations, error: collabError } = await supabase
        .from("form_collaborators")
        .select("form_id")
        .eq("user_id", user.id);

      // If table doesn't exist or there's an error, just set empty array
      if (collabError) {
        console.warn(
          "form_collaborators table not yet available:",
          collabError,
        );
        sharedForms = [];
        return;
      }

      if (!collaborations || collaborations.length === 0) {
        sharedForms = [];
        return;
      }

      const formIds = collaborations.map((c) => c.form_id);

      // Fetch the actual forms
      const { data: forms, error: formError } = await supabase
        .from("forms")
        .select("*")
        .in("id", formIds)
        .order("updated_at", { ascending: false });

      if (formError) throw formError;

      // Fetch questions for shared forms
      const formsWithQuestions = await Promise.all(
        (forms as Form[])?.map(async (form) => {
          const { data: questionsData } = await supabase
            .from("questions")
            .select("data")
            .eq("form_id", form.id)
            .order("order_index", { ascending: true });

          return {
            ...form,
            questions: questionsData?.map((q) => q.data) || [],
          };
        }) || [],
      );

      sharedForms = formsWithQuestions;
    } catch (error) {
      console.error("Error loading shared forms:", error);
      sharedForms = [];
    }
  }

  async function loadMoreForms() {
    if (loadingMore || !hasMore || !user) return;

    loadingMore = true;
    try {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .range(allForms.length, allForms.length + PAGE_SIZE - 1);

      if (error) throw error;
      if (data && data.length > 0) {
        // Fetch questions for new forms
        const formsWithQuestions = await Promise.all(
          (data as Form[]).map(async (form) => {
            const { data: questionsData } = await supabase
              .from("questions")
              .select("data")
              .eq("form_id", form.id)
              .order("order_index", { ascending: true });

            return {
              ...form,
              questions: questionsData?.map((q) => q.data) || [],
            };
          }),
        );

        allForms = [...allForms, ...formsWithQuestions];
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error("Error loading more forms:", error);
    } finally {
      loadingMore = false;
    }
  }

  function navigateToBuilder(form?: Form) {
    if (form) {
      window.location.href = `/form-builder/${form.id}`;
    } else {
      window.location.href = "/form-builder";
    }
  }

  async function deleteForm(formId: string, formTitle: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${formTitle}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      // Delete from Supabase
      const { error } = await supabase.from("forms").delete().eq("id", formId);

      if (error) throw error;

      // Remove from UI
      allForms = allForms.filter((f) => f.id !== formId);
    } catch (error) {
      console.error("Error deleting form:", error);
      alert("Failed to delete form. Please try again.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    goto("/login");
  }

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return "Recently edited";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
</script>

<div class="min-h-screen bg-[#F8F9FA] font-sans text-slate-900">
  <!-- Header -->
  <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
    <div
      class="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between"
    >
      <div class="flex items-center gap-8">
        <!-- Logo -->
        <a href="/dashboard" class="flex items-center gap-3 group">
          <img
            src={favicon}
            alt="Quill Logo"
            class="w-8 h-8 group-hover:scale-105 transition-transform"
          />
          <span class="text-xl font-bold text-slate-800 tracking-tight"
            >Quill</span
          >
        </a>

        <!-- Global App Tabs -->
        <div class="flex bg-gray-100/80 p-1 rounded-lg">
          <a
            href="/dashboard"
            class="px-4 py-1.5 bg-white rounded-md shadow-sm text-slate-800 text-sm font-medium transition-all"
            >My Forms</a
          >
          <a
            href="/certificate-generator"
            class="px-4 py-1.5 text-gray-500 hover:text-slate-700 text-sm font-medium transition-all flex items-center gap-2"
          >
            Certificate
          </a>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- New Form Button -->
        <a
          href="/form-builder"
          class="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#6366F1] hover:bg-[#5558DD] text-white text-sm font-medium rounded-lg transition-colors shadow-md shadow-indigo-100"
        >
          <i class="fas fa-plus"></i>
          <span>New Form</span>
        </a>

        <!-- Profile -->
        {#if user}
          <div class="relative group cursor-pointer ml-2">
            <Avatar.Root
              class="h-9 w-9 border-2 border-white shadow-sm rounded-full overflow-hidden transition-transform hover:scale-105"
            >
              <Avatar.Image
                src={user.user_metadata?.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                alt={user.email || "User avatar"}
                class="h-full w-full object-cover"
              />
              <Avatar.Fallback
                class="flex items-center justify-center w-full h-full bg-indigo-50 text-indigo-600 font-bold text-xs"
              >
                {user.email?.charAt(0).toUpperCase() || "U"}
              </Avatar.Fallback>
            </Avatar.Root>

            <!-- Quick Profile Menu -->
            <div
              class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right"
            >
              <div class="p-2">
                <a
                  href="/profile"
                  class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <i class="fas fa-user w-4"></i> Profile
                </a>
                <button
                  onclick={handleLogout}
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

  <!-- Main Content -->
  <main class="max-w-[1600px] mx-auto px-6 py-10">
    <!-- Section Header -->
    <div
      class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
    >
      <div class="flex flex-col gap-5">
        <div>
          <h1
            class="text-4xl font-serif font-bold text-slate-900 mb-3 tracking-tight"
          >
            {activeTab === "personal" ? "My Forms" : "Workspace"}
          </h1>
          <div
            class="flex items-center gap-3 text-sm font-medium text-gray-500"
          >
            <span class="flex items-center gap-2 px-1">
              <i
                class="fas {activeTab === 'personal'
                  ? 'fa-user'
                  : 'fa-users'} text-gray-400"
              ></i>
              {activeTab === "personal" ? "Personal Forms" : "Shared with Me"}
            </span>
            <span class="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>{filteredForms.length} Forms</span>
          </div>
        </div>

        <!-- View Toggle -->
        <div class="flex bg-gray-100/80 p-1 rounded-lg w-fit">
          <button
            onclick={() => (activeTab = "personal")}
            class="px-4 py-1.5 {activeTab === 'personal'
              ? 'bg-white rounded-md shadow-sm text-slate-800'
              : 'text-gray-500 hover:text-slate-700'} text-sm font-medium transition-all"
            >Personal</button
          >
          <button
            onclick={() => (activeTab = "workspace")}
            class="px-4 py-1.5 {activeTab === 'workspace'
              ? 'bg-white rounded-md shadow-sm text-slate-800'
              : 'text-gray-500 hover:text-slate-700'} text-sm font-medium transition-all"
            >Workspace{#if sharedForms.length > 0}
              <span
                class="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full"
              >
                {sharedForms.length}
              </span>
            {/if}</button
          >
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="relative flex-1 md:w-80 group">
          <i
            class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
          ></i>
          <input
            type="text"
            placeholder="Search forms..."
            bind:value={searchQuery}
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400"
          />
          {#if searchQuery}
            <button
              onclick={() => (searchQuery = "")}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i class="fas fa-times-circle"></i>
            </button>
          {/if}
        </div>
        <button
          class="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
        >
          <i class="fas fa-filter"></i>
        </button>
      </div>
    </div>

    <!-- Forms Grid -->
    {#if loading}
      <div class="flex items-center justify-center py-32">
        <div class="flex flex-col items-center gap-4">
          <div
            class="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"
          ></div>
          <p class="text-slate-500 font-medium">Loading your workspace...</p>
        </div>
      </div>
    {:else}
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <!-- Create New Form Card - Only show on Personal tab -->
        {#if activeTab === "personal" && !searchQuery}
          <a
            href="/form-builder"
            class="group relative bg-[#F8FAFC] rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 flex flex-col items-center justify-center gap-4 h-[320px] text-center p-6 order-last md:order-none"
          >
            <div
              class="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:scale-110 group-hover:shadow-md transition-all duration-300"
            >
              <i class="fas fa-plus text-2xl"></i>
            </div>
            <div>
              <h3
                class="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors"
              >
                Create New Form
              </h3>
              <p
                class="text-sm text-slate-400 px-4 group-hover:text-slate-500 transition-colors"
              >
                Start from a blank canvas or choose a template
              </p>
            </div>
          </a>
        {/if}

        {#each filteredForms as form (form.id)}
          <div
            class="form-card group relative bg-white rounded-2xl p-4 border border-gray-200/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-300 cursor-pointer flex flex-col h-[320px]"
            role="button"
            tabindex="0"
            onclick={() => navigateToBuilder(form)}
            onkeydown={(e) => e.key === "Enter" && navigateToBuilder(form)}
          >
            <!-- Thumbnail Area -->
            <div
              class="relative h-40 w-full rounded-xl overflow-hidden mb-4 border border-gray-100/50"
              style="background: {generateGradient(form.title)}"
            >
              <!-- Decorative elements -->
              <div class="absolute inset-0 opacity-40">
                <div
                  class="absolute top-4 left-4 w-24 h-4 bg-white/60 rounded-full"
                ></div>
                <div
                  class="absolute top-12 left-4 right-4 h-2 bg-white/40 rounded-full"
                ></div>
                <div
                  class="absolute top-20 left-4 right-12 h-2 bg-white/40 rounded-full"
                ></div>
                <div
                  class="absolute top-28 left-4 right-8 h-2 bg-white/40 rounded-full"
                ></div>
              </div>

              <!-- Menu Trigger -->
              <div class="absolute top-3 right-3 z-20">
                <div class="relative group/menu">
                  <button
                    onclick={(e) => {
                      e.stopPropagation();
                    }}
                    class="w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg text-gray-400 hover:text-indigo-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <i class="fas fa-ellipsis-h"></i>
                  </button>

                  <!-- Dropdown menu -->
                  <div
                    class="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 transform origin-top-right scale-95 group-hover/menu:scale-100"
                  >
                    <button
                      onclick={(e) => {
                        e.stopPropagation();
                        deleteForm(form.id, form.title);
                      }}
                      class="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium text-sm rounded-lg"
                    >
                      <i class="fas fa-trash w-4"></i> Delete Form
                    </button>
                  </div>
                </div>
              </div>

              <!-- Status Badge -->
              <div class="absolute bottom-3 left-3">
                {#if form.published}
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/80 backdrop-blur-md text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-emerald-200/50 shadow-sm"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"
                    ></span> Published
                  </span>
                {:else}
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/80 backdrop-blur-md text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-slate-200/50 shadow-sm"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Draft
                  </span>
                {/if}
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 flex flex-col">
              <h3
                class="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors"
              >
                {form.title}
              </h3>

              <div
                class="flex items-center gap-4 text-xs font-medium text-gray-400 mb-auto"
              >
                <div class="flex items-center gap-1.5">
                  <i class="fas fa-list-ul"></i>
                  {form.questions?.length || 0} questions
                </div>
                <div class="flex items-center gap-1.5">
                  <i class="fas fa-clock"></i>
                  Edited {formatDate(form.updated_at)}
                </div>
              </div>

              <!-- Actions -->
              <div
                class="flex items-center gap-3 pt-4 border-t border-gray-50 mt-4"
              >
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    navigateToBuilder(form);
                  }}
                  class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-100 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 font-semibold text-sm transition-all duration-200"
                >
                  <i class="fas fa-pen-to-square"></i> Edit Form
                </button>
                <button
                  onclick={(e) => {
                    e.stopPropagation(); /* Future Analytics nav */
                  }}
                  class="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-xl transition-all border border-transparent hover:border-gray-200"
                >
                  <i class="far fa-chart-bar text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if searchQuery && filteredForms.length === 0}
        <div class="text-center py-20">
          <div class="mb-4">
            <i class="fas fa-search text-5xl text-gray-200"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-800 mb-2">No forms found</h3>
          <p class="text-slate-400">
            Try adjusting your search query for "{searchQuery}"
          </p>
          <button
            onclick={() => (searchQuery = "")}
            class="mt-6 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
          >
            Clear Search
          </button>
        </div>
      {:else if !searchQuery && filteredForms.length === 0}
        <div class="text-center py-20">
          <div class="mb-4">
            <i
              class="fas {activeTab === 'personal'
                ? 'fa-file-circle-plus'
                : 'fa-handshake'} text-5xl text-gray-200"
            ></i>
          </div>
          <h3 class="text-xl font-bold text-slate-800 mb-2">
            {activeTab === "personal" ? "No forms yet" : "No shared forms yet"}
          </h3>
          <p class="text-slate-400">
            {activeTab === "personal"
              ? "Create your first form to get started"
              : "Forms shared with you will appear here"}
          </p>
          {#if activeTab === "personal"}
            <a
              href="/form-builder"
              class="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <i class="fas fa-plus"></i> Create Form
            </a>
          {/if}
        </div>
      {/if}

      {#if hasMore && !searchQuery && activeTab === "personal"}
        <div class="text-center mt-12 mb-8">
          <button
            onclick={loadMoreForms}
            disabled={loadingMore}
            class="px-6 py-2.5 bg-white border border-gray-200 text-slate-600 rounded-full font-medium shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50"
          >
            {#if loadingMore}
              <i class="fas fa-spinner fa-spin mr-2"></i> Loading...
            {:else}
              Load More Forms
            {/if}
          </button>
        </div>
      {/if}
    {/if}
  </main>
</div>
