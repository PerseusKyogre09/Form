<script lang="ts">
    import ThemesModal from "./ThemesModal.svelte";
    import type { Form } from "../types";

    export let currentFormData: Form | undefined;
    export let shareLink: string = "";

    // Event handlers passed from parent
    export let saveForm: () => Promise<void>;
    export let toggleFormStatus: () => Promise<void>;
    export let updateGlobalTextColor: (color: string) => void;
    export let updateBackgroundColor: (color: string) => void;
    export let handleBackgroundImageUpload: (e: Event) => Promise<void>;
    export let removeBackgroundImage: () => void;
    export let copyToClipboard: () => void;

    let isBackgroundOpen = false;
    let isTextColorOpen = false;
    let isSlugOpen = false;

    function updateSlug(newSlug: string) {
        if (currentFormData) {
            currentFormData.slug = newSlug;
            saveForm();
        }
    }
</script>

<div
    class="bg-surface p-6 rounded-xl border border-slate-200 custom-shadow space-y-4"
>
    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
        Form Settings
    </h3>

    <ThemesModal />

    <!-- Background Settings -->
    <!-- Background Settings -->
    <button
        class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 group transition-all"
        on:click={() => (isBackgroundOpen = !isBackgroundOpen)}
    >
        <div class="flex flex-col gap-2 w-full">
            <div class="flex items-center justify-between w-full group">
                <div class="flex items-center gap-3">
                    <span
                        class="fas fa-image text-secondary group-hover:scale-110 transition-transform"
                    ></span>
                    <span class="text-sm font-medium">Background Image</span>
                </div>
                <span
                    class="fas fa-chevron-right text-slate-300 text-sm transition-transform duration-200 {isBackgroundOpen
                        ? 'rotate-90'
                        : ''}"
                ></span>
            </div>

            <!-- Inline Quick Settings for Background -->
            {#if isBackgroundOpen}
                <div
                    class="pl-8 pt-2 space-y-2 text-left"
                    on:click|stopPropagation
                    role="group"
                >
                    {#if currentFormData?.backgroundType === "color"}
                        <div class="flex gap-2">
                            <input
                                type="color"
                                value={currentFormData?.backgroundColor ||
                                    "#ffffff"}
                                on:input={(e) =>
                                    updateBackgroundColor(
                                        e.currentTarget.value,
                                    )}
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
            {/if}
        </div>
    </button>

    <!-- Global Text Color Settings -->
    <button
        class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 group transition-all"
        on:click={() => (isTextColorOpen = !isTextColorOpen)}
    >
        <div class="flex flex-col gap-2 w-full">
            <div class="flex items-center justify-between w-full group">
                <div class="flex items-center gap-3">
                    <span
                        class="fas fa-font text-secondary group-hover:scale-110 transition-transform"
                    ></span>
                    <span class="text-sm font-medium">Global Text Color</span>
                </div>
                <span
                    class="fas fa-chevron-right text-slate-300 text-sm transition-transform duration-200 {isTextColorOpen
                        ? 'rotate-90'
                        : ''}"
                ></span>
            </div>

            <!-- Inline Quick Settings for Text Color -->
            {#if isTextColorOpen}
                <div
                    class="pl-8 pt-2 text-left"
                    on:click|stopPropagation
                    role="group"
                >
                    <div class="flex gap-2">
                        <input
                            type="color"
                            value={currentFormData?.globalTextColor ||
                                "#000000"}
                            on:input={(e) => {
                                updateGlobalTextColor(e.currentTarget.value);
                                saveForm();
                            }}
                            class="w-8 h-8 rounded cursor-pointer border border-gray-200"
                        />
                        <span class="text-xs text-slate-500 self-center"
                            >{currentFormData?.globalTextColor ||
                                "Default"}</span
                        >
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1">
                        Overrides dynamic text colors
                    </p>
                </div>
            {/if}
        </div>
    </button>

    <!-- Slug Settings -->
    <button
        class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 group transition-all"
        on:click={() => (isSlugOpen = !isSlugOpen)}
    >
        <div class="flex flex-col gap-2 w-full">
            <div class="flex items-center justify-between w-full group">
                <div class="flex items-center gap-3">
                    <span
                        class="fas fa-link text-secondary group-hover:scale-110 transition-transform"
                    ></span>
                    <span class="text-sm font-medium">Form Slug</span>
                </div>
                <span
                    class="fas fa-chevron-right text-slate-300 text-sm transition-transform duration-200 {isSlugOpen
                        ? 'rotate-90'
                        : ''}"
                ></span>
            </div>

            <!-- Inline Slug Editor -->
            {#if isSlugOpen}
                <div
                    class="pl-8 pt-2 text-left space-y-2"
                    on:click|stopPropagation
                    role="group"
                >
                    <input
                        type="text"
                        value={currentFormData?.slug || ""}
                        on:change={(e) => updateSlug(e.currentTarget.value)}
                        placeholder="my-form-slug"
                        class="w-full text-xs bg-white border border-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary outline-none"
                    />
                    <p class="text-[10px] text-slate-400">
                        Use this in your URL: /form/{currentFormData?.slug ||
                            "form-slug"}
                    </p>
                </div>
            {/if}
        </div>
    </button>

    <button
        on:click={toggleFormStatus}
        class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 group transition-all"
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
        <h3 class="text-xs font-bold text-primary uppercase tracking-widest">
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
    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
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
