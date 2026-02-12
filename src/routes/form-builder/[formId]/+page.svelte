<!-- src/routes/form-builder/[formId]/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { currentForm } from "../../../lib/stores";
  import FormBuilder from "../../../lib/components/FormBuilder.svelte";
  import FormPreview from "../../../lib/components/FormPreview.svelte";
  import ResponseViewer from "../../../lib/components/ResponseViewer.svelte";
  import ThankYouPageEditor from "../../../lib/components/ThankYouPageEditor.svelte";
  import ThankYouPagePreview from "../../../lib/components/ThankYouPagePreview.svelte";
  import type { Form } from "../../../lib/types";
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { Button, Tabs } from "bits-ui";
  import { notifications } from "../../../lib/stores/notifications";
  import FormBuilderSettings from "../../../lib/components/FormBuilderSettings.svelte";
  import { onDestroy } from "svelte";

  let view: string = "edit";
  let currentFormData: Form | undefined;
  let shareLink: string = "";
  let copied = false;
  let loading = true;
  let username: string = "";
  let isSettingsOpen = false;
  let isSidebarOpen = true;
  let isRightSidebarOpen = true;

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }

  function toggleRightSidebar() {
    isRightSidebarOpen = !isRightSidebarOpen;
  }

  // Device preview presets
  type DevicePreset = {
    name: string;
    icon: string;
    width: number | null; // null = responsive (fill container)
    height: number | null;
  };

  const devicePresets: DevicePreset[] = [
    { name: "Responsive", icon: "fa-expand", width: null, height: null },
    { name: "Mobile", icon: "fa-mobile-alt", width: 375, height: 667 },
    { name: "iPhone 14", icon: "fa-mobile-alt", width: 390, height: 844 },
    { name: "iPad", icon: "fa-tablet-alt", width: 768, height: 1024 },
    { name: "MacBook", icon: "fa-laptop", width: 1280, height: 800 },
    { name: "Desktop", icon: "fa-desktop", width: 1440, height: 900 },
  ];

  let selectedPreset: string = "Responsive";
  let customWidth: number = 0;
  let customHeight: number = 0;
  let previewContainerEl: HTMLElement;
  let isResizing = false;
  let previewScale = 1;

  function selectPreset(preset: DevicePreset) {
    selectedPreset = preset.name;
    if (preset.width && preset.height) {
      customWidth = preset.width;
      customHeight = preset.height;
    }
    recalcScale();
  }

  function recalcScale() {
    if (!previewContainerEl) return;
    const preset = devicePresets.find((p) => p.name === selectedPreset);
    if (selectedPreset === "Custom") {
      // Custom mode - scale based on customWidth/customHeight
      const containerRect = previewContainerEl.getBoundingClientRect();
      const availW = containerRect.width - 32;
      const availH = containerRect.height - 32;
      previewScale = Math.min(availW / customWidth, availH / customHeight, 1);
      return;
    }
    if (!preset || !preset.width || !preset.height) {
      previewScale = 1;
      return;
    }
    const containerRect = previewContainerEl.getBoundingClientRect();
    const availW = containerRect.width - 32; // padding
    const availH = containerRect.height - 32;
    const w = customWidth || preset.width;
    const h = customHeight || preset.height;
    previewScale = Math.min(availW / w, availH / h, 1);
  }

  // Resize handle drag
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeStartW = 0;
  let resizeStartH = 0;

  function onResizeStart(e: MouseEvent) {
    e.preventDefault();
    isResizing = true;
    selectedPreset = "Custom";
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartW = customWidth;
    resizeStartH = customHeight;
    if (browser) {
      window.addEventListener("mousemove", onResizeMove);
      window.addEventListener("mouseup", onResizeEnd);
    }
  }

  function onResizeMove(e: MouseEvent) {
    if (!isResizing) return;
    customWidth = Math.max(
      280,
      resizeStartW + (e.clientX - resizeStartX) * (1 / previewScale),
    );
    customHeight = Math.max(
      400,
      resizeStartH + (e.clientY - resizeStartY) * (1 / previewScale),
    );
    recalcScale();
  }

  function onResizeEnd() {
    isResizing = false;
    if (browser) {
      window.removeEventListener("mousemove", onResizeMove);
      window.removeEventListener("mouseup", onResizeEnd);
    }
  }

  onDestroy(() => {
    if (browser) {
      window.removeEventListener("mousemove", onResizeMove);
      window.removeEventListener("mouseup", onResizeEnd);
    }
  });

  // Recalculate scale when view changes to preview
  $: if (view === "preview") {
    setTimeout(recalcScale, 50);
  }

  // Reactive: is the current mode a fixed-size device?
  $: isFixedDevice = selectedPreset !== "Responsive";

  currentForm.subscribe((value) => {
    currentFormData = { closed: false, ...value };
  });

  onMount(async () => {
    // Load form from Supabase directly
    try {
      const { data, error } = await supabase
        .from("forms")
        .select(
          "id, created_at, title, user_id, slug, published, closed, background_type, background_color, background_image, theme, global_text_color, updated_at, thank_you_page",
        )
        .eq("id", $page.params.formId)
        .single();

      if (error) {
        console.error("Error loading form:", error);
      } else if (data) {
        console.log("Form loaded:", data.id);

        // Fetch questions from the questions table
        const { data: questionsData } = await supabase
          .from("questions")
          .select("data")
          .eq("form_id", data.id)
          .order("order_index", { ascending: true });

        // Convert snake_case to camelCase for consistency in the app
        const formData = {
          ...data,
          backgroundType: data.background_type || "color",
          backgroundColor: data.background_color || "#ffffff",
          backgroundImage: data.background_image || "",
          globalTextColor: data.global_text_color || "",
          theme: data.theme || undefined,
          questions: questionsData?.map((q) => q.data) || [],
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
        thank_you_page: currentFormData.thankYouPage || null,
        // Remove camelCase versions and questions
        backgroundType: undefined,
        backgroundColor: undefined,
        backgroundImage: undefined,
        globalTextColor: undefined,
        thankYouPage: undefined,
        questions: undefined, // Don't save questions to forms table
      };

      // Use upsert directly with Supabase and select() to confirm save
      const { data, error } = await supabase
        .from("forms")
        .upsert(formToSave)
        .select(
          "id, created_at, title, user_id, slug, published, closed, background_type, background_color, background_image, theme, global_text_color, updated_at, thank_you_page",
        );

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message);
      }

      console.log("Form saved successfully:", data);

      // Always save questions via API if they exist (don't rely on form save success)
      if (currentFormData.questions && currentFormData.questions.length > 0) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (token) {
            const apiResponse = await fetch("/api/forms", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                id: currentFormData.id,
                title: currentFormData.title,
                slug: currentFormData.slug,
                questions: currentFormData.questions,
                published: currentFormData.published,
                closed: currentFormData.closed,
                background_type: currentFormData.backgroundType,
                background_color: currentFormData.backgroundColor,
                background_image: currentFormData.backgroundImage,
                theme: currentFormData.theme,
                global_text_color: currentFormData.globalTextColor,
                thank_you_page: currentFormData.thankYouPage,
                user_id: user.id,
              }),
            });
            if (!apiResponse.ok) {
              const errorText = await apiResponse.text();
              console.error("API error saving questions:", errorText);
            }
          } else {
            console.warn("No auth token available to save questions");
          }
        } catch (apiErr) {
          console.error("Error calling API to save questions:", apiErr);
        }
      }

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
          aria-label="Go Back"
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

      <div class="hidden lg:flex items-center gap-2">
        <!-- Sidebar Toggle is in Sidebar or elsewhere, for now we can have it here or just make sidebar collapsible -->
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
      </div>
    </div>
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
        on:click={() => (view = "thankYou")}
        class="mx-3 flex items-center gap-3 px-4 py-3 rounded-xl transition-all {view ===
        'thankYou'
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
      {#if loading}
        <div class="text-center py-12">
          <p class="text-gray-500">Loading form...</p>
        </div>
      {:else if view === "preview"}
        <!-- Device Preset Toolbar -->
        <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div
            class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap"
          >
            {#each devicePresets as preset}
              <button
                on:click={() => selectPreset(preset)}
                class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap
                {selectedPreset === preset.name
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}"
              >
                <i class="fas {preset.icon} text-[10px]"></i>
                {preset.name}
              </button>
            {/each}
            {#if selectedPreset === "Custom"}
              <span
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-primary shadow-sm flex items-center gap-1.5"
              >
                <i class="fas fa-arrows-alt text-[10px]"></i>
                Custom
              </span>
            {/if}
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400 font-mono">
            {#if isFixedDevice || selectedPreset === "Custom"}
              <span class="bg-slate-100 px-2 py-1 rounded">
                {Math.round(customWidth)} × {Math.round(customHeight)}
              </span>
              {#if previewScale < 1}
                <span class="bg-slate-100 px-2 py-1 rounded">
                  {Math.round(previewScale * 100)}%
                </span>
              {/if}
            {:else}
              <span class="bg-slate-100 px-2 py-1 rounded">Responsive</span>
            {/if}
          </div>
        </div>

        <!-- Preview Container -->
        <div
          bind:this={previewContainerEl}
          class="relative bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden"
          style="height: calc(80vh - 60px);"
        >
          <!-- Dotted background pattern -->
          <div
            class="absolute inset-0 opacity-[0.03]"
            style="background-image: radial-gradient(circle, #000 1px, transparent 1px); background-size: 16px 16px;"
          ></div>

          {#if isFixedDevice || selectedPreset === "Custom"}
            <!-- Fixed device frame -->
            <div
              class="relative bg-white rounded-lg shadow-2xl overflow-hidden"
              style="width: {customWidth}px; height: {customHeight}px; transform: scale({previewScale}); transform-origin: center center;"
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

              <!-- Resize Handle -->
              <button
                on:mousedown={onResizeStart}
                class="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-[60] group p-0 bg-transparent border-none"
                aria-label="Drag to resize preview"
              >
                <svg
                  class="w-full h-full text-slate-400 group-hover:text-primary transition-colors"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M14.5 17.5L17.5 14.5M9.5 17.5L17.5 9.5M4.5 17.5L17.5 4.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    fill="none"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>
          {:else}
            <!-- Responsive: fill entire container -->
            <div class="absolute inset-0 overflow-hidden">
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
          {/if}
        </div>
      {:else if view === "thankYou"}
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
        {#if currentFormData}
          <ResponseViewer
            formId={currentFormData.id}
            questions={currentFormData.questions}
          />
        {/if}
      {:else}
        <!-- Form builder layout -->
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
              'thankYou'
                ? 'text-primary'
                : 'text-slate-400 hover:text-slate-600'}"
              on:click={() => (view = "thankYou")}
            >
              <span class="fas fa-heart text-xl"></span>
              <span class="text-[10px] font-medium">Thank You</span>
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
</div>
