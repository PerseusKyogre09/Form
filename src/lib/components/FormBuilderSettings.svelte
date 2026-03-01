<script lang="ts">
    import ThemesModal from "./ThemesModal.svelte";
    import FormSharingModal from "./FormSharingModal.svelte";
    import type { Form, Question } from "../types";
    import { isQuestionElement } from "../types";
    import { currentForm } from "../stores";

    let {
        currentFormData,
        shareLink = "",
        saveForm,
        toggleFormStatus,
        updateGlobalTextColor,
        updateBackgroundColor,
        handleBackgroundImageUpload,
        removeBackgroundImage,
        copyToClipboard,
    } = $props();

    let activeTab = $state<"themes" | "background" | "settings" | "sharing">(
        "themes",
    );
    let isSharingModalOpen = $state(false);

    function updateSlug(newSlug: string) {
        if (currentFormData) {
            currentFormData.slug = newSlug;
            saveForm();
        }
    }
</script>

<div class="flex flex-col h-full bg-white border-l border-slate-200">
    <!-- Persistent Top Header -->
    <div class="p-6 border-b border-slate-100 space-y-4 bg-slate-50/50">
        <div class="space-y-3">
            <h3
                class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1"
            >
                Share & Preview
            </h3>

            {#if shareLink && currentFormData?.published}
                <div class="flex gap-2">
                    <input
                        class="flex-1 text-xs bg-white border border-slate-200 rounded-lg py-2 px-3 focus:ring-1 focus:ring-primary outline-none truncate"
                        readonly
                        type="text"
                        value={shareLink}
                    />
                    <button
                        onclick={copyToClipboard}
                        class="bg-primary text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-600 transition-colors shadow-sm"
                        aria-label="Copy Share Link"
                    >
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            {/if}

            <div class="grid grid-cols-2 gap-2">
                {#if shareLink && currentFormData?.published}
                    <a
                        href={shareLink}
                        target="_blank"
                        class="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-primary transition-all text-center no-underline shadow-sm group"
                    >
                        <span
                            class="fas fa-external-link-alt text-slate-400 group-hover:text-primary text-xs"
                        ></span>
                        <span
                            class="text-[10px] font-bold text-slate-600 group-hover:text-slate-900"
                            >Preview</span
                        >
                    </a>
                {:else}
                    <button
                        class="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed shadow-none"
                    >
                        <span class="fas fa-eye-slash text-slate-400 text-xs"
                        ></span>
                        <span class="text-[10px] font-bold text-slate-500"
                            >Unpublished</span
                        >
                    </button>
                {/if}

                <button
                    onclick={saveForm}
                    class="flex items-center justify-center gap-2 p-3 rounded-xl bg-black text-white hover:opacity-90 transition-all shadow-sm"
                >
                    <span class="fas fa-save text-xs"></span>
                    <span class="text-[10px] font-bold">Save</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Main Content with Tab Navigation -->
    <div class="flex-1 flex overflow-hidden">
        <!-- Tab Sidebar (Vertical Icons) -->
        <div
            class="w-16 border-r border-slate-100 flex flex-col items-center py-6 gap-4 bg-slate-50/30"
        >
            <button
                onclick={() => (activeTab = "themes")}
                class="w-10 h-10 flex items-center justify-center rounded-xl transition-all {activeTab ===
                'themes'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                    : 'text-slate-400 hover:bg-white hover:text-slate-600'}"
                aria-label="Themes"
                title="Themes"
            >
                <i class="fas fa-palette text-lg"></i>
            </button>

            <button
                onclick={() => (activeTab = "background")}
                class="w-10 h-10 flex items-center justify-center rounded-xl transition-all {activeTab ===
                'background'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                    : 'text-slate-400 hover:bg-white hover:text-slate-600'}"
                aria-label="Appearance"
                title="Appearance"
            >
                <i class="fas fa-image text-lg"></i>
            </button>

            <button
                onclick={() => (activeTab = "settings")}
                class="w-10 h-10 flex items-center justify-center rounded-xl transition-all {activeTab ===
                'settings'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                    : 'text-slate-400 hover:bg-white hover:text-slate-600'}"
                aria-label="Configuration"
                title="Configuration"
            >
                <i class="fas fa-cog text-lg"></i>
            </button>

            <button
                onclick={() => (activeTab = "sharing")}
                class="w-10 h-10 flex items-center justify-center rounded-xl transition-all {activeTab ===
                'sharing'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                    : 'text-slate-400 hover:bg-white hover:text-slate-600'}"
                aria-label="Share"
                title="Share"
            >
                <i class="fas fa-share-alt text-lg"></i>
            </button>
        </div>

        <!-- Scrollable Tab Content -->
        <div class="flex-1 overflow-y-auto p-6">
            {#if activeTab === "themes"}
                <div class="space-y-6">
                    <header>
                        <h3 class="text-sm font-bold text-slate-900 mb-1">
                            Themes
                        </h3>
                        <p class="text-xs text-slate-500">
                            Select a predefined style for your form.
                        </p>
                    </header>
                    <ThemesModal inline={true} />
                </div>
            {:else if activeTab === "background"}
                <div class="space-y-8">
                    <header>
                        <h3 class="text-sm font-bold text-slate-900 mb-1">
                            Appearance
                        </h3>
                        <p class="text-xs text-slate-500">
                            Customize the look and feel of your form.
                        </p>
                    </header>

                    <!-- Background Image section -->
                    <section class="space-y-4">
                        <h4
                            class="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                            Background Image
                        </h4>
                        <div class="relative group">
                            <div
                                class="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 overflow-hidden overflow-ellipsis transition-all group-hover:border-primary/50"
                            >
                                {#if currentFormData?.backgroundImage}
                                    <img
                                        src={currentFormData.backgroundImage}
                                        alt="Background"
                                        class="absolute inset-0 w-full h-full object-cover opacity-40 blur-[1px]"
                                    />
                                    <div
                                        class="relative flex flex-col items-center gap-2"
                                    >
                                        <button
                                            onclick={removeBackgroundImage}
                                            class="p-2 bg-white rounded-lg shadow-sm text-red-500 hover:bg-red-50 transition-colors"
                                            aria-label="Remove background image"
                                        >
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                        <span
                                            class="text-[10px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded shadow-sm"
                                            >Image Uploaded</span
                                        >
                                    </div>
                                {:else}
                                    <i
                                        class="fas fa-cloud-upload-alt text-slate-300 text-2xl group-hover:text-primary transition-colors"
                                    ></i>
                                    <span
                                        class="text-[10px] font-bold text-slate-400 group-hover:text-slate-600"
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
                        </div>
                    </section>

                    <!-- Background Color section -->
                    <section class="space-y-4">
                        <h4
                            class="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                            Background Color
                        </h4>
                        <div
                            class="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100"
                        >
                            <input
                                type="color"
                                value={currentFormData?.backgroundColor ||
                                    "#ffffff"}
                                oninput={(e) =>
                                    updateBackgroundColor(
                                        e.currentTarget.value,
                                    )}
                                class="w-10 h-10 p-0.5 rounded-lg border border-slate-200 cursor-pointer bg-white"
                            />
                            <div class="flex flex-col">
                                <span
                                    class="text-xs font-bold text-slate-700 uppercase"
                                    >{currentFormData?.backgroundColor ||
                                        "#ffffff"}</span
                                >
                                <span class="text-[10px] text-slate-400"
                                    >Main background</span
                                >
                            </div>
                        </div>
                    </section>

                    <!-- Text Color section -->
                    <section class="space-y-4">
                        <h4
                            class="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                            Global Text Color
                        </h4>
                        <div
                            class="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100"
                        >
                            <input
                                type="color"
                                value={currentFormData?.globalTextColor ||
                                    "#000000"}
                                oninput={(e) => {
                                    updateGlobalTextColor(
                                        e.currentTarget.value,
                                    );
                                    saveForm();
                                }}
                                class="w-10 h-10 p-0.5 rounded-lg border border-slate-200 cursor-pointer bg-white"
                            />
                            <div class="flex flex-col">
                                <span
                                    class="text-xs font-bold text-slate-700 uppercase"
                                    >{currentFormData?.globalTextColor ||
                                        "Default"}</span
                                >
                                <span class="text-[10px] text-slate-400"
                                    >Overrides dynamic contrast</span
                                >
                            </div>
                        </div>
                    </section>
                </div>
            {:else if activeTab === "settings"}
                <div class="space-y-8">
                    <header>
                        <h3 class="text-sm font-bold text-slate-900 mb-1">
                            Configuration
                        </h3>
                        <p class="text-xs text-slate-500">
                            Manage form visibility and URL.
                        </p>
                    </header>

                    <section class="space-y-4">
                        <h4
                            class="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                            Form Visibility
                        </h4>
                        <button
                            onclick={toggleFormStatus}
                            class="w-full flex items-center justify-between p-4 rounded-xl border transition-all {currentFormData?.closed
                                ? 'bg-orange-50 border-orange-100 text-orange-700 hover:bg-orange-100'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'}"
                        >
                            <div class="flex items-center gap-3">
                                <i
                                    class="fas {currentFormData?.closed
                                        ? 'fa-lock'
                                        : 'fa-lock-open'} text-lg"
                                ></i>
                                <div class="flex flex-col items-start">
                                    <span class="text-xs font-bold"
                                        >{currentFormData?.closed
                                            ? "Closed"
                                            : "Open"}</span
                                    >
                                    <span class="text-[10px] opacity-80"
                                        >{currentFormData?.closed
                                            ? "Not accepting responses"
                                            : "Publicly accessible"}</span
                                    >
                                </div>
                            </div>
                            <span class="fas fa-power-off opacity-40"></span>
                        </button>
                    </section>

                    <!-- Event Check-in Section -->
                    <section class="space-y-4 pt-4 border-t border-slate-100">
                        <h4
                            class="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                            Event Check-in
                        </h4>
                        <button
                            onclick={() => {
                                currentForm.update((f) => ({
                                    ...f,
                                    enable_checkin: !f.enable_checkin,
                                }));
                                saveForm();
                            }}
                            class="w-full flex items-center justify-between p-4 rounded-xl border transition-all {currentFormData?.enable_checkin
                                ? 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100'
                                : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}"
                        >
                            <div class="flex items-center gap-3">
                                <i class="fas fa-qrcode text-lg"></i>
                                <div class="flex flex-col items-start">
                                    <span class="text-xs font-bold"
                                        >{currentFormData?.enable_checkin
                                            ? "Check-in Enabled"
                                            : "Check-in Disabled"}</span
                                    >
                                    <span class="text-[10px] opacity-80"
                                        >{currentFormData?.enable_checkin
                                            ? "QR codes shown after submission"
                                            : "Enable to show QR passes"}</span
                                    >
                                </div>
                            </div>
                            <div
                                class="w-10 h-6 rounded-full transition-colors {currentFormData?.enable_checkin
                                    ? 'bg-blue-500'
                                    : 'bg-slate-300'}"
                            >
                                <div
                                    class="w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5"
                                    style="transform: translateX({currentFormData?.enable_checkin
                                        ? '18px'
                                        : '2px'});"
                                ></div>
                            </div>
                        </button>

                        {#if currentFormData?.enable_checkin}
                            <div class="space-y-3">
                                <label class="block">
                                    <span
                                        class="text-xs font-bold text-slate-600 block mb-2"
                                        >Participant Name Field</span
                                    >
                                    <select
                                        value={currentFormData?.checkin_name_field_id ||
                                            ""}
                                        onchange={(e) => {
                                            currentForm.update((f) => ({
                                                ...f,
                                                checkin_name_field_id:
                                                    e.currentTarget.value,
                                            }));
                                            saveForm();
                                        }}
                                        class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-primary focus:bg-white outline-none font-medium transition-all"
                                    >
                                        <option value=""
                                            >Select a field...</option
                                        >
                                        {#each (currentFormData?.questions || []).filter( (q: any) => isQuestionElement(q), ) as question}
                                            <option value={question.id}
                                                >{question.title}</option
                                            >
                                        {/each}
                                    </select>
                                    <p
                                        class="text-[10px] text-slate-400 px-1 mt-1 leading-relaxed"
                                    >
                                        This field will be shown when scanning
                                        QR codes and used for certificates.
                                    </p>
                                </label>

                                {#if currentFormData?.id}
                                    <a
                                        href="/checkin/{currentFormData.id}"
                                        target="_blank"
                                        class="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors"
                                    >
                                        <i class="fas fa-camera"></i>
                                        Open Scanner
                                    </a>
                                {/if}
                            </div>
                        {/if}
                    </section>

                    <section class="space-y-4">
                        <h4
                            class="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                            Custom URL Slug
                        </h4>
                        <div class="space-y-2">
                            <div class="relative">
                                <span
                                    class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                                    >/form/</span
                                >
                                <input
                                    type="text"
                                    value={currentFormData?.slug || ""}
                                    onchange={(e) =>
                                        updateSlug(e.currentTarget.value)}
                                    placeholder="my-cool-form"
                                    class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-3 pl-14 pr-4 focus:ring-2 focus:ring-primary focus:bg-white outline-none font-medium transition-all"
                                />
                            </div>
                            <p
                                class="text-[10px] text-slate-400 px-1 leading-relaxed"
                            >
                                Changing the slug will break old links.
                            </p>
                        </div>
                    </section>

                    <section class="space-y-4 pt-4 border-t border-slate-100">
                        <button
                            class="w-full flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-primary transition-all group"
                        >
                            <span
                                class="fas fa-trash-alt text-slate-300 group-hover:text-red-500 transition-colors"
                            ></span>
                            <span
                                class="text-[10px] font-bold text-slate-500 group-hover:text-slate-900"
                                >Advanced Settings</span
                            >
                        </button>
                    </section>
                </div>
            {:else if activeTab === "sharing"}
                <div class="space-y-8">
                    <header>
                        <h3 class="text-sm font-bold text-slate-900 mb-1">
                            Share Form
                        </h3>
                        <p class="text-xs text-slate-500">
                            Grant access to other registered users.
                        </p>
                    </header>

                    <section class="space-y-4">
                        <p class="text-xs text-slate-600 leading-relaxed">
                            Share this form with other registered users to
                            collaborate. You can grant them <strong
                                >Editor</strong
                            >
                            (can edit form and view responses) or
                            <strong>Viewer</strong> (read-only) access.
                        </p>
                        <button
                            onclick={() => (isSharingModalOpen = true)}
                            class="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-primary text-white font-semibold hover:bg-indigo-600 transition-colors"
                        >
                            <i class="fas fa-user-plus"></i>
                            <span>Manage Collaborators</span>
                        </button>
                    </section>

                    {#if currentFormData?.collaborators && currentFormData.collaborators.length > 0}
                        <section
                            class="space-y-4 pt-4 border-t border-slate-100"
                        >
                            <h4
                                class="text-xs font-bold text-slate-600 uppercase"
                            >
                                Active Collaborators ({currentFormData
                                    .collaborators.length})
                            </h4>
                            <div class="space-y-2">
                                {#each currentFormData.collaborators as collab}
                                    <div
                                        class="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold text-white"
                                            >
                                                {collab.user?.user_metadata?.username
                                                    ?.charAt(0)
                                                    .toUpperCase() ||
                                                    collab.user?.email
                                                        ?.charAt(0)
                                                        .toUpperCase() ||
                                                    "U"}
                                            </div>
                                            <div>
                                                <p
                                                    class="text-xs font-semibold text-slate-900"
                                                >
                                                    {collab.user?.user_metadata
                                                        ?.username ||
                                                        collab.user?.email?.split(
                                                            "@",
                                                        )[0] ||
                                                        "User"}
                                                </p>
                                                <p
                                                    class="text-[10px] text-slate-500 capitalize"
                                                >
                                                    {collab.role}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </section>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>

<FormSharingModal bind:isOpen={isSharingModalOpen} form={currentFormData} />

<style>
    /* Custom scrollbar for better look */
    .overflow-y-auto::-webkit-scrollbar {
        width: 4px;
    }
    .overflow-y-auto::-webkit-scrollbar-track {
        background: transparent;
    }
    .overflow-y-auto::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }
    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
    }
</style>
