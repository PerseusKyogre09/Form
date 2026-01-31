<!-- src/routes/form-builder/[formId]/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import { currentForm } from "../../../lib/stores";
  import FormBuilder from "../../../lib/components/FormBuilder.svelte";
  import FormPreview from "../../../lib/components/FormPreview.svelte";
  import ResponseViewer from "../../../lib/components/ResponseViewer.svelte";
  import type { Form } from "../../../lib/types";
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { Button, Tabs } from "bits-ui";

  let view: string = "edit";
  let currentFormData: Form | undefined;
  let shareLink: string = "";
  let copied = false;
  let loading = true;
  let username: string = "";

  currentForm.subscribe((value) => {
    currentFormData = value;
  });

  onMount(async () => {
    // Load form from server
    try {
      const response = await fetch(`/api/forms?formId=${$page.params.formId}`);
      if (response.ok) {
        const form = await response.json();
        currentForm.set(form);
      }
    } catch (error) {
      console.error("Error loading form:", error);
    } finally {
      loading = false;
    }

    // Load user's username from profile
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();

        if (data) {
          username = data.username || "";
        }
      }

      // If the form is published, regenerate the share link so it persists between sessions
      if (currentFormData && currentFormData.published) {
        const protocol =
          typeof window !== "undefined" ? window.location.protocol : "http:";
        const host =
          typeof window !== "undefined" ? window.location.host : "localhost:5173";
        const slug = currentFormData.slug || currentFormData.id;
        shareLink = `${protocol}//${host}/form/${username || currentFormData.user_id}/${slug}`;
      }
    } catch (error) {
      console.error("Error loading username:", error);
    }
  });

  function saveForm() {
    if (!currentFormData) return;

    fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentFormData),
    }).catch((err) => console.error("Error saving to server:", err));

    alert("Form saved!");
  }

  function onSubmit(answers: Record<string, any>) {
    window.location.href = `/form/${currentFormData?.id}/success`;
  }

  async function publishForm() {
    if (!currentFormData) return;

    // Update local form data
    currentForm.update(form => ({ ...form, published: true }));

    // Save to Supabase
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be logged in to publish forms.");
        return;
      }

      const payload = {
        ...currentFormData,
        user_id: user.id,
        published: true,
      };

      const { error } = await supabase.from("forms").upsert(payload);

      if (error) throw error;
      alert("Form published!");
    } catch (err) {
      console.error("Error publishing form:", err);
      alert("Failed to publish form.");
    }
  }

  async function unpublishForm() {
    if (!currentFormData) return;

    // Update local form data
    currentForm.update(form => ({ ...form, published: false }));

    // Save to Supabase
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be logged in to unpublish forms.");
        return;
      }

      const payload = {
        ...currentFormData,
        user_id: user.id,
        published: false,
      };

      const { error } = await supabase.from("forms").upsert(payload);

      if (error) throw error;
      alert("Form unpublished!");
      shareLink = ""; // Clear share link when unpublished
    } catch (err) {
      console.error("Error unpublishing form:", err);
      alert("Failed to unpublish form.");
    }
  }

  function generateShareLink() {
    if (!currentFormData || !username) return;
    const protocol =
      typeof window !== "undefined" ? window.location.protocol : "http:";
    const host =
      typeof window !== "undefined" ? window.location.host : "localhost:5173";

    // Use username and slug for the new share link format
    const slug = currentFormData.slug || currentFormData.id;
    shareLink = `${protocol}//${host}/form/${username}/${slug}`;

    // Publish the form
    publishForm();
  }

  function copyToClipboard() {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink).then(() => {
        copied = true;
        setTimeout(() => {
          copied = false;
        }, 2000);
      });
    }
  }

  function goBack() {
    window.location.href = "/";
  }
</script>

<div class="min-h-screen bg-white">
  <header class="border-b border-gray-200 sticky top-0 bg-white z-50">
    <div
      class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between mb-6"
    >
      <Button.Root
        on:click={goBack}
        class="text-gray-600 hover:text-black font-medium flex items-center gap-2 rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
      >
        ← Back to Forms
      </Button.Root>
      <h1 class="text-2xl font-bold text-black">
        {currentFormData?.title || "Form Builder"}
      </h1>
      <div class="w-24"></div>
    </div>
    <div class="max-w-6xl mx-auto px-6">
      <Tabs.Root bind:value={view}>
        <Tabs.List
          class="bg-transparent border-b border-gray-200 gap-0 grid w-auto grid-cols-3 p-0"
        >
          <Tabs.Trigger
            value="edit"
            class="px-4 py-3 font-semibold text-[15px] data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 bg-transparent border-0 rounded-none h-auto"
          >
            Edit
          </Tabs.Trigger>
          <Tabs.Trigger
            value="preview"
            class="px-4 py-3 font-semibold text-[15px] data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 bg-transparent border-0 rounded-none h-auto"
          >
            Preview
          </Tabs.Trigger>
          <Tabs.Trigger
            value="responses"
            class="px-4 py-3 font-semibold text-[15px] data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 bg-transparent border-0 rounded-none h-auto"
          >
            Responses
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>
  </header>

  <div class="max-w-6xl mx-auto px-6 py-8">
    {#if loading}
      <div class="text-center py-12">
        <p class="text-gray-500">Loading form...</p>
      </div>
    {:else if view === "preview"}
      <!-- Full preview screen -->
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="w-full max-w-2xl">
          {#if currentFormData}
            <FormPreview
              questions={currentFormData.questions}
              formId={currentFormData.id}
              {onSubmit}
            />
          {/if}
        </div>
      </div>
    {:else if view === "responses"}
      <!-- Responses viewer -->
      {#if currentFormData}
        <ResponseViewer
          formId={currentFormData.id}
          questions={currentFormData.questions}
        />
      {/if}
    {:else}
      <!-- Form builder layout -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="lg:col-span-3">
          <FormBuilder {saveForm} />
        </div>

        <aside class="lg:col-span-1">
          <div class="sticky top-24 space-y-4">
            <Button.Root
              on:click={saveForm}
              class="w-full px-4 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-900 transition-colors rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
            >
              Save Form
            </Button.Root>

            {#if currentFormData?.published}
              <Button.Root
                on:click={unpublishForm}
                class="w-full px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
              >
                Unpublish Form
              </Button.Root>
            {:else}
              <Button.Root
                on:click={generateShareLink}
                class="w-full px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
              >
                Publish Form
              </Button.Root>
            {/if}

            {#if shareLink && currentFormData?.published}
              <div class="border border-green-200 bg-green-50 rounded-lg p-4">
                <p class="text-xs text-green-700 font-semibold mb-2">
                  Share Link
                </p>
                <div class="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readonly
                    class="flex-1 text-xs px-2 py-2 border border-green-200 rounded bg-white text-gray-700"
                  />
                  <Button.Root
                    on:click={copyToClipboard}
                    class="px-3 py-2 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
                  >
                    {copied ? "✓" : "Copy"}
                  </Button.Root>
                </div>
                <p class="text-xs text-green-600 mt-2">
                  Share this link to let others fill out your form
                </p>
              </div>
            {/if}

            <div class="border-t pt-4">
              <h3 class="font-semibold text-gray-900 mb-3">Quick Links</h3>
              {#if shareLink && currentFormData?.published}
                <a
                  href={shareLink}
                  target="_blank"
                  rel="noreferrer"
                  class="block text-xs px-3 py-2 text-center bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Preview Public Form
                </a>
              {/if}
            </div>
          </div>
        </aside>
      </div>
    {/if}
  </div>
</div>
