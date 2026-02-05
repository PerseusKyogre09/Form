<!-- src/routes/form/[formId]/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import FormPreview from "../../../lib/components/FormPreview.svelte";
  import type { Form } from "../../../lib/types";
  import { supabase } from "$lib/supabaseClient";

  let formData: Form | undefined;
  let notFound = false;
  let loading = true;

  onMount(async () => {
    await loadForm();
  });

  async function loadForm() {
    try {
      const formIdOrSlug = $page.params.formId as string;

      // Basic UUID Regex
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          formIdOrSlug,
        );

      let query = supabase
        .from("forms")
        .select(
          "id, slug, title, questions, published, closed, background_type, background_color, background_image, theme, global_text_color",
        )
        .eq("published", true);

      if (isUUID) {
        query = query.eq("id", formIdOrSlug);
      } else {
        query = query.eq("slug", formIdOrSlug);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        console.error("Error loading form:", error);
        notFound = true;
      } else {
        console.log("Fetched form data:", data);
        // Convert snake_case to camelCase for consistency
        formData = {
          id: data.id,
          slug: data.slug,
          title: data.title,
          questions: data.questions || [],
          published: data.published,
          closed: data.closed || false,
          backgroundType: data.background_type || "color",
          backgroundColor: data.background_color || "#ffffff",
          backgroundImage: data.background_image || "",
          globalTextColor: data.global_text_color || "",
          theme: data.theme || undefined,
        };
        console.log("Mapped formData:", formData);
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
    window.location.href = `/form/${$page.params.formId}/success`;
  }
</script>

<div class="min-h-screen bg-[#ffffff]">
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
    <div class="min-h-screen">
      <FormPreview
        questions={formData.questions || []}
        formId={formData.id}
        isClosed={formData.closed || false}
        backgroundType={formData.backgroundType || "color"}
        backgroundColor={formData.backgroundColor || "#ffffff"}
        backgroundImage={formData.backgroundImage || ""}
        theme={formData.theme}
        globalTextColor={formData.globalTextColor || ""}
        {onSubmit}
      />
    </div>
  {/if}
</div>
