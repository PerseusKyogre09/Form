<script lang="ts">
  import { onMount } from "svelte";
  import { authClient } from "$lib/authClient";
  import { goto } from "$app/navigation";
  import type { Form, FormTemplate } from "$lib/types";
  import DashboardHeader from "$lib/components/DashboardHeader.svelte";
  import TemplateGallery from "$lib/components/TemplateGallery.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import ModalShell from "$lib/components/ui/ModalShell.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import Surface from "$lib/components/ui/Surface.svelte";
  import { notifications } from "$lib/stores/notifications";

  let allForms = $state<Form[]>([]);
  let sharedForms = $state<Form[]>([]);
  let loading = $state(true);
  let loadingMore = $state(false);
  let hasMore = $state(true);
  let searchQuery = $state("");
  let activeTab = $state<"personal" | "workspace">("personal");
  const PAGE_SIZE = 20;
  let user = $state<any>(null);

  let showDuplicateModal = $state(false);
  let formToDuplicate = $state<Form | null>(null);
  let duplicating = $state(false);

  let showTemplateGallery = $state(false);
  let showFormCreatedModal = $state(false);
  let createdFormId = $state<string | null>(null);
  let createdFormTemplate = $state<FormTemplate | null>(null);
  let isCreatingForm = $state(false);

  let filteredForms = $derived(
    (activeTab === "personal" ? allForms : sharedForms).filter((form) =>
      (form.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  onMount(async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      goto("/login");
      return;
    }

    user = session.user;
    await Promise.all([loadForms(), loadSharedForms()]);
  });

  function generateGradient(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash % 360);
    return `linear-gradient(145deg, hsl(${hue}, 42%, 94%) 0%, hsl(${(hue + 30) % 360}, 28%, 97%) 100%)`;
  }

  async function loadForms() {
    try {
      const res = await fetch("/api/forms");
      if (!res.ok) throw new Error("Failed to load forms");
      const data = await res.json();
      if (Array.isArray(data)) allForms = data as Form[];
      hasMore = allForms.length >= PAGE_SIZE;
    } catch (error) {
      console.error("Error loading forms:", error);
      notifications.add("Failed to load forms.", "error");
    } finally {
      loading = false;
    }
  }

  async function loadSharedForms() {
    try {
      const res = await fetch("/api/forms");
      if (!res.ok) return;
      const data = await res.json();

      if (Array.isArray(data) && user) {
        const owned: Form[] = [];
        const shared: Form[] = [];
        data.forEach((f: Form) => {
          if (f.user_id === user.id) owned.push(f);
          else shared.push(f);
        });
        allForms = owned;
        sharedForms = shared;
      }
    } catch (error) {
      console.error("Error loading shared forms:", error);
      sharedForms = [];
    }
  }

  async function loadMoreForms() {
    loadingMore = true;
    hasMore = false;
    loadingMore = false;
  }

  function handleTemplateSelect(template: FormTemplate) {
    if (!template.id) {
      window.location.href = "/form-builder";
      return;
    }
    createFormFromTemplate(template.id, template);
  }

  async function createFormFromTemplate(templateId: string, template: FormTemplate) {
    try {
      isCreatingForm = true;
      showTemplateGallery = false;
      const res = await fetch("/api/templates/create-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create form");
      }

      const { formId } = await res.json();
      createdFormId = formId;
      createdFormTemplate = template;
      showFormCreatedModal = true;
    } catch (error) {
      console.error("Error creating form from template:", error);
      notifications.add("Failed to create form from template.", "error");
    } finally {
      isCreatingForm = false;
    }
  }

  function openFormBuilder() {
    if (createdFormId) window.location.href = `/form-builder/${createdFormId}`;
  }

  function openNewFormMenu() {
    showTemplateGallery = true;
  }

  function navigateToBuilder(form: Form) {
    window.location.href = `/form-builder/${form.id}`;
  }

  async function deleteForm(formId: string, formTitle: string | null) {
    const confirmed = window.confirm(
      `Delete "${formTitle ?? "Untitled Form"}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/forms?formId=${formId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete form");
      allForms = allForms.filter((f) => f.id !== formId);
      notifications.add("Form deleted.", "success");
    } catch (error) {
      console.error("Error deleting form:", error);
      notifications.add("Failed to delete form.", "error");
    }
  }

  function openDuplicateModal(form: Form) {
    formToDuplicate = form;
    showDuplicateModal = true;
  }

  async function duplicateForm(includeResponses: boolean) {
    if (!formToDuplicate) return;

    duplicating = true;
    try {
      const res = await fetch("/api/forms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "duplicate",
          formId: formToDuplicate.id,
          includeResponses,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to duplicate form");
      }

      await loadForms();
      await loadSharedForms();
      showDuplicateModal = false;
      formToDuplicate = null;
      notifications.add("Form duplicated.", "success");
    } catch (error) {
      console.error("Error duplicating form:", error);
      notifications.add("Failed to duplicate form.", "error");
    } finally {
      duplicating = false;
    }
  }

  function formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return "Recently edited";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
</script>

<div class="app-shell">
  <DashboardHeader onNewForm={openNewFormMenu} />

  <main class="page-container page-stack section-stack">
    <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <PageHeader
        eyebrow="Workspace"
        title={activeTab === "personal" ? "Your forms" : "Shared with you"}
        description={activeTab === "personal"
          ? "Create, organize, and publish forms without losing sight of the details that matter."
          : "Collaborative forms you can review and edit live with your team."}
      />

      <div class="flex flex-col gap-3 sm:items-start lg:items-end">
        <div class="segmented">
          <button
            type="button"
            class="segmented-item"
            data-state={activeTab === "personal" ? "active" : "inactive"}
            on:click={() => (activeTab = "personal")}
          >
            Personal
          </button>
          <button
            type="button"
            class="segmented-item"
            data-state={activeTab === "workspace" ? "active" : "inactive"}
            on:click={() => (activeTab = "workspace")}
          >
            Workspace
            {#if sharedForms.length > 0}
              <span class="ml-1 rounded-full border px-1.5 py-0.5 text-[11px] badge-muted">
                {sharedForms.length}
              </span>
            {/if}
          </button>
        </div>

        <div class="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <div class="relative min-w-0 sm:w-[320px]">
            <i class="fas fa-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs muted"></i>
            <input
              type="text"
              placeholder="Search forms"
              bind:value={searchQuery}
              class="field pl-9 pr-9"
            />
            {#if searchQuery}
              <button class="absolute right-2 top-1/2 -translate-y-1/2 icon-btn h-8 w-8 border-transparent bg-transparent" on:click={() => (searchQuery = "")} aria-label="Clear search">
                <i class="fas fa-times text-xs"></i>
              </button>
            {/if}
          </div>
          <button type="button" class="btn btn-secondary lg:hidden" on:click={openNewFormMenu}>
            <i class="fas fa-plus text-xs"></i>
            <span>New form</span>
          </button>
        </div>
      </div>
    </div>

    <Surface className="panel-section">
      <div class="mb-5 flex items-center justify-between gap-3">
        <div class="text-sm muted">
          {filteredForms.length} form{filteredForms.length === 1 ? "" : "s"}
        </div>
      </div>

      {#if loading}
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--accent)]"></div>
            <p class="text-sm muted">Loading your forms…</p>
          </div>
        </div>
      {:else}
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {#if activeTab === "personal" && !searchQuery}
            <button
              type="button"
              on:click={openNewFormMenu}
              class="flex min-h-[220px] flex-col items-start justify-between rounded-[12px] border border-dashed p-5 text-left transition-colors surface-muted hover:border-[color:var(--accent)]"
            >
              <div class="space-y-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-[10px] border surface-strong">
                  <i class="fas fa-plus text-sm text-[color:var(--accent)]"></i>
                </div>
                <div>
                  <h3 class="text-base font-semibold tracking-tight text-[color:var(--text)]">Create a new form</h3>
                  <p class="mt-1 text-sm leading-6 muted">Start from a blank canvas or one of your templates.</p>
                </div>
              </div>
              <span class="text-sm font-medium text-[color:var(--accent)]">Choose a template</span>
            </button>
          {/if}

          {#each filteredForms as form (form.id)}
            <Surface className="form-card overflow-hidden transition-transform duration-150 hover:-translate-y-0.5">
              <div
                role="button"
                tabindex="0"
                class="flex h-full min-h-[220px] cursor-pointer flex-col"
                on:click={() => navigateToBuilder(form)}
                on:keydown={(e) => e.key === "Enter" && navigateToBuilder(form)}
              >
                <div class="relative h-28 border-b app-divider px-5 py-4" style={`background:${generateGradient(form.title ?? form.id)};`}>
                  <div class="absolute inset-0 opacity-60">
                    <div class="absolute left-5 top-5 h-2 w-16 rounded-full bg-white/60"></div>
                    <div class="absolute left-5 top-11 h-2 w-24 rounded-full bg-white/45"></div>
                    <div class="absolute left-5 top-17 h-2 w-20 rounded-full bg-white/35"></div>
                  </div>
                  <div class="relative z-10 flex items-start justify-between gap-3">
                    {#if form.published}
                      <span class="status-badge badge-success">
                        <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                        Published
                      </span>
                    {:else}
                      <span class="status-badge badge-muted">
                        <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                        Draft
                      </span>
                    {/if}

                    <div class="relative group/menu">
                      <button
                        type="button"
                        class="icon-btn h-8 w-8 border-transparent bg-white/80"
                        aria-label="Form options"
                        on:click={(e) => e.stopPropagation()}
                      >
                        <i class="fas fa-ellipsis-h text-xs"></i>
                      </button>
                      <div class="invisible absolute right-0 top-full z-20 mt-2 w-44 translate-y-1 opacity-0 transition-all duration-150 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100">
                        <div class="surface surface-strong overflow-hidden py-1">
                          <button
                            type="button"
                            on:click={(e) => {
                              e.stopPropagation();
                              openDuplicateModal(form);
                            }}
                            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
                          >
                            <i class="fas fa-copy text-xs muted"></i>
                            <span>Duplicate</span>
                          </button>
                          <button
                            type="button"
                            on:click={(e) => {
                              e.stopPropagation();
                              deleteForm(form.id, form.title);
                            }}
                            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[color:var(--danger)] hover:bg-[color:var(--surface-muted)]"
                          >
                            <i class="fas fa-trash text-xs"></i>
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex flex-1 flex-col gap-4 p-5">
                  <div class="space-y-1.5">
                    <h3 class="line-clamp-1 text-lg font-semibold tracking-tight text-[color:var(--text)]">
                      {form.title || "Untitled Form"}
                    </h3>
                    <p class="text-sm muted">
                      {form.questions?.length || 0} item{(form.questions?.length || 0) === 1 ? "" : "s"} • Edited {formatDate(form.updated_at)}
                    </p>
                  </div>

                  <div class="mt-auto flex items-center gap-2">
                    <button
                      type="button"
                      class="btn btn-primary flex-1"
                      on:click={(e) => {
                        e.stopPropagation();
                        navigateToBuilder(form);
                      }}
                    >
                      <i class="fas fa-pen-to-square text-xs"></i>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      class="icon-btn"
                      on:click={(e) => {
                        e.stopPropagation();
                        openDuplicateModal(form);
                      }}
                      aria-label="Duplicate form"
                    >
                      <i class="fas fa-copy text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            </Surface>
          {/each}
        </div>

        {#if searchQuery && filteredForms.length === 0}
          <div class="pt-6">
            <EmptyState
              icon="fa-search"
              title="No forms match your search"
              description={`Try a different name or clear the current search for "${searchQuery}".`}
            >
              <button class="btn btn-secondary mt-5" type="button" on:click={() => (searchQuery = "")}>
                Clear search
              </button>
            </EmptyState>
          </div>
        {:else if !searchQuery && filteredForms.length === 0}
          <div class="pt-6">
            <EmptyState
              icon={activeTab === "personal" ? "fa-file-circle-plus" : "fa-handshake"}
              title={activeTab === "personal" ? "No forms yet" : "Nothing shared with you yet"}
              description={activeTab === "personal"
                ? "Create your first form to start collecting responses."
                : "Forms shared with you will appear here once a teammate adds you."}
            >
              {#if activeTab === "personal"}
                <button type="button" class="btn btn-primary mt-5" on:click={openNewFormMenu}>
                  <i class="fas fa-plus text-xs"></i>
                  <span>Create form</span>
                </button>
              {/if}
            </EmptyState>
          </div>
        {/if}

        {#if hasMore && !searchQuery && activeTab === "personal"}
          <div class="mt-6 flex justify-center">
            <button type="button" class="btn btn-secondary" disabled={loadingMore} on:click={loadMoreForms}>
              {#if loadingMore}
                <i class="fas fa-spinner fa-spin text-xs"></i>
                <span>Loading…</span>
              {:else}
                <span>Load more</span>
              {/if}
            </button>
          </div>
        {/if}
      {/if}
    </Surface>
  </main>

  {#if showDuplicateModal && formToDuplicate}
    <ModalShell
      title="Duplicate form"
      description={`Create a copy of "${formToDuplicate.title || "Untitled Form"}".`}
      maxWidthClass="max-w-md"
      onClose={() => {
        showDuplicateModal = false;
        formToDuplicate = null;
      }}
    >
      <div class="space-y-5 p-5">
        <Surface muted={true} className="panel-section">
          <ul class="space-y-2 text-sm leading-6 muted">
            <li>Form structure and design are copied.</li>
            <li>Responses are not copied in the current workflow.</li>
          </ul>
        </Surface>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="btn btn-secondary"
            disabled={duplicating}
            on:click={() => {
              showDuplicateModal = false;
              formToDuplicate = null;
            }}
          >
            Cancel
          </button>
          <button type="button" class="btn btn-primary" disabled={duplicating} on:click={() => duplicateForm(false)}>
            {#if duplicating}
              <i class="fas fa-spinner fa-spin text-xs"></i>
              <span>Duplicating…</span>
            {:else}
              <i class="fas fa-copy text-xs"></i>
              <span>Duplicate</span>
            {/if}
          </button>
        </div>
      </div>
    </ModalShell>
  {/if}

  {#if showTemplateGallery}
    <TemplateGallery onSelect={handleTemplateSelect} onCancel={() => (showTemplateGallery = false)} />
  {/if}

  {#if showFormCreatedModal && createdFormTemplate}
    <ModalShell
      title="Form created"
      description="The template has been copied into a new draft."
      maxWidthClass="max-w-md"
      onClose={() => {
        showFormCreatedModal = false;
        createdFormId = null;
        createdFormTemplate = null;
      }}
    >
      <div class="space-y-5 p-5">
        <Surface muted={true} className="panel-section">
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-[10px] border surface-strong">
              <i class={`fas ${createdFormTemplate.icon} text-sm muted`}></i>
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-[color:var(--text)]">{createdFormTemplate.name}</h3>
              <p class="mt-1 text-sm leading-6 muted">{createdFormTemplate.description}</p>
              <p class="mt-2 text-xs muted-soft">
                {createdFormTemplate.questions_template?.length ?? 0} questions
              </p>
            </div>
          </div>
        </Surface>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="btn btn-secondary"
            on:click={() => {
              showFormCreatedModal = false;
              createdFormId = null;
              createdFormTemplate = null;
            }}
          >
            Close
          </button>
          <button type="button" class="btn btn-primary" on:click={openFormBuilder}>
            <i class="fas fa-pen-to-square text-xs"></i>
            <span>Open builder</span>
          </button>
        </div>
      </div>
    </ModalShell>
  {/if}
</div>
