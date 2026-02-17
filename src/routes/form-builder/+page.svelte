<!-- src/routes/form-builder/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { currentForm, forms } from "../../lib/stores";
  import FormBuilder from "../../lib/components/FormBuilder.svelte";
  import FormPreview from "../../lib/components/FormPreview.svelte";
  import ResponseViewer from "../../lib/components/ResponseViewer.svelte";
  import ThankYouPageEditor from "../../lib/components/ThankYouPageEditor.svelte";
  import ThankYouPagePreview from "../../lib/components/ThankYouPagePreview.svelte";
  import FormBuilderSettings from "../../lib/components/FormBuilderSettings.svelte";
  import type { Form } from "../../lib/types";
  import { supabase } from "$lib/supabaseClient";
  import { Button, Tabs } from "bits-ui";
  import { notifications } from "../../lib/stores/notifications";

  let view: string = "edit";
  let currentFormData: Form;
  let shareLink: string = "";
  let copied = false;
  let isSettingsOpen = false;
  let isSidebarOpen = true;
  let isRightSidebarOpen = true;

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }

  function toggleRightSidebar() {
    isRightSidebarOpen = !isRightSidebarOpen;
  }

  onMount(() => {
    // Create a new form when navigating to /form-builder
    const newForm: Form = {
      id: crypto.randomUUID(),
      title: "Untitled Form",
      questions: [],
      published: false,
      closed: false,
      backgroundType: "color",
      backgroundColor: "#ffffff",
      backgroundImage: "",
      slug: "",
      theme: undefined,
    };
    currentForm.set(newForm);
  });

  currentForm.subscribe((value) => {
    currentFormData = { closed: false, ...value };
  });

  async function saveForm() {
    forms.update((f) => {
      const existingIndex = f.findIndex(
        (form) => form.id === currentFormData.id,
      );
      if (existingIndex >= 0) {
        f[existingIndex] = { ...currentFormData };
      } else {
        f.push({ ...currentFormData });
      }
      return f;
    });

    // Save to Supabase
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        notifications.add("You must be logged in to save forms.", "error");
        return;
      }

      // Prepare payload
      const payload = {
        ...currentFormData,
        user_id: user.id,
        background_type: currentFormData.backgroundType || "color",
        background_color: currentFormData.backgroundColor || "#ffffff",
        background_image: currentFormData.backgroundImage || "",
        global_text_color: currentFormData.globalTextColor || "",
        thank_you_page: currentFormData.thankYouPage || null,
      };

      // Remove properties that shouldn't be saved to forms table
      delete payload.backgroundType;
      delete payload.backgroundColor;
      delete payload.backgroundImage;
      delete payload.globalTextColor;
      delete payload.thankYouPage;
      delete payload.questions;
      delete payload.collaborators;
      delete payload.user;

      const { error } = await supabase.from("forms").upsert(payload);

      if (error) throw error;

      notifications.add("Form saved!", "success");
      // Navigate to the specific form builder page
      goto(`/form-builder/${currentFormData.id}`);
    } catch (err) {
      console.error("Error saving to server:", err);
      notifications.add("Failed to save form.", "error");
    }
  }

  function onSubmit(answers: Record<string, any>) {
    window.location.href = `/form/${currentFormData.id}/success`;
  }

  async function publishForm() {
    // Update local form data
    currentForm.update((form) => ({ ...form, published: true }));

    // Save to Supabase
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        notifications.add("You must be logged in to publish forms.", "error");
        return;
      }

      const payload = {
        id: currentFormData.id,
        title: currentFormData.title,
        slug: currentFormData.slug,
        closed: currentFormData.closed,
        user_id: user.id,
        published: true,
        background_type: currentFormData.backgroundType || "color",
        background_color: currentFormData.backgroundColor || "#ffffff",
        background_image: currentFormData.backgroundImage || "",
        global_text_color: currentFormData.globalTextColor || "",
        thank_you_page: currentFormData.thankYouPage || null,
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
    // Update local form data
    currentForm.update((form) => ({ ...form, published: false }));

    // Save to Supabase
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        notifications.add("You must be logged in to unpublish forms.", "error");
        return;
      }

      const payload = {
        id: currentFormData.id,
        title: currentFormData.title,
        slug: currentFormData.slug,
        closed: currentFormData.closed,
        user_id: user.id,
        published: false,
        background_type: currentFormData.backgroundType || "color",
        background_color: currentFormData.backgroundColor || "#ffffff",
        background_image: currentFormData.backgroundImage || "",
        global_text_color: currentFormData.globalTextColor || "",
        thank_you_page: currentFormData.thankYouPage || null,
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

      const payload = {
        id: currentFormData.id,
        title: currentFormData.title,
        slug: currentFormData.slug,
        user_id: user.id,
        published: currentFormData.published,
        closed: newStatus,
        background_type: currentFormData.backgroundType || "color",
        background_color: currentFormData.backgroundColor || "#ffffff",
        background_image: currentFormData.backgroundImage || "",
        global_text_color: currentFormData.globalTextColor || "",
        thank_you_page: currentFormData.thankYouPage || null,
      };

      const { error } = await supabase.from("forms").upsert(payload);

      if (error) throw error;
      notifications.add(newStatus ? "Form closed!" : "Form opened!", "success");
    } catch (err) {
      console.error("Error toggling form status:", err);
      notifications.add("Failed to change form status.", "error");
    }
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
      const filePath = `form-backgrounds/${fileName}`;

      console.log("Uploading to bucket: form-background, path:", filePath);

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
      class="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between relative"
    >
      <div class="flex items-center gap-2 md:gap-4 flex-1 justify-start">
        <a
          href="/dashboard"
          class="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0"
          aria-label="Back to Dashboard"
        >
          <span class="fas fa-arrow-left text-slate-600"></span>
        </a>
        <input
          type="text"
          value={currentFormData?.title || ""}
          on:input={(e) => {
            const newTitle = e.currentTarget.value;
            currentForm.update((f) => ({ ...f, title: newTitle }));
          }}
          placeholder="Untitled Form"
          class="text-lg md:text-xl font-bold bg-transparent border-0 outline-none placeholder:text-slate-400 text-slate-900"
        />
      </div>

      <div class="flex items-center gap-2 md:gap-4">
        <button
          on:click={saveForm}
          class="rounded-lg bg-black text-white shadow-sm hover:bg-black/90 inline-flex h-10 items-center justify-center px-4 text-sm font-semibold active:scale-[0.98] active:transition-all"
        >
          <span class="fas fa-save mr-2 text-xs"></span>
          Save Form
        </button>
      </div>
    </div>
    <div class="hidden lg:flex items-center gap-2">
      <!-- Sidebar Toggle space if needed -->
    </div>

    <!-- Desktop Right Sidebar Toggle -->
    <button
      on:click={toggleRightSidebar}
      class="hidden xl:flex items-center justify-center p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-all active:scale-95"
      aria-label="Toggle Settings Sidebar"
      title="Toggle Settings Sidebar"
    >
      <i
        class="fas fa-cog text-xl {isRightSidebarOpen
          ? 'text-primary rotate-90'
          : ''} transition-all duration-300"
      ></i>
    </button>

    <!-- Mobile Settings Button -->
    <button
      on:click={() => (isSettingsOpen = true)}
      class="p-2 hover:bg-slate-100 rounded-lg xl:hidden"
      aria-label="Open Form Settings"
    >
      <span class="fas fa-cog text-slate-600 text-xl"></span>
    </button>
  </header>

  <!-- Desktop Sidebar -->
  <aside
    class="hidden lg:flex fixed left-0 top-16 bottom-0 bg-white border-r border-slate-200 flex-col transition-all duration-300 z-40 {isSidebarOpen
      ? 'w-64'
      : 'w-20'}"
  >
    <div class="flex-1 py-6 flex flex-col gap-2">
      <button
        on:click={() => (view = "edit")}
        class="mx-3 flex items-center gap-3 px-4 py-3 rounded-xl transition-all {view ===
        'edit'
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}"
      >
        <i class="fas fa-edit w-5 text-lg"></i>
        {#if isSidebarOpen}
          <span class="font-semibold text-sm">Build</span>
        {/if}
      </button>

      <button
        on:click={() => (view = "preview")}
        class="mx-3 flex items-center gap-3 px-4 py-3 rounded-xl transition-all {view ===
        'preview'
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}"
      >
        <i class="fas fa-eye w-5 text-lg"></i>
        {#if isSidebarOpen}
          <span class="font-semibold text-sm">Preview</span>
        {/if}
      </button>

      <button
        on:click={() => (view = "thank-you")}
        class="mx-3 flex items-center gap-3 px-4 py-3 rounded-xl transition-all {view ===
        'thank-you'
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}"
      >
        <i class="fas fa-heart w-5 text-lg"></i>
        {#if isSidebarOpen}
          <span class="font-semibold text-sm">Thank You</span>
        {/if}
      </button>

      <button
        on:click={() => (view = "responses")}
        class="mx-3 flex items-center gap-3 px-4 py-3 rounded-xl transition-all {view ===
        'responses'
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}"
      >
        <i class="fas fa-chart-bar w-5 text-lg"></i>
        {#if isSidebarOpen}
          <span class="font-semibold text-sm">Responses</span>
        {/if}
      </button>
    </div>

    <!-- Collapse Toggle -->
    <div class="p-4 border-t border-slate-100">
      <button
        on:click={toggleSidebar}
        class="w-full flex items-center justify-center py-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all font-medium text-sm"
        aria-label="Toggle Sidebar"
      >
        <i class="fas fa-bars"></i>
      </button>
    </div>
  </aside>

  <div
    class="transition-all duration-300 {isSidebarOpen
      ? 'lg:pl-64'
      : 'lg:pl-20'} {isRightSidebarOpen ? 'xl:pr-80' : 'xl:pr-0'}"
  >
    <div class="max-w-[1400px] mx-auto px-6 py-8">
      {#if view === "preview"}
        <!-- Device Preset Toolbar -->
        <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div
            class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap"
          >
            <span
              class="px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-slate-900 shadow-sm"
            >
              Responsive
            </span>
          </div>
        </div>

        <!-- Preview Container -->
        <div
          class="relative bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden"
          style="height: calc(80vh - 60px);"
        >
          <div
            class="absolute inset-0 opacity-[0.03]"
            style="background-image: radial-gradient(circle, #000 1px, transparent 1px); background-size: 16px 16px;"
          ></div>
          <div
            class="relative bg-white rounded-lg shadow-2xl overflow-hidden w-full h-full"
          >
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
      {:else if view === "thank-you"}
        <!-- Thank You Page Editor -->
        {#if currentFormData}
          <div class="space-y-6">
            <ThankYouPageEditor
              thankYouPage={currentFormData.thankYouPage}
              onUpdate={(config) => {
                currentForm.update((f) => ({ ...f, thankYouPage: config }));
              }}
              {saveForm}
            />
          </div>
        {/if}
      {:else if view === "responses"}
        <!-- Responses viewer -->
        <ResponseViewer
          formId={currentFormData.id}
          questions={currentFormData.questions}
        />
      {:else}
        <main class="flex flex-col xl:flex-row gap-6 lg:gap-8">
          <div class="flex-1 space-y-6">
            <FormBuilder />
          </div>

          <!-- Desktop Right Sidebar -->
          <aside
            class="hidden xl:flex fixed right-0 top-16 bottom-0 bg-white border-l border-slate-200 flex-col transition-all duration-300 z-40 {isRightSidebarOpen
              ? 'w-80'
              : 'w-0 overflow-hidden border-none'}"
          >
            {#if currentFormData}
              <FormBuilderSettings
                {currentFormData}
                {shareLink}
                {saveForm}
                toggleFormStatus={async () => {
                  currentFormData.closed = !currentFormData.closed;
                }}
                updateBackgroundColor={(color) => {
                  currentFormData.backgroundColor = color;
                }}
                updateGlobalTextColor={(color) => {
                  currentFormData.globalTextColor = color;
                }}
                handleBackgroundImageUpload={async (e) => {
                  // Background image upload logic
                }}
                removeBackgroundImage={() => {
                  currentFormData.backgroundImage = "";
                }}
                copyToClipboard={() => {
                  if (shareLink) {
                    navigator.clipboard.writeText(shareLink);
                    notifications.add("Copied to clipboard!", "success");
                  }
                }}
              />
            {/if}
          </aside>
        </main>

        <!-- Mobile Settings Drawer -->
        {#if isSettingsOpen}
          <div class="fixed inset-0 z-[60] xl:hidden">
            <!-- Backdrop -->
            <div
              class="absolute inset-0 bg-black/20 backdrop-blur-sm"
              on:click={() => (isSettingsOpen = false)}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === "Enter" && (isSettingsOpen = false)}
              aria-label="Close settings"
            ></div>

            <!-- Drawer -->
            <div
              class="absolute inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl p-0 overflow-hidden transform transition-transform duration-300"
            >
              <div
                class="flex items-center justify-between p-6 border-b border-slate-100"
              >
                <h2 class="text-lg font-bold text-slate-900">Settings</h2>
                <button
                  on:click={() => (isSettingsOpen = false)}
                  class="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  aria-label="Close settings"
                >
                  <span class="fas fa-times text-slate-600"></span>
                </button>
              </div>
              <div class="h-[calc(100%-80px)] overflow-y-auto">
                {#if currentFormData}
                  <FormBuilderSettings
                    {currentFormData}
                    {shareLink}
                    {saveForm}
                    toggleFormStatus={async () => {
                      currentFormData.closed = !currentFormData.closed;
                    }}
                    updateBackgroundColor={(color) => {
                      currentFormData.backgroundColor = color;
                    }}
                    updateGlobalTextColor={(color) => {
                      currentFormData.globalTextColor = color;
                    }}
                    handleBackgroundImageUpload={async (e) => {
                      // Background image upload logic
                    }}
                    removeBackgroundImage={() => {
                      currentFormData.backgroundImage = "";
                    }}
                    copyToClipboard={() => {
                      if (shareLink) {
                        navigator.clipboard.writeText(shareLink);
                        notifications.add("Copied to clipboard!", "success");
                      }
                    }}
                  />
                {/if}
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
