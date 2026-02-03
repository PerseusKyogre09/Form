<!-- src/routes/form/[username]/[slug]/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import FormPreview from "../../../../lib/components/FormPreview.svelte";
  import type { Form } from "../../../../lib/types";
  import { supabase } from "$lib/supabaseClient";

  let formData: Form | undefined;
  let notFound = false;
  let loading = true;

  onMount(async () => {
    await loadForm();
  });

  async function loadForm() {
    try {
      const username = $page.params.username as string;
      const slug = $page.params.slug as string;

      console.log("Loading form with username:", username, "slug:", slug);

      // Get user by username first
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (profileError || !profileData) {
        console.error("User not found:", profileError);
        notFound = true;
        return;
      }

      // Then get the form by user_id and slug
      const { data, error } = await supabase
        .from("forms")
        .select(
          "id, slug, title, questions, published, closed, background_type, background_color, background_image, theme",
        )
        .eq("user_id", profileData.id)
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error || !data) {
        console.error("Form not found:", error);
        notFound = true;
      } else {
        formData = {
          id: data.id,
          slug: data.slug,
          title: data.title,
          questions: data.questions || [],
          published: data.published,
          closed: data.closed || false,
          backgroundType: data.background_type || "color",
          backgroundColor: data.background_color || "#1e293b",
          backgroundImage: data.background_image || "",
          theme: data.theme || undefined,
        };
        notFound = false;
      }
    } catch (error) {
      console.error("Error loading form:", error);
      notFound = true;
    } finally {
      loading = false;
    }
  }

  function onSubmit(answers: Record<string, any>) {
    const username = $page.params.username;
    const slug = $page.params.slug;
    window.location.href = `/form/${username}/${slug}/success`;
  }
</script>

<div
  class="min-h-screen"
  style="background-color: {formData?.backgroundType === 'image' &&
  formData?.backgroundImage
    ? 'transparent'
    : formData?.backgroundColor || '#1e293b'}; {formData?.backgroundType ===
    'image' && formData?.backgroundImage
    ? `background-image: url('${formData.backgroundImage}'); background-size: cover; background-position: center;`
    : ''}"
>
  {#if loading}
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <p class="text-slate-300">Loading form...</p>
      </div>
    </div>
  {:else if notFound}
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center px-6">
        <p class="text-slate-300 text-lg">
          Form not found. Please check the link and try again.
        </p>
      </div>
    </div>
  {:else if formData}
    <div class="min-h-screen flex items-center justify-center">
      <div class="w-full max-w-2xl">
        <FormPreview
          questions={formData.questions || []}
          formId={formData.id}
          isClosed={formData.closed || false}
          backgroundType={formData.backgroundType || "color"}
          backgroundColor={formData.backgroundColor || "#1e293b"}
          backgroundImage={formData.backgroundImage || ""}
          theme={formData.theme}
          {onSubmit}
        />
      </div>
    </div>
  {/if}
</div>
