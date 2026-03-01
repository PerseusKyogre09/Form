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

<svelte:head>
  <title>{formData?.title} - Form</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="description" content="Fill out {formData?.title}" />
  <meta property="og:title" content="{formData?.title} - Quill Form" />
  <meta property="og:description" content="You're invited to fill out a form" />
  <meta property="og:type" content="website" />
</svelte:head>

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
        enableCheckin={formData.enable_checkin || false}
        successUrl={`/form/${$page.params.username}/${$page.params.slug}/success`}
        {onSubmit}
      />
    </div>
  {/if}
</div>
