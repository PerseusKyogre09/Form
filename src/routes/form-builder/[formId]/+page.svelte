<!-- src/routes/form-builder/[formId]/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import { currentForm } from "../../../lib/stores";
  import FormBuilder from "../../../lib/components/FormBuilder.svelte";
  import FormPreview from "../../../lib/components/FormPreview.svelte";
  import ResponseViewer from "../../../lib/components/ResponseViewer.svelte";
  import ThemesModal from "../../../lib/components/ThemesModal.svelte";
  import type { Form } from "../../../lib/types";
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { Button, Tabs } from "bits-ui";
  import { notifications } from "../../../lib/stores/notifications";

  let view: string = "edit";
  let currentFormData: Form | undefined;
  let shareLink: string = "";
  let copied = false;
  let loading = true;
  let username: string = "";

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
          backgroundColor: data.background_color || "#1e293b",
          backgroundImage: data.background_image || "",
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
        background_color: currentFormData.backgroundColor || "#1e293b",
        background_image: currentFormData.backgroundImage || "",
        // Remove camelCase versions
        backgroundType: undefined,
        backgroundColor: undefined,
        backgroundImage: undefined,
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
        background_color: currentFormData.backgroundColor || "#1e293b",
        background_image: currentFormData.backgroundImage || "",
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
        background_color: currentFormData.backgroundColor || "#1e293b",
        background_image: currentFormData.backgroundImage || "",
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
        background_color: currentFormData.backgroundColor || "#1e293b",
        background_image: currentFormData.backgroundImage || "",
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
</script>

<div
  class="min-h-screen bg-background text-slate-900 transition-colors duration-200 font-sans"
>
  <header
    class="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-slate-200"
  >
    <div
      class="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between"
    >
      <div class="flex items-center gap-4">
        <button
          on:click={goBack}
          class="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <span class="fas fa-arrow-left text-slate-600"></span>
        </button>
        <h1 class="text-lg font-semibold tracking-tight text-slate-900">
          {currentFormData?.title || "Form Builder"}
        </h1>
      </div>

      <div class="max-w-6xl mx-auto px-6">
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
              class="px-6 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:text-primary data-[state=inactive]:text-slate-600 data-[state=inactive]:dark:text-slate-400 data-[state=inactive]:hover:text-slate-900 data-[state=inactive]:dark:hover:text-white"
            >
              Preview
            </Tabs.Trigger>
            <Tabs.Trigger
              value="responses"
              class="px-6 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:text-primary data-[state=inactive]:text-slate-600 data-[state=inactive]:dark:text-slate-400 data-[state=inactive]:hover:text-slate-900 data-[state=inactive]:dark:hover:text-white"
            >
              Responses
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>

      <div class="flex items-center gap-3">
        {#if currentFormData?.published}
          <button
            on:click={unpublishForm}
            class="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all active:scale-95"
          >
            Unpublish Form
          </button>
        {:else}
          <button
            on:click={generateShareLink}
            class="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-indigo-600 rounded-lg shadow-sm transition-all active:scale-95"
          >
            Publish Form
          </button>
        {/if}
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
              backgroundColor={currentFormData.backgroundColor || "#1e293b"}
              backgroundImage={currentFormData.backgroundImage || ""}
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
      <main class="flex gap-8">
        <div class="flex-1 space-y-6">
          <FormBuilder {saveForm} />
        </div>

        <aside class="w-80 space-y-6 sticky top-24 self-start">
          <div
            class="bg-surface p-6 rounded-xl border border-slate-200 custom-shadow space-y-4"
          >
            <h3
              class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
            >
              Form Settings
            </h3>

            <ThemesModal />

            <!-- Background Settings -->
            <button
              class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 group transition-all"
              on:click={() => {
                // Placeholder for now, moving background logic inside here might require UI refactor for the popover/modal
                // For now, let's keep the existing logic but style it better if possible, or just keep it as a button that triggers a modal?
                // The previous implementation had inline controls. Let's create a "BackgroundSettings" component or inline the controls in a nicer way.
                // For this specific design, it looks like these are buttons that open sub-menus.
              }}
            >
              <div class="flex flex-col gap-2 w-full">
                <div class="flex items-center justify-between w-full group">
                  <div class="flex items-center gap-3">
                    <span
                      class="fas fa-image text-secondary group-hover:scale-110 transition-transform"
                    ></span>
                    <span class="text-sm font-medium">Background Image</span>
                  </div>
                  <span class="fas fa-chevron-right text-slate-300 text-sm"
                  ></span>
                </div>

                <!-- Inline Quick Settings for Background (Simplified from previous version) -->
                <div class="pl-8 pt-2 space-y-2">
                  {#if currentFormData?.backgroundType === "color"}
                    <div class="flex gap-2">
                      <input
                        type="color"
                        value={currentFormData?.backgroundColor || "#1e293b"}
                        on:input={(e) =>
                          updateBackgroundColor(e.currentTarget.value)}
                        class="w-8 h-8 rounded cursor-pointer border border-gray-200"
                      />
                      <span class="text-xs text-slate-500 self-center"
                        >{currentFormData?.backgroundColor}</span
                      >
                    </div>
                  {:else}
                    <div class="text-xs text-slate-500">Image selected</div>
                  {/if}
                  <label
                    class="text-xs text-primary cursor-pointer hover:underline"
                  >
                    {currentFormData?.backgroundImage
                      ? "Change Image"
                      : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      on:change={handleBackgroundImageUpload}
                      class="hidden"
                    />
                  </label>
                  {#if currentFormData?.backgroundImage}
                    <button
                      on:click={removeBackgroundImage}
                      class="text-xs text-red-500 block hover:underline"
                      >Remove Image</button
                    >
                  {/if}
                </div>
              </div>
            </button>

            <button
              on:click={toggleFormStatus}
              class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 group transition-all"
            >
              {#if currentFormData?.closed}
                <div class="flex items-center gap-3 text-orange-600">
                  <span
                    class="fas fa-lock group-hover:scale-110 transition-transform"
                  ></span>
                  <span class="text-sm font-medium">Form is Closed</span>
                </div>
              {:else}
                <div class="flex items-center gap-3 text-emerald-600">
                  <span
                    class="fas fa-lock-open group-hover:scale-110 transition-transform"
                  ></span>
                  <span class="text-sm font-medium">Form is Open</span>
                </div>
              {/if}
              <span class="fas fa-chevron-right text-slate-300 text-sm"></span>
            </button>
            <button
              on:click={saveForm}
              class="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium bg-black text-white rounded-xl hover:opacity-90 transition-all mt-4"
            >
              <span class="fas fa-save text-sm"></span>
              Save Changes
            </button>
          </div>

          {#if shareLink && currentFormData?.published}
            <div
              class="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 space-y-3"
            >
              <h3
                class="text-xs font-bold text-primary uppercase tracking-widest"
              >
                Share Link
              </h3>
              <div class="flex gap-2">
                <input
                  class="flex-1 text-xs bg-white border-indigo-100 rounded-lg py-2 px-3 focus:ring-primary outline-none"
                  readonly
                  type="text"
                  value={shareLink}
                />
                <button
                  on:click={copyToClipboard}
                  class="bg-primary text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-600 transition-colors"
                  >Copy</button
                >
              </div>
              <p class="text-[10px] text-slate-500 leading-relaxed italic">
                Share this link to let others fill out your form. Responses will
                appear in the tab above.
              </p>
            </div>
          {/if}

          <div class="space-y-3">
            <h3
              class="text-xs font-bold text-slate-500 uppercase tracking-widest px-1"
            >
              Quick Links
            </h3>
            <div class="grid grid-cols-2 gap-2">
              {#if shareLink && currentFormData?.published}
                <a
                  href={shareLink}
                  target="_blank"
                  class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-surface hover:border-primary transition-colors text-center no-underline"
                >
                  <span class="fas fa-eye text-slate-400"></span>
                  <span class="text-[10px] font-semibold text-slate-600"
                    >Public Preview</span
                  >
                </a>
              {:else}
                <button
                  class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-surface opacity-50 cursor-not-allowed"
                >
                  <span class="fas fa-eye-slash text-slate-400"></span>
                  <span class="text-[10px] font-semibold text-slate-600"
                    >Not Published</span
                  >
                </button>
              {/if}
              <button
                class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-surface hover:border-primary transition-colors"
              >
                <span class="fas fa-cog text-slate-400"></span>
                <span class="text-[10px] font-semibold text-slate-600"
                  >Advanced Settings</span
                >
              </button>
            </div>
          </div>
        </aside>
      </main>
    {/if}
  </div>
</div>
