<!-- src/routes/form/[username]/[slug]/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import FormPreview from "../../../../lib/components/FormPreview.svelte";
  import type { Form } from "../../../../lib/types";

  export let data;

  const formData: Form = data.form;

  function onSubmit(answers: Record<string, any>) {
    const username = $page.params.username;
    const slug = $page.params.slug;
    window.location.href = `/form/${username}/${slug}/success`;
  }
</script>

<div class="min-h-screen bg-[#ffffff]">
  {#if formData}
    <div class="min-h-screen">
      <FormPreview
        questions={formData.questions || []}
        formId={formData.id}
        isClosed={formData.closed || false}
        backgroundType={formData.backgroundType || "color"}
        backgroundImage={formData.backgroundImage || ""}
        theme={formData.theme}
        globalTextColor={formData.globalTextColor || ""}
        {onSubmit}
      />
    </div>
  {/if}
</div>
