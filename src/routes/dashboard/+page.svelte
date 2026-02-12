<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { gsap } from "gsap";
  import { Avatar } from "bits-ui";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";
  import type { Form } from "../../lib/types";

  let allForms: Form[] = [];
  let loading = true;
  let loadingMore = false;
  let hasMore = true;
  const PAGE_SIZE = 20;
  let user: any = null;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user;
    await loadForms();
  });

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
            questions: questionsData?.map(q => q.data) || []
          };
        }) || []
      );
      
      allForms = formsWithQuestions;
      hasMore = data && data.length === PAGE_SIZE;
      
      // Animate in forms
      setTimeout(() => {
        document.querySelectorAll('.form-card').forEach((card, idx) => {
          gsap.fromTo(
            card,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'back.out', delay: idx * 0.05 }
          );
        });
      }, 0);
    } catch (error) {
      console.error("Error loading forms:", error);
    } finally {
      loading = false;
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
              questions: questionsData?.map(q => q.data) || []
            };
          })
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
      `Are you sure you want to delete "${formTitle}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from("forms")
        .delete()
        .eq("id", formId);

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

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
  <!-- Header -->
  <header class="border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-md z-50">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Quill</div>
        {#if user}
          <a href="/profile" class="ml-2 transition-transform hover:scale-110">
            <Avatar.Root class="h-10 w-10">
              <Avatar.Image 
                src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                alt={user.email || "User avatar"}
              />
              <Avatar.Fallback class="flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-sm">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </Avatar.Fallback>
            </Avatar.Root>
          </a>
        {/if}
      </div>
      <div class="flex gap-3">
        <button
          on:click={handleLogout}
          class="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
        >
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
        <a
          href="/form-builder"
          class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <i class="fas fa-plus"></i> New Form
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-6 py-12">
    <!-- Hero Section -->
    <div class="mb-12">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-3">My Forms</h1>
      <p class="text-lg text-gray-600 flex items-center gap-2">
        <i class="fas fa-file-alt text-blue-600"></i>
        {allForms.length} form{allForms.length !== 1 ? "s" : ""}
        {#if allForms.length > 0}
          <span class="text-gray-400">•</span>
          <span class="text-blue-600 font-medium">Sorted by recently edited</span>
        {/if}
      </p>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="inline-block">
            <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          </div>
          <p class="text-gray-600 text-lg">Loading your forms...</p>
        </div>
      </div>
    {:else if allForms.length === 0}
      <div class="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300 shadow-sm">
        <div class="mb-4">
          <i class="fas fa-inbox text-5xl text-gray-300 mb-4"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-2">No forms yet</h3>
        <p class="text-gray-600 mb-8">Create your first form to get started</p>
        <a
          href="/form-builder"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <i class="fas fa-plus"></i> Create Your First Form
        </a>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each allForms as form (form.id)}
          <div
            class="form-card group bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden relative"
            role="button"
            tabindex="0"
            on:click={() => navigateToBuilder(form)}
            on:keydown={(e) => e.key === "Enter" && navigateToBuilder(form)}
          >
            <!-- Status badge -->
            <div class="absolute top-4 right-4 flex gap-2 items-start">
              <div class="flex gap-2">
                {#if form.published}
                  <span class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    <i class="fas fa-check-circle"></i> Published
                  </span>
                {/if}
                {#if form.closed}
                  <span class="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    <i class="fas fa-lock"></i> Closed
                  </span>
                {/if}
              </div>
              <!-- Three-dot menu -->
              <div class="relative group/menu">
                <button
                  on:click={(e) => { e.stopPropagation(); }}
                  class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                  title="More options"
                >
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <!-- Dropdown menu -->
                <div class="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
                  <button
                    on:click={(e) => {
                      e.stopPropagation();
                      deleteForm(form.id, form.title);
                    }}
                    class="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium text-sm rounded-lg hover:rounded-none hover:rounded-b-lg first:hover:rounded-t-lg"
                  >
                    <i class="fas fa-trash"></i> Delete Form
                  </button>
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="mb-6 pr-20">
              <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{form.title}</h3>
              <div class="flex items-center gap-4 text-sm text-gray-600">
                <span class="flex items-center gap-1">
                  <i class="fas fa-file-lines text-blue-500"></i>
                  {(form.questions?.length) || 0} question{(form.questions?.length) !== 1 ? "s" : ""}
                </span>
                <span class="flex items-center gap-1">
                  <i class="fas fa-clock text-gray-400"></i>
                  {formatDate(form.updated_at)}
                </span>
              </div>
            </div>

            <!-- Action button -->
            <button
              on:click={(e) => { e.stopPropagation(); navigateToBuilder(form); }}
              class="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg"
            >
              <i class="fas fa-edit"></i> Edit Form
            </button>
          </div>
        {/each}
      </div>

      {#if hasMore}
        <div class="text-center mt-12">
          <button
            on:click={loadMoreForms}
            disabled={loadingMore}
            class="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {#if loadingMore}
              <i class="fas fa-spinner fa-spin"></i> Loading...
            {:else}
              <i class="fas fa-arrow-down"></i> Load More Forms
            {/if}
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>
