<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";
  import type { Form } from "../../lib/types";
  import { Avatar, Button } from "bits-ui";

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
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;
      allForms = (data as Form[]) || [];
      hasMore = data && data.length === PAGE_SIZE;
    } catch (error) {
      console.error("Error loading forms:", error);
    } finally {
      loading = false;
    }
  }

  async function loadMoreForms() {
    if (loadingMore || !hasMore) return;

    loadingMore = true;
    try {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .order("created_at", { ascending: false })
        .range(allForms.length, allForms.length + PAGE_SIZE - 1);

      if (error) throw error;
      if (data && data.length > 0) {
        allForms = [...allForms, ...(data as Form[])];
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

  async function handleLogout() {
    await supabase.auth.signOut();
    goto("/login");
  }
</script>

<div class="min-h-screen bg-white">
  <header class="border-b border-gray-200 sticky top-0 bg-white z-50">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold text-black">Quill</h1>
        {#if user}
          <a href="/profile">
            <Avatar.Root
              delayMs={200}
              class="data-[status=loaded]:border-gray-900 bg-gray-100 text-gray-600 h-12 w-12 rounded-full border text-[17px] font-medium uppercase data-[status=loading]:border-transparent"
            >
              <div
                class="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-transparent"
              >
                <Avatar.Image src={user.user_metadata?.avatar_url || ""} alt={user.email || "User"} />
                <Avatar.Fallback class="border-gray-200 border">{user.email?.charAt(0).toUpperCase() || "U"}</Avatar.Fallback>
              </div>
            </Avatar.Root>
          </a>
        {/if}
      </div>
      <div class="flex gap-4">
        <button
          on:click={handleLogout}
          class="rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all cursor-pointer"
        >
          Logout
        </button>
        <a
          href="/form-builder"
          class="rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
        >
          + New Form
        </a>
      </div>
    </div>
  </header>

  <div class="max-w-6xl mx-auto px-6 py-8">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-black mb-2">My Forms</h2>
      <p class="text-gray-600">
        {allForms.length} form{allForms.length !== 1 ? "s" : ""}
      </p>
    </div>

    {#if loading}
      <div class="text-center py-12">
        <p class="text-gray-500">Loading forms...</p>
      </div>
    {:else if allForms.length === 0}
      <div
        class="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg"
      >
        <p class="text-gray-500 mb-4">No forms yet. Create your first form!</p>
        <Button.Root
          on:click={() => navigateToBuilder()}
          class="rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
        >
          Create Form
        </Button.Root>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each allForms as form}
          <div
            class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            role="button"
            tabindex="0"
            on:click={() => navigateToBuilder(form)}
            on:keydown={(e) => e.key === "Enter" && navigateToBuilder(form)}
          >
            <h3 class="text-lg font-bold text-black mb-2">{form.title}</h3>
            <p class="text-sm text-gray-600 mb-4">
              {form.questions.length} question{form.questions.length !== 1
                ? "s"
                : ""}
            </p>
            <Button.Root
              on:click={(e) => { e.stopPropagation(); navigateToBuilder(form); }}
              class="rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
            >
              Edit Form
            </Button.Root>
          </div>
        {/each}
      </div>
      {#if hasMore}
        <div class="text-center mt-8">
          <Button.Root
            on:click={loadMoreForms}
            disabled={loadingMore}
            class="rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? "Loading..." : "Load More Forms"}
          </Button.Root>
        </div>
      {/if}
    {/if}
  </div>
</div>
