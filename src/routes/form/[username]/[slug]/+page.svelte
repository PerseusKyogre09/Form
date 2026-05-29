<!-- src/routes/form/[username]/[slug]/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import FormPreview from "../../../../lib/components/FormPreview.svelte";
  import type { Form } from "../../../../lib/types";

  export let data;

  const formData: Form = data.form;

  // Generate the absolute URL for the dynamic social preview card (PNG) with cache invalidation
  $: updatedAtStr = formData?.updated_at ? new Date(formData.updated_at).getTime().toString() : '1';
  $: ogImageUrl = `${$page.url.origin}/form/${$page.params.username}/${$page.params.slug}/og.png?v=${updatedAtStr}`;

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
  
  <!-- Dynamic Open Graph Preview Tags -->
  <meta property="og:title" content="{formData?.title} - Quill" />
  <meta property="og:description" content="Click to open and fill out this form by @{$page.params.username}." />
  <meta property="og:image" content={ogImageUrl} />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:type" content="website" />

  <!-- Dynamic Twitter Card Preview Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{formData?.title} - Quill" />
  <meta name="twitter:description" content="Click to open and fill out this form by @{$page.params.username}." />
  <meta name="twitter:image" content={ogImageUrl} />
</svelte:head>

<div class="min-h-screen bg-[color:var(--bg-canvas)]">
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
        enableDeviceTracking={formData.enable_device_tracking || false}
        anonymousVoting={formData.anonymous_voting || false}
        successUrl={`/form/${$page.params.username}/${$page.params.slug}/success`}
        {onSubmit}
      />
    </div>
  {/if}
</div>
