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

<div
    class="flex h-full flex-col border-l app-divider surface-strong"
>
    <!-- Persistent Top Header -->
    <div
        class="space-y-4 border-b app-divider bg-[color:var(--surface-muted)] p-6"
    >
        <div class="space-y-3">
            <h3
                class="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] muted-soft"
            >
                Share & Preview
            </h3>

            {#if shareLink && currentFormData?.published}
                <div class="flex gap-2">
                    <input
                        class="field flex-1 truncate py-2 text-xs"
                        readonly
                        type="text"
                        value={shareLink}
                    />
                    <button
                        onclick={copyToClipboard}
                        class="btn btn-primary btn-sm"
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
                        class="flex items-center justify-center gap-2 rounded-[10px] border px-3 py-3 text-center no-underline transition-colors surface-strong hover:bg-[color:var(--surface-muted)]"
                    >
                        <span
                            class="fas fa-external-link-alt text-xs muted"
                        ></span>
                        <span
                            class="text-[10px] font-semibold text-[color:var(--text)]"
                            >Preview</span
                        >
                    </a>
                {:else}
                    <button
                        class="flex cursor-not-allowed items-center justify-center gap-2 rounded-[10px] border px-3 py-3 opacity-50 surface-muted"
                    >
                        <span class="fas fa-eye-slash text-slate-400 text-xs"
                        ></span>
                        <span
                            class="text-[10px] font-semibold muted"
                            >Unpublished</span
                        >
                    </button>
                {/if}

                <button
                    onclick={saveForm}
                    class="btn btn-primary"
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
            class="flex w-16 flex-col items-center gap-4 border-r app-divider bg-[color:var(--surface-muted)] py-6"
        >
            <button
                onclick={() => (activeTab = "themes")}
                class="flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors {activeTab ===
                'themes'
                    ? 'bg-[color:var(--text)] text-[color:var(--surface-strong)]'
                    : 'muted hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)]'}"
                aria-label="Themes"
                title="Themes"
            >
                <i class="fas fa-palette text-lg"></i>
            </button>

            <button
                onclick={() => (activeTab = "background")}
                class="flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors {activeTab ===
                'background'
                    ? 'bg-[color:var(--text)] text-[color:var(--surface-strong)]'
                    : 'muted hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)]'}"
                aria-label="Appearance"
                title="Appearance"
            >
                <i class="fas fa-image text-lg"></i>
            </button>

            <button
                onclick={() => (activeTab = "settings")}
                class="flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors {activeTab ===
                'settings'
                    ? 'bg-[color:var(--text)] text-[color:var(--surface-strong)]'
                    : 'muted hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)]'}"
                aria-label="Configuration"
                title="Configuration"
            >
                <i class="fas fa-cog text-lg"></i>
            </button>

            <button
                onclick={() => (activeTab = "sharing")}
                class="flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors {activeTab ===
                'sharing'
                    ? 'bg-[color:var(--text)] text-[color:var(--surface-strong)]'
                    : 'muted hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)]'}"
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
                        <h3 class="text-sm font-semibold text-[color:var(--text)] mb-1">
                            Themes
                        </h3>
                        <p class="text-xs muted">
                            Select a predefined style for your form.
                        </p>
                    </header>
                    <ThemesModal inline={true} />
                </div>
            {:else if activeTab === "background"}
                <div class="space-y-8">
                    <header>
                        <h3 class="text-sm font-semibold text-[color:var(--text)] mb-1">
                            Appearance
                        </h3>
                        <p class="text-xs muted">
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
                                class="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 flex flex-col items-center justify-center gap-2 overflow-hidden overflow-ellipsis transition-all group-hover:border-primary/50"
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
                                        class="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-gray-300"
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
                            class="flex items-center gap-4 bg-slate-50 dark:bg-gray-800 p-3 rounded-xl border border-slate-100 dark:border-gray-700"
                        >
                            <input
                                type="color"
                                value={currentFormData?.backgroundColor ||
                                    "#ffffff"}
                                oninput={(e) =>
                                    updateBackgroundColor(
                                        e.currentTarget.value,
                                    )}
                                class="w-10 h-10 p-0.5 rounded-lg border border-slate-200 dark:border-gray-600 cursor-pointer bg-white dark:bg-gray-700"
                            />
                            <div class="flex flex-col">
                                <span
                                    class="text-xs font-bold text-slate-700 dark:text-gray-200 uppercase"
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
                        <h3
                            class="text-sm font-bold text-slate-900 dark:text-white mb-1"
                        >
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
                                ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50'
                                : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'}"
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
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                : 'bg-slate-50 dark:bg-gray-800 border-slate-100 dark:border-gray-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-700'}"
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
                                        class="w-full text-xs bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-900 outline-none font-medium transition-all"
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

                    <!-- Anonymous Voting & Fraud Prevention -->
                    <section class="space-y-4 pt-4 border-t border-slate-100 dark:border-gray-800">
                        <h4
                            class="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                            Anonymous & Secure Voting
                        </h4>
                        
                        <!-- Device Tracking Toggle -->
                        <button
                            onclick={() => {
                                currentForm.update((f) => {
                                    const nextVal = !f.enable_device_tracking;
                                    return {
                                        ...f,
                                        enable_device_tracking: nextVal,
                                        // If device tracking is disabled, anonymous voting MUST also be disabled
                                        anonymous_voting: nextVal ? f.anonymous_voting : false
                                    };
                                });
                                saveForm();
                            }}
                            class="w-full flex items-center justify-between p-4 rounded-xl border transition-all {currentFormData?.enable_device_tracking
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                                : 'bg-slate-50 dark:bg-gray-800 border-slate-100 dark:border-gray-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-700'}"
                        >
                            <div class="flex items-center gap-3">
                                <i class="fas fa-shield-alt text-lg"></i>
                                <div class="flex flex-col items-start">
                                    <span class="text-xs font-bold"
                                        >{currentFormData?.enable_device_tracking
                                            ? "Device Tracking Active"
                                            : "No Device Tracking"}</span
                                    >
                                    <span class="text-[10px] opacity-80"
                                        >{currentFormData?.enable_device_tracking
                                            ? "One submission per device"
                                            : "Allow unlimited submissions"}</span
                                    >
                                </div>
                            </div>
                            <div
                                class="w-10 h-6 rounded-full transition-colors {currentFormData?.enable_device_tracking
                                    ? 'bg-indigo-500'
                                    : 'bg-slate-300'}"
                            >
                                <div
                                    class="w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5"
                                    style="transform: translateX({currentFormData?.enable_device_tracking
                                        ? '18px'
                                        : '2px'});"
                                ></div>
                            </div>
                        </button>

                        <!-- Anonymous Ballot Toggle -->
                        <button
                            onclick={() => {
                                currentForm.update((f) => {
                                    const nextAnon = !f.anonymous_voting;
                                    return {
                                        ...f,
                                        anonymous_voting: nextAnon,
                                        // Enforce device tracking if anonymous ballot is enabled
                                        enable_device_tracking: nextAnon ? true : f.enable_device_tracking
                                    };
                                });
                                saveForm();
                            }}
                            class="w-full flex items-center justify-between p-4 rounded-xl border transition-all {currentFormData?.anonymous_voting
                                ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                                : 'bg-slate-50 dark:bg-gray-800 border-slate-100 dark:border-gray-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-700'}"
                        >
                            <div class="flex items-center gap-3">
                                <i class="fas fa-user-secret text-lg"></i>
                                <div class="flex flex-col items-start">
                                    <span class="text-xs font-bold"
                                        >{currentFormData?.anonymous_voting
                                            ? "Anonymous Ballot Enabled"
                                            : "Standard Ballot"}</span
                                    >
                                    <span class="text-[10px] opacity-80"
                                        >{currentFormData?.anonymous_voting
                                            ? "Anonymize responses & hide IP details"
                                            : "Display names/IDs if collected"}</span
                                    >
                                </div>
                            </div>
                            <div
                                class="w-10 h-6 rounded-full transition-colors {currentFormData?.anonymous_voting
                                    ? 'bg-purple-500'
                                    : 'bg-slate-300'}"
                            >
                                <div
                                    class="w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5"
                                    style="transform: translateX({currentFormData?.anonymous_voting
                                        ? '18px'
                                        : '2px'});"
                                ></div>
                            </div>
                        </button>
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
                                    class="w-full max-w-full text-xs bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg py-3 pl-14 pr-4 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-900 outline-none font-medium transition-all"
                                />
                            </div>
                            <p
                                class="text-[10px] text-slate-400 px-1 leading-relaxed"
                            >
                                Changing the slug will break old links.
                            </p>
                        </div>
                    </section>

                    <section
                        class="space-y-4 pt-4 border-t border-slate-100 dark:border-gray-800"
                    >
                        <button
                            class="w-full flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary transition-all group"
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
                        <h3
                            class="text-sm font-bold text-slate-900 dark:text-white mb-1"
                        >
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
                                        class="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-lg"
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
