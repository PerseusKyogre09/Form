<script lang="ts">
  import { Button } from "bits-ui";
  import type {
    ThankYouPage,
    ThankYouButton,
    ThankYouSocialLink,
  } from "../types";
  import { notifications } from "../stores/notifications";
  import { currentForm } from "../stores";

  export let thankYouPage: ThankYouPage | undefined;
  export let onUpdate: (config: ThankYouPage) => void;
  export let saveForm: () => Promise<void>;

  // Import default config
  import { getDefaultThankYouPage } from "../stores";

  let currentFormData: any;

  currentForm.subscribe((value) => {
    currentFormData = value;
  });

  // Initialize if undefined
  $: if (!thankYouPage) {
    thankYouPage = getDefaultThankYouPage();
    onUpdate(thankYouPage);
  }

  let config = thankYouPage || getDefaultThankYouPage();
  $: config = thankYouPage || getDefaultThankYouPage();

  const socialPlatforms: Array<{ id: string; name: string; icon: string }> = [
    { id: "instagram", name: "Instagram", icon: "fab fa-instagram" },
    { id: "twitter", name: "Twitter/X", icon: "fab fa-twitter" },
    { id: "facebook", name: "Facebook", icon: "fab fa-facebook" },
    { id: "linkedin", name: "LinkedIn", icon: "fab fa-linkedin" },
    { id: "youtube", name: "YouTube", icon: "fab fa-youtube" },
    { id: "tiktok", name: "TikTok", icon: "fab fa-tiktok" },
  ];

  function updateTitle(title: string) {
    config.title = title;
    onUpdate(config);
  }

  function updateSubtitle(subtitle: string) {
    config.subtitle = subtitle;
    onUpdate(config);
  }

  function updateBackgroundType(type: "color" | "image") {
    config.backgroundType = type;
    onUpdate(config);
  }

  function updateBackgroundColor(color: string) {
    config.backgroundColor = color;
    onUpdate(config);
  }

  function toggleSuccessIcon() {
    config.showSuccessIcon = !config.showSuccessIcon;
    onUpdate(config);
  }

  function toggleFormInfo() {
    config.showFormInfo = !config.showFormInfo;
    onUpdate(config);
  }

  function toggleEnabled() {
    config.enabled = !config.enabled;
    onUpdate(config);
  }

  function updateTitleColor(color: string) {
    config.titleColor = color;
    onUpdate(config);
  }

  function updateSubtitleColor(color: string) {
    config.subtitleColor = color;
    onUpdate(config);
  }

  function updateTextColor(color: string) {
    config.textColor = color;
    onUpdate(config);
  }

  function updateSuccessIconColor(color: string) {
    config.successIconColor = color;
    onUpdate(config);
  }

  async function handleBackgroundImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

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

      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", `thank-you-backgrounds/${fileName}`);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(errText || "Failed to upload image to Cloudinary");
      }

      const uploadData = await uploadRes.json();
      config.backgroundImage = uploadData.url;
      onUpdate(config);
      notifications.add("Background image uploaded!", "success");
    } catch (err: any) {
      console.error("Error uploading image:", err);
      notifications.add(err.message || "Failed to upload background image", "error");
    }
  }

  function removeBackgroundImage() {
    config.backgroundImage = undefined;
    onUpdate(config);
    notifications.add("Background image removed", "success");
  }

  function addButton() {
    const newButton: ThankYouButton = {
      id: Math.random().toString(36).substr(2, 9),
      label: "Button Label",
      url: "https://example.com",
      variant: "primary",
    };
    config.buttons = [...config.buttons, newButton];
    onUpdate(config);
  }

  function updateButton(id: string, field: keyof ThankYouButton, value: any) {
    config.buttons = config.buttons.map((btn) =>
      btn.id === id ? { ...btn, [field]: value } : btn,
    );
    onUpdate(config);
  }

  function removeButton(id: string) {
    config.buttons = config.buttons.filter((btn) => btn.id !== id);
    onUpdate(config);
  }

  function addOrUpdateSocialLink(platform: string, url: string) {
    const existing = config.socialLinks.findIndex(
      (link) => link.platform === platform,
    );
    if (existing !== -1) {
      config.socialLinks[existing].url = url;
    } else {
      config.socialLinks = [
        ...config.socialLinks,
        { platform: platform as any, url },
      ];
    }
    onUpdate(config);
  }

  function removeSocialLink(platform: string) {
    config.socialLinks = config.socialLinks.filter(
      (link) => link.platform !== platform,
    );
    onUpdate(config);
  }

  function getSocialLink(platform: string): string {
    return (
      config.socialLinks.find((link) => link.platform === platform)?.url || ""
    );
  }

  async function handleSave() {
    await saveForm();
    notifications.add("Thank you page updated!", "success");
  }
</script>

<div class="flex flex-col lg:flex-row gap-6 p-6">
  <!-- Editor Panel -->
  <div class="flex-1 space-y-6">
    <div
      class="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 custom-shadow p-6 space-y-4"
    >
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
        Customize Thank You Page
      </h3>

      <!-- Enable/Disable Toggle -->
      <div
        class="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-gray-700"
      >
        <div>
          <label
            for="enable-custom"
            class="block text-sm font-medium text-slate-700 dark:text-gray-200"
            >Use Custom Thank You Page</label
          >
          <p class="text-xs text-slate-500 dark:text-gray-400 mt-1">
            When disabled, shows default design
          </p>
        </div>
        <input
          id="enable-custom"
          type="checkbox"
          checked={config.enabled}
          onchange={toggleEnabled}
          class="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
        />
      </div>

      {#if config.enabled}
        <!-- Title Input -->
        <div class="space-y-2">
          <label
            for="title"
            class="block text-sm font-medium text-slate-700 dark:text-gray-200"
            >Title</label
          >
          <input
            id="title"
            type="text"
            value={config.title}
            oninput={(e) => updateTitle(e.currentTarget.value)}
            placeholder="Thank You!"
            class="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
        </div>

        <!-- Subtitle Input -->
        <div class="space-y-2">
          <label
            for="subtitle"
            class="block text-sm font-medium text-slate-700 dark:text-gray-200"
            >Subtitle</label
          >
          <textarea
            id="subtitle"
            value={config.subtitle}
            oninput={(e) => updateSubtitle(e.currentTarget.value)}
            placeholder="Your response has been recorded successfully."
            rows="2"
            class="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          ></textarea>
        </div>

        <!-- Text Color Settings -->
        <div
          class="space-y-3 pt-4 border-t border-slate-200 dark:border-gray-800"
        >
          <label
            class="block text-sm font-medium text-slate-700 dark:text-gray-200"
            >Text Colors</label
          >

          <!-- Title Color -->
          <div class="space-y-2">
            <label
              for="title-color"
              class="block text-xs font-medium text-slate-600 dark:text-gray-300"
              >Title Color</label
            >
            <div class="flex items-center gap-2">
              <input
                id="title-color"
                type="color"
                value={config.titleColor || "#1f2937"}
                oninput={(e) => updateTitleColor(e.currentTarget.value)}
                class="w-10 h-10 rounded cursor-pointer border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-0.5"
              />
              <span class="text-sm text-slate-600 dark:text-gray-400"
                >{config.titleColor || "#1f2937"}</span
              >
            </div>
          </div>

          <!-- Subtitle Color -->
          <div class="space-y-2">
            <label
              for="subtitle-color"
              class="block text-xs font-medium text-slate-600 dark:text-gray-300"
              >Subtitle Color</label
            >
            <div class="flex items-center gap-2">
              <input
                id="subtitle-color"
                type="color"
                value={config.subtitleColor || "#6b7280"}
                oninput={(e) => updateSubtitleColor(e.currentTarget.value)}
                class="w-10 h-10 rounded cursor-pointer border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-0.5"
              />
              <span class="text-sm text-slate-600 dark:text-gray-400"
                >{config.subtitleColor || "#6b7280"}</span
              >
            </div>
          </div>

          <!-- General Text Color -->
          <div class="space-y-2">
            <label
              for="text-color"
              class="block text-xs font-medium text-slate-600 dark:text-gray-300"
              >General Text Color</label
            >
            <div class="flex items-center gap-2">
              <input
                id="text-color"
                type="color"
                value={config.textColor || "#d1d5db"}
                oninput={(e) => updateTextColor(e.currentTarget.value)}
                class="w-10 h-10 rounded cursor-pointer border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-0.5"
              />
              <span class="text-sm text-slate-600 dark:text-gray-400"
                >{config.textColor || "#d1d5db"}</span
              >
            </div>
          </div>

          <!-- Success Icon Color -->
          <div class="space-y-2">
            <label
              for="icon-color"
              class="block text-xs font-medium text-slate-600 dark:text-gray-300"
              >Success Icon Color</label
            >
            <div class="flex items-center gap-2">
              <input
                id="icon-color"
                type="color"
                value={config.successIconColor || "#22c55e"}
                oninput={(e) => updateSuccessIconColor(e.currentTarget.value)}
                class="w-10 h-10 rounded cursor-pointer border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-0.5"
              />
              <span class="text-sm text-slate-600 dark:text-gray-400"
                >{config.successIconColor || "#22c55e"}</span
              >
            </div>
          </div>
        </div>

        <!-- Background Settings -->
        <div
          class="space-y-2 pt-4 border-t border-slate-200 dark:border-gray-800"
        >
          <label
            class="block text-sm font-medium text-slate-700 dark:text-gray-200"
            >Background</label
          >
          <div class="flex gap-2">
            <button
              onclick={() => updateBackgroundType("color")}
              class={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                config.backgroundType === "color"
                  ? "bg-primary text-white"
                  : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700"
              }`}
            >
              Color
            </button>
            <button
              onclick={() => updateBackgroundType("image")}
              class={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                config.backgroundType === "image"
                  ? "bg-primary text-white"
                  : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700"
              }`}
            >
              Image
            </button>
          </div>

          {#if config.backgroundType === "color"}
            <div class="flex items-center gap-2">
              <input
                type="color"
                value={config.backgroundColor}
                oninput={(e) => updateBackgroundColor(e.currentTarget.value)}
                class="w-10 h-10 rounded cursor-pointer border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-0.5"
              />
              <span class="text-sm text-slate-600 dark:text-gray-400"
                >{config.backgroundColor}</span
              >
            </div>
          {:else if config.backgroundType === "image"}
            <div
              class="relative w-full h-32 rounded-lg border-2 border-dashed border-slate-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 group cursor-pointer hover:border-primary transition-colors overflow-hidden flex items-center justify-center"
            >
              {#if config.backgroundImage}
                <img
                  src={config.backgroundImage}
                  alt="Background"
                  class="absolute inset-0 w-full h-full object-cover opacity-40 blur-[1px]"
                />
                <div class="relative flex flex-col items-center gap-2">
                  <button
                    onclick={removeBackgroundImage}
                    class="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    aria-label="Remove background image"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                  <span
                    class="text-[10px] font-bold text-slate-600 dark:text-gray-200 bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded shadow-sm"
                    >Image Uploaded</span
                  >
                </div>
              {:else}
                <i
                  class="fas fa-cloud-upload-alt text-slate-300 dark:text-gray-600 text-2xl group-hover:text-primary transition-colors"
                ></i>
                <span
                  class="absolute text-[10px] font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-gray-300"
                  >Click to upload</span
                >
              {/if}
              <input
                type="file"
                accept="image/*"
                onchange={handleBackgroundImageUpload}
                class="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          {/if}
        </div>

        <!-- Icon and Info Toggles -->
        <div
          class="space-y-2 pt-4 border-t border-slate-200 dark:border-gray-800"
        >
          <div
            class="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-lg"
          >
            <label
              for="show-icon"
              class="text-sm font-medium text-slate-700 dark:text-gray-200"
              >Show Success Icon</label
            >
            <input
              id="show-icon"
              type="checkbox"
              checked={config.showSuccessIcon}
              onchange={toggleSuccessIcon}
              class="w-4 h-4 text-primary rounded focus:ring-2"
            />
          </div>
          <div
            class="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-lg"
          >
            <label
              for="show-info"
              class="text-sm font-medium text-slate-700 dark:text-gray-200"
              >Show Form Info</label
            >
            <input
              id="show-info"
              type="checkbox"
              checked={config.showFormInfo}
              onchange={toggleFormInfo}
              class="w-4 h-4 text-primary rounded focus:ring-2"
            />
          </div>
        </div>

        <!-- Custom Buttons -->
        <div
          class="space-y-3 pt-4 border-t border-slate-200 dark:border-gray-800"
        >
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-slate-700 dark:text-gray-200"
              >Custom Buttons</label
            >
            <button
              onclick={addButton}
              class="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
            >
              + Add Button
            </button>
          </div>

          {#each config.buttons as button (button.id)}
            <div
              class="p-3 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 space-y-2"
            >
              <div class="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={button.label}
                  oninput={(e) =>
                    updateButton(button.id, "label", e.currentTarget.value)}
                  placeholder="Button Label"
                  class="px-2 py-1 border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                />
                <input
                  type="text"
                  value={button.url}
                  oninput={(e) =>
                    updateButton(button.id, "url", e.currentTarget.value)}
                  placeholder="https://example.com"
                  class="px-2 py-1 border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                />
              </div>
              <div class="flex items-center justify-between">
                <div class="flex gap-2">
                  <button
                    onclick={() =>
                      updateButton(
                        button.id,
                        "variant",
                        button.variant === "primary" ? "secondary" : "primary",
                      )}
                    class={`text-xs px-2 py-1 rounded transition-colors ${
                      button.variant === "primary"
                        ? "bg-primary text-white"
                        : "bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-gray-200"
                    }`}
                  >
                    {button.variant}
                  </button>
                </div>
                <button
                  onclick={() => removeButton(button.id)}
                  class="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          {/each}
        </div>

        <!-- Social Links -->
        <div
          class="space-y-3 pt-4 border-t border-slate-200 dark:border-gray-800"
        >
          <label class="text-sm font-medium text-slate-700 dark:text-gray-200"
            >Social Media Links</label
          >
          {#each socialPlatforms as platform}
            <div
              class="p-3 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700"
            >
              <div class="flex items-center justify-between mb-2">
                <label
                  class="text-sm font-medium text-slate-700 dark:text-gray-200"
                >
                  <i class={`${platform.icon} mr-2`}></i>
                  {platform.name}
                </label>
                {#if getSocialLink(platform.id)}
                  <button
                    onclick={() => removeSocialLink(platform.id)}
                    class="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded transition-colors"
                  >
                    Remove
                  </button>
                {/if}
              </div>
              <input
                type="url"
                value={getSocialLink(platform.id)}
                oninput={(e) =>
                  addOrUpdateSocialLink(platform.id, e.currentTarget.value)}
                placeholder={`https://${platform.id}.com/yourprofile`}
                class="w-full px-2 py-1 border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>
          {/each}
        </div>

        <!-- Save Button -->
        <button
          onclick={handleSave}
          class="w-full px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Save Changes
        </button>
      {:else}
        <div
          class="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <p class="text-sm text-blue-700 dark:text-blue-400">
            <i class="fas fa-info-circle mr-2"></i>
            Custom thank you page is disabled. The default thank you page will be
            shown after form submission.
          </p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Preview Panel -->
  <div class="w-full lg:w-80">
    <div
      class="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 custom-shadow p-6 sticky top-6"
    >
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Preview
      </h3>
      <div
        class="border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
        style={config.theme === "ide-dark" ? "background-color: #1e1e1e;" : ""}
      >
        {#if config.enabled}
          <div
            class="min-h-96 flex items-center justify-center p-4 transition-colors"
            style="background-color: {config.backgroundType === 'color'
              ? config.backgroundColor
              : '#ffffff'};"
          >
            <div class="text-center max-w-xs">
              {#if config.showSuccessIcon}
                <div
                  class="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                  style="background-color: {config.successIconColor
                    ? `rgba(34,197,94,0.2)`
                    : `rgba(34,197,94,0.2)`};"
                >
                  <svg
                    class="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style="color: {config.successIconColor || '#22c55e'};"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              {/if}
              <h2
                class="text-2xl font-bold mb-2"
                style="color: {config.titleColor || '#1f2937'};"
              >
                {config.title}
              </h2>
              <p
                class="text-sm mb-4"
                style="color: {config.subtitleColor || '#6b7280'};"
              >
                {config.subtitle}
              </p>

              {#if config.buttons.length > 0}
                <div class="space-y-2">
                  {#each config.buttons as button}
                    <button
                      disabled
                      class={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        button.variant === "primary"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-white"
                      }`}
                    >
                      {button.label}
                    </button>
                  {/each}
                </div>
              {/if}

              {#if config.socialLinks.length > 0}
                <div class="flex justify-center gap-3 mt-4">
                  {#each config.socialLinks as link}
                    <div
                      class="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-slate-500 dark:text-gray-400 text-sm"
                    >
                      <i
                        class={socialPlatforms.find(
                          (p) => p.id === link.platform,
                        )?.icon}
                      ></i>
                    </div>
                  {/each}
                </div>
              {/if}

              {#if config.showFormInfo}
                <p
                  class="text-xs mt-4"
                  style="color: {config.textColor || '#d1d5db'};"
                >
                  Form info will appear here
                </p>
              {/if}
            </div>
          </div>
        {:else}
          <div
            class="min-h-96 flex items-center justify-center p-4 bg-slate-50 dark:bg-gray-900/50"
          >
            <div class="text-center text-slate-500 dark:text-gray-400">
              <p class="text-sm">Enable customization to see preview</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom surface color for consistency with app theme */
  :global(.bg-surface) {
    @apply bg-white;
  }

  :global(.custom-shadow) {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
</style>
