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
      class="surface surface-strong rounded-[12px] border border-[color:var(--border)] p-6 space-y-4"
    >
      <h3 class="text-lg font-semibold text-[color:var(--text)]">
        Customize Thank You Page
      </h3>

      <!-- Enable/Disable Toggle -->
      <div
        class="flex items-center justify-between p-4 surface-muted rounded-[10px] border border-[color:var(--border)]"
      >
        <div>
          <label
            for="enable-custom"
            class="block text-sm font-medium text-[color:var(--text)]"
            >Use Custom Thank You Page</label
          >
          <p class="text-xs muted mt-1">
            When disabled, shows default design
          </p>
        </div>
        <input
          id="enable-custom"
          type="checkbox"
          checked={config.enabled}
          onchange={toggleEnabled}
          class="w-5 h-5 text-[color:var(--accent)] rounded focus:ring-2 focus:ring-[color:var(--accent)]"
        />
      </div>

      {#if config.enabled}
        <!-- Title Input -->
        <div class="space-y-2">
          <label
            for="title"
            class="block text-sm font-medium text-[color:var(--text)]"
            >Title</label
          >
          <input
            id="title"
            type="text"
            value={config.title}
            oninput={(e) => updateTitle(e.currentTarget.value)}
            placeholder="Thank You!"
            class="w-full px-3 py-2 border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--text)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
        </div>

        <!-- Subtitle Input -->
        <div class="space-y-2">
          <label
            for="subtitle"
            class="block text-sm font-medium text-[color:var(--text)]"
            >Subtitle</label
          >
          <textarea
            id="subtitle"
            value={config.subtitle}
            oninput={(e) => updateSubtitle(e.currentTarget.value)}
            placeholder="Your response has been recorded successfully."
            rows="2"
            class="w-full px-3 py-2 border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--text)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          ></textarea>
        </div>

        <!-- Text Color Settings -->
        <div
          class="space-y-3 pt-4 border-t border-[color:var(--border)]"
        >
          <label
            class="block text-sm font-medium text-[color:var(--text)]"
            >Text Colors</label
          >

          <!-- Title Color -->
          <div class="space-y-2">
            <label
              for="title-color"
              class="block text-xs font-medium text-[color:var(--text-soft)]"
              >Title Color</label
            >
            <div class="flex items-center gap-2">
              <input
                id="title-color"
                type="color"
                value={config.titleColor || "#1f2937"}
                oninput={(e) => updateTitleColor(e.currentTarget.value)}
                class="w-10 h-10 rounded cursor-pointer border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-0.5"
              />
              <span class="text-sm text-[color:var(--text-soft)]"
                >{config.titleColor || "#1f2937"}</span
              >
            </div>
          </div>

          <!-- Subtitle Color -->
          <div class="space-y-2">
            <label
              for="subtitle-color"
              class="block text-xs font-medium text-[color:var(--text-soft)]"
              >Subtitle Color</label
            >
            <div class="flex items-center gap-2">
              <input
                id="subtitle-color"
                type="color"
                value={config.subtitleColor || "#6b7280"}
                oninput={(e) => updateSubtitleColor(e.currentTarget.value)}
                class="w-10 h-10 rounded cursor-pointer border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-0.5"
              />
              <span class="text-sm text-[color:var(--text-soft)]"
                >{config.subtitleColor || "#6b7280"}</span
              >
            </div>
          </div>

          <!-- General Text Color -->
          <div class="space-y-2">
            <label
              for="text-color"
              class="block text-xs font-medium text-[color:var(--text-soft)]"
              >General Text Color</label
            >
            <div class="flex items-center gap-2">
              <input
                id="text-color"
                type="color"
                value={config.textColor || "#d1d5db"}
                oninput={(e) => updateTextColor(e.currentTarget.value)}
                class="w-10 h-10 rounded cursor-pointer border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-0.5"
              />
              <span class="text-sm text-[color:var(--text-soft)]"
                >{config.textColor || "#d1d5db"}</span
              >
            </div>
          </div>

          <!-- Success Icon Color -->
          <div class="space-y-2">
            <label
              for="icon-color"
              class="block text-xs font-medium text-[color:var(--text-soft)]"
              >Success Icon Color</label
            >
            <div class="flex items-center gap-2">
              <input
                id="icon-color"
                type="color"
                value={config.successIconColor || "#22c55e"}
                oninput={(e) => updateSuccessIconColor(e.currentTarget.value)}
                class="w-10 h-10 rounded cursor-pointer border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-0.5"
              />
              <span class="text-sm text-[color:var(--text-soft)]"
                >{config.successIconColor || "#22c55e"}</span
              >
            </div>
          </div>
        </div>

        <!-- Background Settings -->
        <div
          class="space-y-2 pt-4 border-t border-[color:var(--border)]"
        >
          <label
            class="block text-sm font-medium text-[color:var(--text)]"
            >Background</label
          >
          <div class="flex gap-2">
            <button
              onclick={() => updateBackgroundType("color")}
              class={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                config.backgroundType === "color"
                  ? "bg-primary text-white"
                  : "bg-[color:var(--surface-muted)] text-[color:var(--text-soft)] hover:bg-[color:var(--surface-strong)]"
              }`}
            >
              Color
            </button>
            <button
              onclick={() => updateBackgroundType("image")}
              class={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                config.backgroundType === "image"
                  ? "bg-primary text-white"
                  : "bg-[color:var(--surface-muted)] text-[color:var(--text-soft)] hover:bg-[color:var(--surface-strong)]"
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
                class="w-10 h-10 rounded cursor-pointer border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-0.5"
              />
              <span class="text-sm text-[color:var(--text-soft)]"
                >{config.backgroundColor}</span
              >
            </div>
          {:else if config.backgroundType === "image"}
            <div
              class="relative w-full h-32 rounded-lg border-2 border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] group cursor-pointer hover:border-primary transition-colors overflow-hidden flex items-center justify-center"
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
                    class="p-2 bg-[color:var(--surface-strong)] rounded-lg shadow-sm text-[color:var(--danger)] hover:bg-[color:var(--danger)]/10 transition-colors"
                    aria-label="Remove background image"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                  <span
                    class="text-[10px] font-bold text-[color:var(--text)] bg-[color:var(--surface-strong)]/80 px-2 py-0.5 rounded shadow-sm"
                    >Image Uploaded</span
                  >
                </div>
              {:else}
                <i
                  class="fas fa-cloud-upload-alt text-[color:var(--text-soft)] text-2xl group-hover:text-primary transition-colors"
                ></i>
                <span
                  class="absolute text-[10px] font-bold text-[color:var(--text-soft)] group-hover:text-[color:var(--text)]"
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
          class="space-y-2 pt-4 border-t border-[color:var(--border)]"
        >
          <div
            class="flex items-center justify-between p-3 bg-[color:var(--surface-muted)] rounded-lg"
          >
            <label
              for="show-icon"
              class="text-sm font-medium text-[color:var(--text)]"
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
            class="flex items-center justify-between p-3 bg-[color:var(--surface-muted)] rounded-lg"
          >
            <label
              for="show-info"
              class="text-sm font-medium text-[color:var(--text)]"
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
          class="space-y-3 pt-4 border-t border-[color:var(--border)]"
        >
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-[color:var(--text)]"
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
              class="p-3 bg-[color:var(--surface-muted)] rounded-lg border border-[color:var(--border)] space-y-2"
            >
              <div class="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={button.label}
                  oninput={(e) =>
                    updateButton(button.id, "label", e.currentTarget.value)}
                  placeholder="Button Label"
                  class="px-2 py-1 border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--text)] rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                />
                <input
                  type="text"
                  value={button.url}
                  oninput={(e) =>
                    updateButton(button.id, "url", e.currentTarget.value)}
                  placeholder="https://example.com"
                  class="px-2 py-1 border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--text)] rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
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
                        : "bg-[color:var(--surface-strong)] text-[color:var(--text-soft)]"
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
          class="space-y-3 pt-4 border-t border-[color:var(--border)]"
        >
          <label class="text-sm font-medium text-[color:var(--text)]"
            >Social Media Links</label
          >
          {#each socialPlatforms as platform}
            <div
              class="p-3 bg-[color:var(--surface-muted)] rounded-lg border border-[color:var(--border)]"
            >
              <div class="flex items-center justify-between mb-2">
                <label
                  class="text-sm font-medium text-[color:var(--text)]"
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
                class="w-full px-2 py-1 border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--text)] rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
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
      class="bg-[color:var(--surface)] rounded-xl border border-[color:var(--border)] custom-shadow p-6 sticky top-6"
    >
      <h3 class="text-lg font-semibold text-[color:var(--text)] mb-4">
        Preview
      </h3>
      <div
        class="border border-[color:var(--border)] rounded-lg overflow-hidden bg-[color:var(--surface)]"
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
                          : "bg-[color:var(--surface-strong)] text-[color:var(--text)]"
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
                      class="w-8 h-8 rounded-full bg-[color:var(--surface-strong)] flex items-center justify-center text-[color:var(--text-soft)] text-sm"
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
            class="min-h-96 flex items-center justify-center p-4 bg-[color:var(--surface-muted)]"
          >
            <div class="text-center text-[color:var(--text-soft)]">
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
