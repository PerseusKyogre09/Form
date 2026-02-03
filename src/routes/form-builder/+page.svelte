<!-- src/routes/form-builder/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { currentForm, forms } from "../../lib/stores";
  import FormBuilder from "../../lib/components/FormBuilder.svelte";
  import FormPreview from "../../lib/components/FormPreview.svelte";
  import ResponseViewer from "../../lib/components/ResponseViewer.svelte";
  import ThemesModal from "../../lib/components/ThemesModal.svelte";
  import type { Form } from "../../lib/types";
  import { supabase } from "$lib/supabaseClient";
  import { Button, Tabs } from "bits-ui";
  import { notifications } from "../../lib/stores/notifications";

  let view: string = "edit";
  let currentFormData: Form;
  let shareLink: string = "";
  let copied = false;

  onMount(() => {
    // Create a new form when navigating to /form-builder
    const newForm: Form = {
      id: crypto.randomUUID(),
      title: "Untitled Form",
      questions: [],
      published: false,
      closed: false,
      backgroundType: "color",
      backgroundColor: "#1e293b",
      backgroundImage: "",
    };
    currentForm.set(newForm);
  });

  currentForm.subscribe((value) => {
    currentFormData = { closed: false, ...value };

    // If the form is published, regen the share link so it appears when you reopen
    if (currentFormData && currentFormData.published) {
      const protocol =
        typeof window !== "undefined" ? window.location.protocol : "http:";
      const host =
        typeof window !== "undefined" ? window.location.host : "localhost:5173";
      shareLink = `${protocol}//${host}/form/${currentFormData.id}`;
    }
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

      // Prepare payload - ensure user_id is set
      // We no longer remove slug as it is now supported in the DB
      const payload = {
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

      // Ensure ID is valid UUID if it comes from legacy local storage
      // If it's not a UUID (contains 'form_'), generate a new one
      if (payload.id.startsWith("form_")) {
        // This is a legacy ID, we should generate a new UUID for Supabase
        // Note: we can't easily change the ID of the current form without updating the store
        // For now, let's just let Supabase generate one if we remove the ID, or regenerate it here.
        // Better to warn user or just generate a new one.
        // Let's generate a new UUID
        payload.id = crypto.randomUUID();
        // Update the current form data with the new ID
        currentFormData.id = payload.id;
        currentForm.set(currentFormData);
      }

      const { error } = await supabase.from("forms").upsert(payload);

      if (error) throw error;

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

  async function generateShareLink() {
    const protocol =
      typeof window !== "undefined" ? window.location.protocol : "http:";
    const host =
      typeof window !== "undefined" ? window.location.host : "localhost:5173";
    shareLink = `${protocol}//${host}/form/${currentFormData.id}`;

    // Publish the form
    await publishForm();
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
        ...currentFormData,
        user_id: user.id,
        published: true,
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
        ...currentFormData,
        user_id: user.id,
        published: false,
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
        ...currentFormData,
        user_id: user.id,
        closed: newStatus,
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

<div class="min-h-screen bg-white">
  <header class="border-b border-gray-200 sticky top-0 bg-white z-50">
    <div
      class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between mb-6"
    >
      <a
        href="/dashboard"
        class="font-medium flex items-center gap-2 rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
      >
        ← Back to Forms
      </a>
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
    {#if view === "preview"}
      <!-- Full preview screen -->
      <div
        class="min-h-screen flex items-center justify-center"
        style="background-color: {currentFormData.backgroundType === 'image' &&
        currentFormData.backgroundImage
          ? 'transparent'
          : currentFormData.backgroundColor ||
            '#1e293b'}; {currentFormData.backgroundType === 'image' &&
        currentFormData.backgroundImage
          ? `background-image: url('${currentFormData.backgroundImage}'); background-size: cover; background-position: center;`
          : ''}"
      >
        <div class="w-full max-w-2xl">
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
        </div>
      </div>
    {:else if view === "responses"}
      <!-- Responses viewer -->
      <ResponseViewer
        formId={currentFormData.id}
        questions={currentFormData.questions}
      />
    {:else}
      <!-- Form builder layout -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="lg:col-span-3">
          <FormBuilder {saveForm} />
        </div>

        <aside class="lg:col-span-1">
          <div
            class="sticky top-32 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2"
          >
            <!-- Form Background Settings -->
            <div
              class="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50"
            >
              <div class="flex items-center gap-2 mb-3">
                <i class="fas fa-palette text-blue-600"></i>
                <h3 class="font-semibold text-gray-900 text-sm">
                  Form Background
                </h3>
              </div>

              <!-- Background Type Toggle -->
              <div class="flex gap-2 mb-3">
                <button
                  on:click={() =>
                    updateBackgroundColor(
                      currentFormData.backgroundColor || "#1e293b",
                    )}
                  class="flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors {currentFormData.backgroundType ===
                  'color'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'}"
                >
                  <i class="fas fa-palette mr-1"></i> Color
                </button>
                <button
                  on:click={() => {
                    if (currentFormData.backgroundImage) {
                      currentForm.update((form) => ({
                        ...form,
                        backgroundType: "image",
                      }));
                    }
                  }}
                  disabled={!currentFormData.backgroundImage}
                  class="flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors {currentFormData.backgroundType ===
                    'image' && currentFormData.backgroundImage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'}"
                >
                  <i class="fas fa-image mr-1"></i> Image
                </button>
              </div>

              <!-- Color Picker -->
              {#if currentFormData.backgroundType === "color"}
                <div class="space-y-2">
                  <div class="flex gap-2">
                    <input
                      type="color"
                      value={currentFormData.backgroundColor || "#1e293b"}
                      on:input={(e) =>
                        updateBackgroundColor(e.currentTarget.value)}
                      class="w-12 h-10 rounded cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={currentFormData.backgroundColor || "#1e293b"}
                      on:input={(e) =>
                        updateBackgroundColor(e.currentTarget.value)}
                      class="flex-1 px-2 py-1 text-xs border border-gray-200 rounded font-mono"
                      placeholder="#1e293b"
                    />
                  </div>

                  <!-- Preset Colors -->
                  <div class="grid grid-cols-4 gap-2 mt-2">
                    {#each ["#1e293b", "#0f172a", "#1f2937", "#111827", "#7c3aed", "#3b82f6", "#06b6d4", "#10b981"] as color}
                      <button
                        on:click={() => updateBackgroundColor(color)}
                        class="w-full h-8 rounded border-2 transition-transform hover:scale-110 {currentFormData.backgroundColor ===
                        color
                          ? 'border-gray-900'
                          : 'border-gray-200'}"
                        style="background-color: {color}"
                        title={color}
                      />
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Image Upload -->
              <div class="border-t pt-3 mt-3">
                <label class="block">
                  <span class="text-xs font-medium text-gray-700 block mb-2"
                    >Background Image</span
                  >
                  <input
                    type="file"
                    accept="image/*"
                    on:change={handleBackgroundImageUpload}
                    class="w-full text-xs text-gray-700 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-100 file:text-blue-700 file:cursor-pointer hover:file:bg-blue-200"
                  />
                </label>
              </div>

              {#if currentFormData.backgroundImage}
                <button
                  on:click={removeBackgroundImage}
                  class="w-full mt-2 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <i class="fas fa-trash mr-1"></i> Remove Image
                </button>
              {/if}
            </div>

            <button
              on:click={saveForm}
              class="w-full px-4 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-900 transition-colors rounded-xl text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all cursor-pointer"
            >
              Save Form
            </button>

            <ThemesModal />

            {#if currentFormData.closed}
              <button
                on:click={toggleFormStatus}
                class="w-full px-4 py-2 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700 transition-colors rounded-xl text-white shadow-mini hover:bg-orange-700/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all cursor-pointer"
              >
                <i class="fas fa-lock mr-2"></i> Open Form
              </button>
            {:else}
              <button
                on:click={toggleFormStatus}
                class="w-full px-4 py-2 bg-yellow-600 text-white rounded-md font-medium hover:bg-yellow-700 transition-colors rounded-xl text-white shadow-mini hover:bg-yellow-700/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all cursor-pointer"
              >
                <i class="fas fa-lock-open mr-2"></i> Close Form
              </button>
            {/if}

            {#if currentFormData.published}
              <button
                on:click={unpublishForm}
                class="w-full px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors rounded-xl text-white shadow-mini hover:bg-red-700/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all cursor-pointer"
              >
                Unpublish Form
              </button>
            {:else}
              <button
                on:click={generateShareLink}
                class="w-full px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors rounded-xl text-white shadow-mini hover:bg-green-700/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all cursor-pointer"
              >
                Publish Form
              </button>
            {/if}

            {#if shareLink && currentFormData.published}
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
                  <button
                    on:click={copyToClipboard}
                    class="px-3 py-2 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors rounded-xl text-white shadow-mini hover:bg-green-700/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all cursor-pointer"
                  >
                    {copied ? "✓" : "Copy"}
                  </button>
                </div>
                <p class="text-xs text-green-600 mt-2">
                  Share this link to let others fill out your form
                </p>
              </div>
            {/if}

            <div class="border-t pt-4">
              <h3 class="font-semibold text-gray-900 mb-3">Quick Links</h3>
              {#if shareLink && currentFormData.published}
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
