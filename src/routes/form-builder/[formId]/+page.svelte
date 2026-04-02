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
  import { authClient } from "$lib/authClient";
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
  let previewIframeEl: HTMLIFrameElement;

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

  let selectedPreset: string = "iPhone 14";
  let customWidth: number = 0;
  let customHeight: number = 0;
  let previewContainerEl: HTMLElement;
  let isResizing = false;
  let previewScale = 1;
  let isMobileDevice = false;

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

  // List to track existing IDs to detect duplicates
  let seenIds = new Set<string>();

  function generateUniqueId(): string {
    // Use crypto.randomUUID() for truly unique IDs
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback: UUID v4-like format
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function regenerateQuestionIds(questions: any[]): any[] {
    // Regenerate IDs for questions with old timestamp-based IDs or duplicates
    const seenIds = new Set<string>();
    return questions.map((q) => {
      // Check if ID is a timestamp (all digits, 12-13 characters) or a duplicate
      const isTimestampId = /^\d{12,13}$/.test(q.id);
      if (isTimestampId || seenIds.has(q.id)) {
        q.id = generateUniqueId();
      }
      seenIds.add(q.id);
      return q;
    });
  }

  currentForm.subscribe((value) => {
    currentFormData = value;
  });

  // Send form data to the preview iframe
  function sendFormDataToIframe() {
    if (previewIframeEl && previewIframeEl.contentWindow && currentFormData) {
      previewIframeEl.contentWindow.postMessage(
        { type: "UPDATE_FORM_PREVIEW", data: currentFormData },
        "*",
      );
    }
  }

  // Sync data to the iframe when it changes
  $: if (previewIframeEl && currentFormData) {
    sendFormDataToIframe();
  }

  onMount(async () => {
    // Detect if on mobile device
    if (browser) {
      isMobileDevice = window.innerWidth < 1024;
    }

    // Listen for the iframe signaling it's ready to receive data
    if (browser) {
      window.addEventListener("message", (event) => {
        if (event.data && event.data.type === "PREVIEW_IFRAME_READY") {
          // Send initial data as soon as the iframe is ready
          sendFormDataToIframe();
        }
      });
    }

    // Load form from API directly
    try {
      const { data: sessionData } = await authClient.getSession();
      const userId = sessionData?.user?.id || "";

      const res = await fetch(`/api/forms?formId=${$page.params.formId}`);

      if (!res.ok) {
        if (res.status === 404) {
          console.log("Initializing new form:", $page.params.formId);
          const newForm: Form = {
            id: $page.params.formId || crypto.randomUUID(),
            user_id: userId,
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
        } else {
          console.error("Error loading form:", await res.text());
        }
      } else {
        const data = await res.json();
        console.log("Form loaded:", data.id);

        // Convert snake_case to camelCase for consistency in the app
        const formData = {
          ...data,
          backgroundType: data.background_type || "color",
          backgroundColor: data.background_color || "#ffffff",
          backgroundImage: data.background_image || "",
          globalTextColor: data.global_text_color || "",
          thankYouPage: data.thank_you_page || undefined,
          theme: data.theme || undefined,
          questions: regenerateQuestionIds(data.questions || []),
          collaborators: data.collaborators || [],
        };
        currentForm.set(formData);
      }
    } catch (error) {
      console.error("Error loading form:", error);
    } finally {
      loading = false;
    }

    // Load user's username
    try {
      const { data: session } = await authClient.getSession();
      if (session && session.user) {
        // Temporarily assume username is populated or we use email prefix
        // The user data from better-auth might have it if extended.
        username =
          (session.user as any).username || session.user.email.split("@")[0];
      }

      // If the form is published, regenerate the share link so it persists between sessions
      if (currentFormData && currentFormData.published) {
        const protocol =
          typeof window !== "undefined" ? window.location.protocol : "http:";
        const host = typeof window !== "undefined" ? window.location.host : "";
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
      const { data: session } = await authClient.getSession();
      if (!session || !session.user) {
        alert("You must be logged in to save forms.");
        return;
      }
      const user = session.user;

      console.log("Saving form:", currentFormData.id, "for user:", user.id);

      // Prepare the payload
      const payload = {
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
      };

      const apiResponse = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error("API error saving form:", errorText);
        throw new Error(errorText);
      }

      notifications.add("Form saved!", "success");
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

    const wasPublished = currentFormData.published;
    currentForm.update((form) => ({ ...form, published: true }));

    try {
      const { data: session } = await authClient.getSession();
      if (!session || !session.user) {
        notifications.add("You must be logged in to publish forms.", "error");
        currentForm.update((form) => ({ ...form, published: wasPublished }));
        return;
      }

      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentFormData,
          background_type: currentFormData.backgroundType,
          background_color: currentFormData.backgroundColor,
          background_image: currentFormData.backgroundImage,
          global_text_color: currentFormData.globalTextColor,
          thank_you_page: currentFormData.thankYouPage,
          published: true,
          user_id: session.user.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error publishing form:", errorText);
        notifications.add("Failed to publish form. Please try again.", "error");
        currentForm.update((form) => ({ ...form, published: wasPublished }));
        return;
      }

      notifications.add("Form published!", "success");
    } catch (err) {
      console.error("Error publishing form:", err);
      notifications.add("Failed to publish form.", "error");
      currentForm.update((form) => ({ ...form, published: wasPublished }));
    }
  }

  async function unpublishForm() {
    if (!currentFormData) return;

    const wasPublished = currentFormData.published;
    currentForm.update((form) => ({ ...form, published: false }));

    try {
      const { data: session } = await authClient.getSession();
      if (!session || !session.user) {
        notifications.add("You must be logged in to unpublish forms.", "error");
        currentForm.update((form) => ({ ...form, published: wasPublished }));
        return;
      }

      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentFormData,
          background_type: currentFormData.backgroundType,
          background_color: currentFormData.backgroundColor,
          background_image: currentFormData.backgroundImage,
          global_text_color: currentFormData.globalTextColor,
          thank_you_page: currentFormData.thankYouPage,
          published: false,
          user_id: session.user.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error unpublishing form:", errorText);
        notifications.add("Failed to unpublish form. Please try again.", "error");
        currentForm.update((form) => ({ ...form, published: wasPublished }));
        return;
      }

      notifications.add("Form unpublished!", "success");
      shareLink = "";
    } catch (err) {
      console.error("Error unpublishing form:", err);
      notifications.add("Failed to unpublish form.", "error");
      currentForm.update((form) => ({ ...form, published: wasPublished }));
    }
  }

  async function toggleFormStatus() {
    if (!currentFormData) return;

    const newStatus = !currentFormData.closed;
    const oldStatus = currentFormData.closed;
    currentForm.update((form) => ({ ...form, closed: newStatus }));

    try {
      const { data: session } = await authClient.getSession();
      if (!session || !session.user) {
        notifications.add(
          "You must be logged in to change form status.",
          "error",
        );
        // Revert the optimistic update
        currentForm.update((form) => ({ ...form, closed: oldStatus }));
        return;
      }

      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentFormData,
          background_type: currentFormData.backgroundType,
          background_color: currentFormData.backgroundColor,
          background_image: currentFormData.backgroundImage,
          global_text_color: currentFormData.globalTextColor,
          thank_you_page: currentFormData.thankYouPage,
          closed: newStatus,
          user_id: session.user.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error toggling form status:", errorText);
        notifications.add("Failed to change form status. Please try again.", "error");
        // Revert the optimistic update
        currentForm.update((form) => ({ ...form, closed: oldStatus }));
        return;
      }

      notifications.add(newStatus ? "Form closed!" : "Form opened!", "success");
    } catch (err) {
      console.error("Error toggling form status:", err);
      notifications.add("Failed to change form status.", "error");
      // Revert the optimistic update
      currentForm.update((form) => ({ ...form, closed: oldStatus }));
    }
  }

  function generateShareLink() {
    if (!currentFormData || !username) return;
    const protocol =
      typeof window !== "undefined" ? window.location.protocol : "http:";
    const host = typeof window !== "undefined" ? window.location.host : "";

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

      console.log("Uploading background image to R2, file:", fileName);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", `form-background/${fileName}`);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error("Upload error details:", errText);
        throw new Error(errText || "Failed to upload image to storage");
      }

      const uploadData = await uploadRes.json();
      const publicUrl = uploadData.url;

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
  class="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-gray-100 transition-colors duration-200 font-sans"
>
  <header
    class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 transition-colors"
  >
    <div
      class="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between relative"
    >
      <div class="flex items-center gap-2 md:gap-4 flex-1 justify-start">
        <button
          on:click={goBack}
          class="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors shrink-0"
          aria-label="Go Back"
        >
          <span class="fas fa-arrow-left text-slate-600 dark:text-slate-400"
          ></span>
        </button>
        <input
          type="text"
          value={currentFormData?.title || ""}
          on:input={(e) => {
            const newTitle = e.currentTarget.value;
            currentForm.update((f) => ({ ...f, title: newTitle }));
          }}
          placeholder="Untitled Form"
          class="text-lg font-semibold tracking-tight text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 w-full md:w-64 placeholder:text-slate-400 dark:placeholder:text-gray-500 min-w-[50px] overflow-hidden text-ellipsis whitespace-nowrap"
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
          class="hidden xl:flex items-center justify-center p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg text-slate-600 dark:text-slate-400 transition-all active:scale-95"
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
          class="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg xl:hidden"
          aria-label="Open Form Settings"
        >
          <span class="fas fa-cog text-slate-600 dark:text-slate-400 text-xl"
          ></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Desktop Sidebar -->
  <aside
    class="hidden lg:flex fixed left-0 top-16 bottom-0 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex-col transition-all duration-300 z-40 {isSidebarOpen
      ? 'w-64'
      : 'w-20'}"
  >
    <div class="flex-1 py-6 flex flex-col gap-2">
      <button
        on:click={() => (view = "edit")}
        class="mx-3 flex items-center gap-3 px-4 py-3 rounded-xl transition-all {view ===
        'edit'
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
          : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'}"
      >
        <i class="fas fa-edit w-5 text-lg"></i>
        {#if isSidebarOpen}
          <span class="font-semibold text-sm">Build</span>
        {/if}
      </button>

      <button
        on:click={() => {
          if (isMobileDevice) {
            notifications.add("Preview works best on desktop. Please switch to a desktop or tablet.", "info");
          } else {
            view = "preview";
          }
        }}
        class="mx-3 flex items-center gap-3 px-4 py-3 rounded-xl transition-all {view ===
        'preview'
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
          : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'}"
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
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
          : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'}"
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
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
          : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'}"
      >
        <i class="fas fa-chart-bar w-5 text-lg"></i>
        {#if isSidebarOpen}
          <span class="font-semibold text-sm">Responses</span>
        {/if}
      </button>
    </div>

    <!-- Collapse Toggle -->
    <div class="p-4 border-t border-slate-100 dark:border-gray-800">
      <button
        on:click={toggleSidebar}
        class="w-full flex items-center justify-center py-3 rounded-xl text-slate-400 dark:text-gray-500 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-600 dark:hover:text-gray-300 transition-all font-medium text-sm"
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
    <div class="max-w-[1400px] mx-auto px-6 pt-8 pb-24 lg:pb-8">
      {#if loading}
        <div class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400">Loading form...</p>
        </div>
      {:else}
        {#if view === "preview"}
          <!-- Preview is rendered as a fullscreen overlay below -->
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
              enableCheckin={currentFormData.enable_checkin}
            />
          {/if}
        {:else}
          <!-- Form builder layout -->
          <main class="flex flex-col xl:flex-row gap-6 lg:gap-8 min-w-0">
            <div class="flex-1 space-y-6 min-w-0">
              <FormBuilder />
            </div>

            <!-- Desktop Right Sidebar -->
            <aside
              class="hidden xl:flex fixed right-0 top-16 bottom-0 bg-white dark:bg-gray-900 border-l border-slate-200 dark:border-gray-800 flex-col transition-all duration-300 z-40 {isRightSidebarOpen
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
                on:keydown={(e) =>
                  e.key === "Enter" && (isSettingsOpen = false)}
                role="button"
                tabindex="0"
                aria-label="Close settings pane"
              ></div>

              <!-- Drawer -->
              <div
                class="absolute inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-gray-900 shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300"
              >
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                    Settings
                  </h2>
                  <button
                    on:click={() => (isSettingsOpen = false)}
                    class="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    aria-label="Close settings pane"
                  >
                    <span
                      class="fas fa-times text-slate-500 dark:text-slate-400 text-xl"
                    ></span>
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
        {/if}

        <!-- Mobile Bottom Navigation (hidden during preview overlay) -->
        {#if view && view !== "preview"}
          <div
            class="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 px-6 py-2 z-50 flex justify-around items-center safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors"
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
              on:click={() => {
                if (isMobileDevice) {
                  notifications.add("Preview works best on desktop. Please switch to a desktop or tablet.", "info");
                } else {
                  view = "preview";
                }
              }}
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

<!-- Fullscreen Preview Overlay (Figma-style) -->
{#if view === "preview" && currentFormData}
  {#if isMobileDevice}
    <!-- Mobile: Show message to use desktop -->
    <div class="preview-overlay preview-mobile-disabled">
      <div class="preview-mobile-message">
        <div class="preview-mobile-icon">
          <i class="fas fa-laptop"></i>
        </div>
        <h2>Preview works best on desktop</h2>
        <p>For the best experience testing your form, please switch to a desktop or tablet.</p>
        <button
          on:click={() => (view = "edit")}
          class="preview-mobile-button"
          aria-label="Go back to editing"
        >
          Back to Editing
        </button>
      </div>
    </div>
  {:else}
    <!-- Desktop: Show normal preview -->
    <div class="preview-overlay">
    <!-- Top Toolbar -->
    <div class="preview-toolbar">
      <div class="preview-toolbar-left">
        <button
          on:click={() => (view = "edit")}
          class="preview-close-btn"
          aria-label="Close preview"
          title="Close preview"
        >
          <i class="fas fa-times"></i>
        </button>
        <span class="preview-title">Preview</span>
      </div>

      <div class="preview-toolbar-center">
        <div class="preview-device-pills">
          {#each devicePresets as preset}
            <button
              on:click={() => selectPreset(preset)}
              class="preview-device-btn {selectedPreset === preset.name
                ? 'active'
                : ''}"
            >
              <i class="fas {preset.icon}"></i>
              <span class="preview-device-label">{preset.name}</span>
            </button>
          {/each}
          {#if selectedPreset === "Custom"}
            <span class="preview-device-btn active">
              <i class="fas fa-arrows-alt"></i>
              <span class="preview-device-label">Custom</span>
            </span>
          {/if}
        </div>
      </div>

      <div class="preview-toolbar-right">
        {#if isFixedDevice || selectedPreset === "Custom"}
          <span class="preview-dimensions">
            {Math.round(customWidth)} × {Math.round(customHeight)}
          </span>
          {#if previewScale < 1}
            <span class="preview-dimensions">
              {Math.round(previewScale * 100)}%
            </span>
          {/if}
        {:else}
          <span class="preview-dimensions">Responsive</span>
        {/if}
      </div>
    </div>

    <!-- Canvas Area -->
    <div bind:this={previewContainerEl} class="preview-canvas">
      <!-- Dotted background pattern -->
      <div class="preview-dots"></div>

      {#if isFixedDevice || selectedPreset === "Custom"}
        <!-- Fixed device frame -->
        <div
          class="preview-device-frame"
          style="width: {customWidth}px; height: {customHeight}px; transform: scale({previewScale}); transform-origin: center center;"
        >
          <div class="preview-device-inner">
            <iframe
              bind:this={previewIframeEl}
              src="/preview/{$page.params.formId}"
              class="w-full h-full border-none bg-transparent"
              title="Form Preview"
            ></iframe>
          </div>

          <!-- Resize Handle -->
          <button
            on:mousedown={onResizeStart}
            class="preview-resize-handle"
            aria-label="Drag to resize preview"
          >
            <svg
              class="w-full h-full text-white/40 hover:text-white/80 transition-colors"
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
        <!-- Responsive: fill available canvas area -->
        <div class="preview-responsive-frame">
          <div class="preview-device-inner">
            <iframe
              bind:this={previewIframeEl}
              src="/preview/{$page.params.formId}"
              class="w-full h-full border-none bg-transparent"
              title="Form Preview"
            ></iframe>
          </div>
        </div>
      {/if}
    </div>
    </div>
  {/if}
{/if}

<style>
  /* ===== Fullscreen Preview Overlay ===== */
  .preview-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background-color: #f1f5f9; /* changed from #0f172a to a neutral light color so dark forms stand out */
    display: flex;
    flex-direction: column;
    animation: previewFadeIn 0.2s ease-out;
  }

  @keyframes previewFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* --- Toolbar --- */
  .preview-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 52px;
    padding: 0 16px;
    background: #1e293b;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
    gap: 8px;
    position: relative;
    z-index: 500; /* High z-index to stay above the form preview elements */
  }

  .preview-toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .preview-toolbar-center {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .preview-toolbar-center::-webkit-scrollbar {
    display: none;
  }

  .preview-toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .preview-close-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.06);
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: all 0.15s ease;
  }
  .preview-close-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #f1f5f9;
  }

  .preview-title {
    font-size: 13px;
    font-weight: 600;
    color: #cbd5e1;
    letter-spacing: 0.01em;
  }

  .preview-device-pills {
    display: flex;
    align-items: center;
    gap: 2px;
    background: rgba(255, 255, 255, 0.04);
    padding: 3px;
    border-radius: 10px;
  }

  .preview-device-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 7px;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .preview-device-btn:hover {
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.06);
  }
  .preview-device-btn.active {
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
  }
  .preview-device-btn i {
    font-size: 10px;
  }

  .preview-dimensions {
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      monospace;
    color: #475569;
    background: rgba(255, 255, 255, 0.06);
    padding: 4px 8px;
    border-radius: 6px;
  }

  /* --- Canvas --- */
  .preview-canvas {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 24px;
    z-index: 1; /* Below the toolbar */
  }

  .preview-dots {
    position: absolute;
    inset: 0;
    opacity: 0.04;
    background-image: radial-gradient(circle, #fff 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
  }

  /* --- Device Frames --- */
  .preview-device-frame {
    position: relative;
    background: #ffffff;
    border-radius: 12px;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 25px 50px -12px rgba(0, 0, 0, 0.5),
      0 0 80px rgba(99, 102, 241, 0.05);
    overflow: hidden;
    z-index: 10;
  }

  .preview-device-inner {
    width: 100%;
    height: 100%;
    overflow: auto;
    position: relative;
    z-index: 11;
  }

  .preview-responsive-frame {
    position: absolute;
    inset: 24px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 25px 50px -12px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    z-index: 10;
  }

  .preview-resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: nwse-resize;
    z-index: 60;
    padding: 0;
    background: transparent;
    border: none;
  }

  /* --- Mobile Preview Disabled --- */
  .preview-mobile-disabled {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    display: flex !important;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .preview-mobile-message {
    text-align: center;
    max-width: 400px;
    color: #f1f5f9;
  }

  .preview-mobile-icon {
    font-size: 64px;
    margin-bottom: 24px;
    opacity: 0.8;
    color: #94a3b8;
  }

  .preview-mobile-message h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #f1f5f9;
  }

  .preview-mobile-message p {
    font-size: 16px;
    margin-bottom: 32px;
    color: #cbd5e1;
    line-height: 1.5;
  }

  .preview-mobile-button {
    padding: 12px 32px;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .preview-mobile-button:hover {
    background: #4f46e5;
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
  }

  .preview-mobile-button:active {
    transform: translateY(0);
  }

  /* --- Mobile adjustments --- */
  @media (max-width: 768px) {
    .preview-toolbar {
      padding: 0 8px;
      height: 46px;
    }
    .preview-title {
      display: none;
    }
    .preview-device-label {
      display: none;
    }
    .preview-device-btn {
      padding: 5px 8px;
    }
    .preview-canvas {
      padding: 12px;
    }
    .preview-responsive-frame {
      inset: 12px;
    }
    .preview-dimensions {
      display: none;
    }
  }
</style>
