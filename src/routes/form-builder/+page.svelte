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
      theme: "light",
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
        // Remove camelCase versions
        backgroundType: undefined,
        backgroundColor: undefined,
        backgroundImage: undefined,
        globalTextColor: undefined,
        thankYouPage: undefined,
      };

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
        <Button.Root
          on:click={saveForm}
          class="rounded-lg bg-black text-white shadow-sm hover:bg-black/90 inline-flex h-10 items-center justify-center px-4 text-sm font-semibold active:scale-[0.98] active:transition-all"
        >
          <span class="fas fa-save mr-2 text-xs"></span>
          Save Form
        </Button.Root>
      </div>
    </div>
    <div class="max-w-[1400px] mx-auto px-4 md:px-6">
      <Tabs.Root bind:value={view}>
        <Tabs.List
          class="bg-transparent border-b border-slate-200 gap-0 grid w-auto grid-cols-4 p-0"
        >
          <Tabs.Trigger
            value="edit"
            class="px-4 py-3 font-semibold text-sm data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 bg-transparent border-0 rounded-none h-auto"
          >
            Edit
          </Tabs.Trigger>
          <Tabs.Trigger
            value="preview"
            class="px-4 py-3 font-semibold text-sm data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 bg-transparent border-0 rounded-none h-auto"
          >
            Preview
          </Tabs.Trigger>
          <Tabs.Trigger
            value="thank-you"
            class="px-4 py-3 font-semibold text-sm data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 bg-transparent border-0 rounded-none h-auto"
          >
            Thank You
          </Tabs.Trigger>
          <Tabs.Trigger
            value="responses"
            class="px-4 py-3 font-semibold text-sm data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 bg-transparent border-0 rounded-none h-auto"
          >
            Responses
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>

    <!-- Mobile Settings Button -->
    <div class="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between lg:hidden border-t border-slate-200">
      <div></div>
      <button
        on:click={() => (isSettingsOpen = true)}
        class="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
      >
        <span class="fas fa-cog text-lg"></span>
      </button>
    </div>
  </header>

  <div class="max-w-[1400px] mx-auto px-6 py-8">
    {#if view === "preview"}
      <!-- Device Preset Toolbar -->
      <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
          <span class="px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-slate-900 shadow-sm">
            Responsive
          </span>
        </div>
      </div>

      <!-- Preview Container -->
      <div class="relative bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden" style="height: calc(80vh - 60px);">
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, #000 1px, transparent 1px); background-size: 16px 16px;"></div>
        <div class="relative bg-white rounded-lg shadow-2xl overflow-hidden w-full h-full">
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
              isEmbedded={true}
              {onSubmit}
            />
          {/if}
        </div>
      </div>
    {:else if view === "thank-you"}
      <!-- Thank You Page Editor -->
      {#if currentFormData}
        <div class="space-y-6">
          <ThankYouPageEditor />
        </div>
      {/if}
    {:else if view === "responses"}
      <!-- Responses viewer -->
      <ResponseViewer
        formId={currentFormData.id}
        questions={currentFormData.questions}
      />
    {:else}
      <!-- Form builder layout -->
      <main class="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div class="flex-1 space-y-6">
          <FormBuilder {saveForm} />
        </div>

        <!-- Desktop Sidebar -->
        <aside class="hidden lg:block w-80 space-y-6 sticky top-24 self-start">
          {#if currentFormData}
            <FormBuilderSettings
              {currentFormData}
              {shareLink}
              {saveForm}
              toggleFormStatus={() => {}}
              {updateBackgroundColor}
              updateGlobalTextColor={() => {}}
              {handleBackgroundImageUpload}
              {removeBackgroundImage}
              {copyToClipboard}
              isNewForm={true}
            />
          {/if}
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
                <span class="fas fa-times text-slate-600"></span>
              </button>
            </div>
            {#if currentFormData}
              <FormBuilderSettings
                {currentFormData}
                {shareLink}
                {saveForm}
                toggleFormStatus={() => {}}
                {updateBackgroundColor}
                updateGlobalTextColor={() => {}}
                {handleBackgroundImageUpload}
                {removeBackgroundImage}
                {copyToClipboard}
                isNewForm={true}
              />
            {/if}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
