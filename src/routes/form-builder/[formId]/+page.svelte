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
  import { notifications } from "../../../lib/stores/notifications";
  import FormBuilderSettings from "../../../lib/components/FormBuilderSettings.svelte";

  let view: string = "edit";
  let currentFormData: Form | undefined;
  let shareLink: string = "";
  let copied = false;
  let loading = true;
  let username: string = "";
  let isSettingsOpen = false;

  currentForm.subscribe((value) => {
    currentFormData = { closed: false, ...value };
  });

  onMount(async () => {
    // Load form from Supabase directly
    try {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", $page.params.formId)
        .single();

      if (error) {
        console.error("Error loading form:", error);
      } else if (data) {
        console.log("Form loaded:", data.id);
        // Convert snake_case to camelCase for consistency in the app
        const formData = {
          ...data,
          backgroundType: data.background_type || "color",
          backgroundColor: data.background_color || "#ffffff",
          backgroundImage: data.background_image || "",
          globalTextColor: data.global_text_color || "",
          theme: data.theme || undefined,
        };
        currentForm.set(formData);
      }
    } catch (error) {
      console.error("Error loading form:", error);
    } finally {
      loading = false;
    }

    // Load user's username from profile
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
          typeof window !== "undefined"
            ? window.location.host
            : "localhost:5173";
        const slug = currentFormData.slug || currentFormData.id;
        shareLink = `${protocol}//${host}/form/${username || currentFormData.user_id}/${slug}`;
      }
    } catch (error) {
      console.error("Error loading username:", error);
    }
  });

  async function saveForm() {
    if (!currentFormData) return;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        alert("You must be logged in to save forms.");
        return;
      }

      console.log("Saving form:", currentFormData.id, "for user:", user.id);

      // Prepare the form data for saving - convert camelCase to snake_case
      const formToSave = {
        ...currentFormData,
        user_id: user.id,
        background_type: currentFormData.backgroundType || "color",
        background_color: currentFormData.backgroundColor || "#ffffff",
        background_image: currentFormData.backgroundImage || "",
        global_text_color: currentFormData.globalTextColor || "",
        // Remove camelCase versions
        backgroundType: undefined,
        backgroundColor: undefined,
        backgroundImage: undefined,
        globalTextColor: undefined,
      };

      // Use upsert directly with Supabase and select() to confirm save
      const { data, error } = await supabase
        .from("forms")
        .upsert(formToSave)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message);
      }

      console.log("Form saved successfully:", data);

      if (!data || data.length === 0) {
        console.warn(
          "Warning: Upsert returned no data. Form may not have been saved due to RLS policy.",
        );
        notifications.add(
          "Form saved, but please verify the changes persisted.",
          "info",
        );
      } else {
        notifications.add("Form saved!", "success");
      }
    } catch (err) {
      console.error("Error saving form:", err);
      notifications.add(
        "Failed to save form: " +
          (err instanceof Error ? err.message : "Unknown error"),
        "error",
      );
    }
  }

  function onSubmit(answers: Record<string, any>) {
    window.location.href = `/form/${currentFormData?.id}/success`;
  }

  async function publishForm() {
    if (!currentFormData) return;

    // Update local form data
    currentForm.update((form) => ({ ...form, published: true }));

    // Save to Supabase
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        notifications.add("You must be logged in to save forms.", "error");
        return;
      }

      // Convert camelCase to snake_case for database
      const payload = {
        id: currentFormData.id,
        title: currentFormData.title,
        questions: currentFormData.questions,
        slug: currentFormData.slug,
        closed: currentFormData.closed,
        user_id: user.id,
        published: true,
        background_type: currentFormData.backgroundType || "color",
        background_color: currentFormData.backgroundColor || "#ffffff",
        background_image: currentFormData.backgroundImage || "",
        global_text_color: currentFormData.globalTextColor || "",
      };

      const { error } = await supabase.from("forms").upsert(payload);

      if (error) throw error;
      notifications.add("Form published!", "success");
    } catch (err) {
      console.error("Error publishing form:", err);
      notifications.add("Failed to publish form.", "error");
    }
  }

  async function unpublishForm() {
    if (!currentFormData) return;

    // Update local form data
    currentForm.update((form) => ({ ...form, published: false }));

    // Save to Supabase
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        notifications.add("You must be logged in to publish forms.", "error");
        return;
      }

      // Convert camelCase to snake_case for database
      const payload = {
        id: currentFormData.id,
        title: currentFormData.title,
        questions: currentFormData.questions,
        slug: currentFormData.slug,
        closed: currentFormData.closed,
        user_id: user.id,
        published: false,
        background_type: currentFormData.backgroundType || "color",
        background_color: currentFormData.backgroundColor || "#ffffff",
        background_image: currentFormData.backgroundImage || "",
        global_text_color: currentFormData.globalTextColor || "",
      };

      const { error } = await supabase.from("forms").upsert(payload);

      if (error) throw error;
      notifications.add("Form unpublished!", "success");
      shareLink = ""; // Clear share link when unpublished
    } catch (err) {
      console.error("Error unpublishing form:", err);
      notifications.add("Failed to unpublish form.", "error");
    }
  }

  async function toggleFormStatus() {
    if (!currentFormData) return;

    const newStatus = !currentFormData.closed;
    currentForm.update((form) => ({ ...form, closed: newStatus }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        notifications.add(
          "You must be logged in to change form status.",
          "error",
        );
        return;
      }

      // Convert camelCase to snake_case for database
      const payload = {
        id: currentFormData.id,
        title: currentFormData.title,
        questions: currentFormData.questions,
        slug: currentFormData.slug,
        user_id: user.id,
        published: currentFormData.published,
        closed: newStatus,
        background_type: currentFormData.backgroundType || "color",
        background_color: currentFormData.backgroundColor || "#ffffff",
        background_image: currentFormData.backgroundImage || "",
        global_text_color: currentFormData.globalTextColor || "",
      };

      const { error } = await supabase.from("forms").upsert(payload);

      if (error) throw error;
      notifications.add(newStatus ? "Form closed!" : "Form opened!", "success");
    } catch (err) {
      console.error("Error toggling form status:", err);
      notifications.add("Failed to change form status.", "error");
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
    window.location.href = "/dashboard";
  }

  let isUploadingImage = false;

  async function handleBackgroundImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    isUploadingImage = true;
    notifications.add("Uploading image...", "info");

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select a valid image file");
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be less than 5MB");
      }

      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      console.log("Uploading to bucket: form-backgrounds, file:", fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("form-background")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw new Error(
          uploadError.message || "Failed to upload image to storage",
        );
      }

      console.log("Upload successful:", uploadData);

      const {
        data: { publicUrl },
      } = supabase.storage.from("form-background").getPublicUrl(fileName);

      console.log("Public URL:", publicUrl);

      currentForm.update((form) => ({
        ...form,
        backgroundImage: publicUrl,
        backgroundType: "image",
      }));
      notifications.add("Background image uploaded!", "success");
    } catch (err) {
      console.error("Error uploading background image:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to upload background image";
      notifications.add(errorMessage, "error");
    } finally {
      isUploadingImage = false;
      // Reset the input so the same file can be selected again if needed
      input.value = "";
    }
  }

  function updateBackgroundColor(color: string) {
    currentForm.update((form) => ({
      ...form,
      backgroundColor: color,
      backgroundType: "color",
    }));
  }

  function removeBackgroundImage() {
    currentForm.update((form) => ({
      ...form,
      backgroundImage: "",
      backgroundType: "color",
    }));
  }

  function updateGlobalTextColor(color: string) {
    currentForm.update((form) => ({
      ...form,
      globalTextColor: color,
    }));
  }
</script>

<div
  class="min-h-screen bg-background text-slate-900 transition-colors duration-200 font-sans"
>
  <header
    class="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-slate-200"
  >
    <div
      class="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between relative"
    >
      <div class="flex items-center gap-2 md:gap-4 flex-1 justify-start">
        <button
          on:click={goBack}
          class="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0"
        >
          <span class="fas fa-arrow-left text-slate-600"></span>
        </button>
        <input
          type="text"
          value={currentFormData?.title || ""}
          on:input={(e) => {
            const newTitle = e.currentTarget.value;
            currentForm.update((f) => ({ ...f, title: newTitle }));
          }}
          placeholder="Untitled Form"
          class="text-lg font-semibold tracking-tight text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-full md:w-64 placeholder:text-slate-400 min-w-[50px] overflow-hidden text-ellipsis whitespace-nowrap"
        />
      </div>

      <div class="hidden lg:flex absolute left-1/2 -translate-x-1/2">
        <Tabs.Root bind:value={view}>
          <Tabs.List
            class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl"
          >
            <Tabs.Trigger
              value="edit"
              class="px-6 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors data-[state=active]:bg-white data-[state=active]:text-primary data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900"
            >
              Edit
            </Tabs.Trigger>
            <Tabs.Trigger
              value="preview"
              class="px-6 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors data-[state=active]:bg-white data-[state=active]:text-primary data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900"
            >
              Preview
            </Tabs.Trigger>
            <Tabs.Trigger
              value="responses"
              class="px-6 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors data-[state=active]:bg-white data-[state=active]:text-primary data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900"
            >
              Responses
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>

      <div class="flex items-center gap-2 md:gap-3 flex-1 justify-end">
        {#if currentFormData?.published}
          <button
            on:click={unpublishForm}
            class="hidden md:block px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all active:scale-95"
          >
            Unpublish Form
          </button>
        {:else}
          <button
            on:click={generateShareLink}
            class="hidden md:block px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-indigo-600 rounded-lg shadow-sm transition-all active:scale-95"
          >
            Publish Form
          </button>
        {/if}

        <!-- Mobile Settings Button -->
        <button
          on:click={() => (isSettingsOpen = true)}
          class="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <span class="fas fa-cog text-slate-600 text-xl"></span>
        </button>
      </div>
    </div>
  </header>

  <div class="max-w-[1400px] mx-auto px-6 py-8">
    {#if loading}
      <div class="text-center py-12">
        <p class="text-gray-500">Loading form...</p>
      </div>
    {:else if view === "preview"}
      <!-- Full preview screen -->
      <div
        class="min-h-[80vh] flex items-center justify-center rounded-xl overflow-hidden border border-slate-200 bg-slate-900"
      >
        <div class="w-full h-full">
          {#if currentFormData}
            <FormPreview
              questions={currentFormData.questions}
              formId={currentFormData.id}
              isClosed={currentFormData.closed || false}
              backgroundType={currentFormData.backgroundType || "color"}
              backgroundColor={currentFormData.backgroundColor || "#ffffff"}
              backgroundImage={currentFormData.backgroundImage || ""}
              globalTextColor={currentFormData?.globalTextColor || ""}
              theme={currentFormData.theme}
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
      <main class="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div class="flex-1 space-y-6">
          <FormBuilder {saveForm} />
        </div>

        <!-- Desktop Sidebar -->
        <aside class="hidden lg:block w-80 space-y-6 sticky top-24 self-start">
          <FormBuilderSettings
            {currentFormData}
            {shareLink}
            {saveForm}
            {toggleFormStatus}
            {updateBackgroundColor}
            {updateGlobalTextColor}
            {handleBackgroundImageUpload}
            {removeBackgroundImage}
            {copyToClipboard}
          />
        </aside>
      </main>

      <!-- Mobile Settings Drawer -->
      {#if isSettingsOpen}
        <div class="fixed inset-0 z-[60] lg:hidden">
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-black/20 backdrop-blur-sm"
            on:click={() => (isSettingsOpen = false)}
          ></div>

          <!-- Drawer -->
          <div
            class="absolute inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300"
          >
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-bold text-slate-900">Settings</h2>
              <button
                on:click={() => (isSettingsOpen = false)}
                class="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <span class="fas fa-times text-slate-500 text-xl"></span>
              </button>
            </div>

            <div class="space-y-6">
              <FormBuilderSettings
                {currentFormData}
                {shareLink}
                {saveForm}
                {toggleFormStatus}
                {updateBackgroundColor}
                {updateGlobalTextColor}
                {handleBackgroundImageUpload}
                {removeBackgroundImage}
                {copyToClipboard}
              />
            </div>
          </div>
        </div>
      {/if}

      <!-- Mobile Bottom Navigation -->
      {#if !loading && view}
        <div
          class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 z-50 flex justify-around items-center safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        >
          <button
            class="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors {view ===
            'edit'
              ? 'text-primary'
              : 'text-slate-400 hover:text-slate-600'}"
            on:click={() => (view = "edit")}
          >
            <span class="fas fa-edit text-xl"></span>
            <span class="text-[10px] font-medium">Edit</span>
          </button>
          <button
            class="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors {view ===
            'preview'
              ? 'text-primary'
              : 'text-slate-400 hover:text-slate-600'}"
            on:click={() => (view = "preview")}
          >
            <span class="fas fa-eye text-xl"></span>
            <span class="text-[10px] font-medium">Preview</span>
          </button>
          <button
            class="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors {view ===
            'responses'
              ? 'text-primary'
              : 'text-slate-400 hover:text-slate-600'}"
            on:click={() => (view = "responses")}
          >
            <span class="fas fa-chart-bar text-xl"></span>
            <span class="text-[10px] font-medium">Responses</span>
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>
