<!-- src/routes/form/[username]/[slug]/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import FormPreview from "../../../../lib/components/FormPreview.svelte";
  import type { Form } from "../../../../lib/types";
  import { supabase } from "$lib/supabaseClient";

  let formData: Form | undefined;
  let notFound = false;
  let loading = true;

  async function loadForm() {
    try {
      const username = $page.params.username as string;
      const slug = $page.params.slug as string;

      const { data, error } = await supabase
        .rpc('get_form_by_username_slug', {
          p_username: username,
          p_slug: slug
        });

      if (error || !data || data.length === 0) {
        console.error("Error loading form:", error);
        notFound = true;
      } else {
        formData = data[0] as Form;
        notFound = false;
      }
    } catch (error) {
      console.error("Error loading form:", error);
      notFound = true;
    } finally {
      loading = false;
    }
  }

  loadForm();

  function onSubmit(answers: Record<string, any>) {
    const username = $page.params.username;
    const slug = $page.params.slug;
    window.location.href = `/form/${username}/${slug}/success`;
  }
</script>

<div class="min-h-screen bg-white">
  <header class="border-b border-gray-200 sticky top-0 bg-white z-50">
    <div class="max-w-6xl mx-auto px-6 py-4">
      <h1 class="text-2xl font-bold text-black">{formData?.title || "Form"}</h1>
    </div>
  </header>

  <div class="max-w-6xl mx-auto px-6 py-8">
    {#if loading}
      <div class="text-center py-12">
        <p class="text-gray-500">Loading form...</p>
      </div>
    {:else if notFound}
      <div class="text-center py-12">
        <p class="text-gray-500 text-lg">
          Form not found. Please check the link and try again.
        </p>
      </div>
    {:else if formData}
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="w-full max-w-2xl">
          <FormPreview
            questions={formData.questions}
            formId={formData.id}
            {onSubmit}
          />
        </div>
      </div>
    {/if}
  </div>
</div>
