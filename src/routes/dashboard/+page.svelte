<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";
  import type { Form } from "../../lib/types";

  let allForms: Form[] = [];
  let loading = true;

  onMount(async () => {
    // Load forms from Supabase
    try {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      allForms = (data as Form[]) || [];
    } catch (error) {
      console.error("Error loading forms:", error);
    } finally {
      loading = false;
    }
  });

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
      <h1 class="text-2xl font-bold text-black">Form Builder</h1>
      <div class="flex gap-4">
        <button
          on:click={handleLogout}
          class="px-4 py-2 text-gray-600 hover:text-black font-medium transition-colors"
        >
          Logout
        </button>
        <a
          href="/profile"
          class="px-4 py-2 text-gray-600 hover:text-black font-medium transition-colors"
        >
          Profile
        </a>
        <button
          on:click={() => navigateToBuilder()}
          class="px-4 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-900 transition-colors"
        >
          + New Form
        </button>
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
        <button
          on:click={() => navigateToBuilder()}
          class="px-6 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-900 transition-colors"
        >
          Create Form
        </button>
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
            <button
              on:click|stopPropagation={() => navigateToBuilder(form)}
              class="text-sm px-4 py-2 bg-black text-white rounded font-medium hover:bg-gray-900 transition-colors"
            >
              Edit Form
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
