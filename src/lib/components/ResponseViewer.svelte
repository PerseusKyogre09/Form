<!-- src/lib/components/ResponseViewer.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import type { FormResponse, FormElement, Question } from "../types";
  import { isQuestionElement } from "../types";
  import { notifications } from "../stores/notifications";

  export let formId: string;
  export let questions: FormElement[] = [];
  export let enableCheckin: boolean = false;
  export let enableDeviceTracking: boolean = false;
  export let anonymousVoting: boolean = false;

  let questionList: Question[] = [];
  $: questionList = questions.filter(isQuestionElement);

  function getVoterId(deviceId?: string): string {
    if (!deviceId) return "—";
    if (deviceId.startsWith("fp_")) {
      const parts = deviceId.split("_");
      const hash = parts[1] || "";
      return `VTR-${hash.substring(0, 6).toUpperCase()}`;
    }
    // Handle database-hashed values directly
    return `VTR-${deviceId.substring(0, 6).toUpperCase()}`;
  }

  // State
  let responses: FormResponse[] = [];
  let loading = true;
  let totalCount = 0;

  // Pagination
  let currentPage = 1;
  const PAGE_SIZE = 50;
  $: totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Sorting & Filtering
  let sortConfig: {
    column: string;
    direction: "asc" | "desc";
    type: "meta" | "answer";
  } = {
    column: "created_at",
    direction: "desc",
    type: "meta",
  };

  let filters: Record<string, string> = {};
  let openPopoverId: string | null = null;
  let filterTimeout: ReturnType<typeof setTimeout>;

  onMount(async () => {
    await fetchResponses();
  });

  async function fetchResponses() {
    loading = true;
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(PAGE_SIZE),
        sortDir: sortConfig.direction,
      });

      const res = await fetch(`/api/responses/${formId}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch responses");

      const data = await res.json();
      responses = data.responses as FormResponse[];
      totalCount = data.totalCount;
    } catch (error) {
      console.error("Error loading responses:", error);
    } finally {
      loading = false;
    }
  }

  function handleFilterChange(key: string, value: string) {
    filters[key] = value;
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      currentPage = 1;
      fetchResponses();
    }, 500);
  }

  function handleSort(column: string, type: "meta" | "answer") {
    if (sortConfig.column === column) {
      sortConfig.direction = sortConfig.direction === "asc" ? "desc" : "asc";
    } else {
      sortConfig = { column, direction: "asc", type };
    }
    fetchResponses();
  }

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      fetchResponses();
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      fetchResponses();
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  function formatAnswerValue(question: Question, value: unknown): string {
    if (value === undefined || value === null || value === "") return "—";
    if (question.type === "image-upload") return "Image uploaded";
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  }

  async function downloadCSV() {
    try {
      const response = await fetch(`/api/responses/${formId}/csv`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        notifications.add(
          `Error downloading CSV: ${error.error || response.statusText}`,
          "error",
        );
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `form-responses-${formId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading CSV:", err);
      notifications.add("Failed to download CSV. Please try again.", "error");
    }
  }

  async function deleteAllResponses() {
    const confirmed = window.confirm(
      `Are you sure you want to delete all ${totalCount} response(s)? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/responses/${formId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete responses");

      responses = [];
      totalCount = 0;
      currentPage = 1;
    } catch (error) {
      console.error("Error deleting responses:", error);
      notifications.add("Failed to delete responses. Please try again.", "error");
    }
  }

  function togglePopover(id: string) {
    openPopoverId = openPopoverId === id ? null : id;
  }

  async function toggleCheckin(responseId: string, currentStatus: boolean) {
    try {
      // Optimistically update
      const responseIndex = responses.findIndex((r) => r.id === responseId);
      if (responseIndex !== -1) {
        responses[responseIndex].checked_in = !currentStatus;
      }

      const res = await fetch(`/api/checkin/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: responseId }),
      });

      if (!res.ok) throw new Error("Failed to update check-in");
    } catch (err) {
      console.error("Error toggling checkin:", err);
      const responseIndex = responses.findIndex((r) => r.id === responseId);
      if (responseIndex !== -1) {
        responses[responseIndex].checked_in = currentStatus;
      }
      notifications.add("Failed to update check-in status.", "error");
    }
  }
</script>

<div class="py-2">
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 class="text-2xl font-semibold tracking-tight text-[color:var(--text)]">
        Responses
      </h2>
      <p class="mt-1 text-xs muted">
        {totalCount} total response{totalCount !== 1 ? "s" : ""}
      </p>
    </div>
    {#if responses.length > 0 || Object.keys(filters).length > 0}
      <div class="flex flex-col gap-2 sm:flex-row">
        <button on:click={downloadCSV} class="btn btn-secondary btn-sm justify-center">
          <span class="fas fa-download mr-1.5"></span>
          Download CSV
        </button>
        <button on:click={deleteAllResponses} class="btn btn-danger btn-sm justify-center">
          <span class="fas fa-trash mr-1.5"></span>
          Delete All
        </button>
      </div>
    {/if}
  </div>

  <div class="surface surface-strong flex min-h-[300px] flex-col overflow-hidden">
    {#if loading && responses.length === 0}
      <div class="flex-1 flex flex-col items-center justify-center p-8">
        <div class="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--accent)]"></div>
        <p class="text-xs muted">
          Loading responses...
        </p>
      </div>
    {:else if responses.length === 0 && Object.values(filters).every((f) => !f)}
      <div
        class="flex-1 flex flex-col items-center justify-center p-8 text-center"
      >
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full border surface-muted">
          <span class="fas fa-inbox text-lg muted-soft"></span>
        </div>
        <h3 class="text-sm font-medium text-[color:var(--text)]">
          No responses yet
        </h3>
        <p class="mt-0.5 text-xs muted">
          Share your form link to start collecting responses.
        </p>
      </div>
    {:else}
      <div class="flex flex-1 flex-col md:hidden">
        <div class="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3">
          <p class="text-xs font-medium text-[color:var(--text)]">
            {responses.length} response{responses.length !== 1 ? "s" : ""} on this page
          </p>
          <p class="text-[11px] muted">
            Page {currentPage} of {Math.max(totalPages, 1)}
          </p>
        </div>

        <div class="space-y-3 p-3">
          {#each responses as response}
            <article class="rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm">
              <div class="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-soft)]">
                    Submitted
                  </p>
                  <p class="mt-1 text-sm font-medium text-[color:var(--text)]">
                    {formatDate(response.timestamp)}
                  </p>
                </div>
                {#if enableCheckin}
                  <button
                    on:click={() => toggleCheckin(response.id, !!response.checked_in)}
                    class="relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed {response.checked_in
                      ? 'bg-green-500'
                      : 'bg-gray-200 dark:bg-gray-700'}"
                    role="switch"
                    aria-checked={response.checked_in}
                  >
                    <span class="sr-only">Toggle check-in</span>
                    <span
                      aria-hidden="true"
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {response.checked_in
                        ? 'translate-x-2'
                        : '-translate-x-2'}"
                    ></span>
                  </button>
                {/if}
              </div>

              {#if enableDeviceTracking || anonymousVoting}
                <div class="mb-3">
                  <span class="inline-flex items-center gap-1.5 rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-mono font-bold tracking-wide text-indigo-700 dark:border-indigo-900/20 dark:bg-indigo-950/30 dark:text-indigo-400">
                    <i class="fas fa-fingerprint text-[10px]"></i>
                    {getVoterId(response.device_id)}
                  </span>
                </div>
              {/if}

              <dl class="space-y-3">
                {#each questionList as question}
                  <div class="space-y-1">
                    <dt class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-soft)]">
                      {question.title}
                    </dt>
                    <dd class="text-sm text-[color:var(--text)] break-words">
                      {#if response.answers[question.id] === undefined || response.answers[question.id] === null || response.answers[question.id] === ""}
                        <span class="muted">—</span>
                      {:else if question.type === "image-upload"}
                        <a
                          href={response.answers[question.id] as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1 text-[color:var(--accent)] hover:underline"
                        >
                          <span class="fas fa-image text-xs"></span>
                          <span>View image</span>
                        </a>
                      {:else}
                        {formatAnswerValue(question, response.answers[question.id])}
                      {/if}
                    </dd>
                  </div>
                {/each}
              </dl>
            </article>
          {/each}
        </div>
      </div>

      <div class="hidden overflow-x-auto flex-1 md:block">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="bg-[color:var(--surface-muted)] border-b border-[color:var(--border)]"
            >
              <th
                class="px-3 py-2 text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wider min-w-[140px]"
              >
                <div class="flex items-center justify-between group">
                  <span class="flex items-center gap-2">
                    Timestamp
                    {#if sortConfig.column === "created_at"}
                      <span
                        class="fas fa-sort-{sortConfig.direction === "asc" ? "up" : "down"} text-[color:var(--text)]"
                      ></span>
                    {/if}
                  </span>
                  <div class="relative">
                    <button
                      on:click={() => handleSort("created_at", "meta")}
                      aria-label="Sort by timestamp"
                      class="p-1 hover:bg-[color:var(--surface-strong)] rounded text-[color:var(--text-soft)] hover:text-[color:var(--text)] transition-colors"
                    >
                      <span class="fas fa-sort"></span>
                    </button>
                  </div>
                </div>
              </th>

              {#each questionList as question}
                <th
                  class="px-3 py-2 text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wider min-w-[150px]"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="truncate" title={question.title}
                      >{question.title}</span
                    >
                    <div class="relative">
                      <button
                        on:click={() => togglePopover(question.id)}
                        aria-label={`Filter responses for ${question.title}`}
                        class={`p-1.5 rounded transition-colors ${
                          filters[question.id]
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                            : "hover:bg-[color:var(--surface-strong)] text-[color:var(--text-soft)] hover:text-[color:var(--text)]"
                        }`}
                      >
                        <span class="fas fa-filter text-xs"></span>
                      </button>

                      {#if openPopoverId === question.id}
                        <div
                          class="absolute right-0 top-full mt-2 w-64 bg-[color:var(--surface-strong)] rounded-lg shadow-lg border border-[color:var(--border)] z-20 p-4"
                        >
                          <div class="space-y-4">
                            <div>
                              <label
                                for={`filter-${question.id}`}
                                class="block text-xs font-medium text-[color:var(--text)] mb-1"
                                >Filter</label
                              >
                              <div class="relative">
                                <input
                                  id={`filter-${question.id}`}
                                  type="text"
                                  placeholder="Search..."
                                  class="w-full px-3 py-2 bg-[color:var(--surface)] border border-[color:var(--border)] text-[color:var(--text)] rounded-md text-sm focus:ring-2 focus:ring-[color:var(--accent)] focus:border-transparent outline-none"
                                  value={filters[question.id] || ""}
                                  on:input={(e) =>
                                    handleFilterChange(
                                      question.id,
                                      e.currentTarget.value,
                                    )}
                                />
                                {#if filters[question.id]}
                                  <button
                                    on:click={() =>
                                      handleFilterChange(question.id, "")}
                                    aria-label="Clear filter"
                                    class="absolute right-2 top-1.5 text-[color:var(--text-soft)] hover:text-[color:var(--text)]"
                                  >
                                    <span class="fas fa-times text-xs"></span>
                                  </button>
                                {/if}
                              </div>
                            </div>
                          </div>
                          <button
                            aria-label="Close filter"
                            class="absolute top-2 right-2 text-[color:var(--text-soft)] hover:text-[color:var(--text)]"
                            on:click={() => (openPopoverId = null)}
                          >
                            <span class="fas fa-times"></span>
                          </button>
                        </div>
                        <button
                          type="button"
                          class="fixed inset-0 z-10 cursor-default"
                          aria-label="Dismiss filter"
                          on:click={() => (openPopoverId = null)}
                        ></button>
                      {/if}
                    </div>
                  </div>
                  {#if filters[question.id]}
                    <div
                      class="mt-0.5 text-[9px] text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[140px]"
                    >
                      Contains: "{filters[question.id]}"
                    </div>
                  {/if}
                </th>
              {/each}
              {#if enableDeviceTracking || anonymousVoting}
                <th
                  class="px-3 py-2 text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wider min-w-[130px]"
                >
                  <div class="flex items-center gap-2">
                    <span class="fas fa-fingerprint text-xs text-indigo-500 dark:text-indigo-400"></span>
                    <span>Voter ID</span>
                  </div>
                </th>
              {/if}
              {#if enableCheckin}
                <th
                  class="px-3 py-2 text-xs font-semibold text-[color:var(--text-soft)] uppercase tracking-wider min-w-[120px]"
                >
                  <div class="flex items-center justify-between group">
                    <span class="flex items-center gap-2"> Checked In </span>
                  </div>
                </th>
              {/if}
            </tr>
          </thead>
          <tbody class="divide-y divide-[color:var(--border)]">
            {#each responses as response}
              <tr
                class="hover:bg-[color:var(--surface-muted)] transition-colors bg-[color:var(--surface)]"
              >
                <td class="px-3 py-2 whitespace-nowrap">
                  <span
                    class="text-xs font-medium text-[color:var(--text)]"
                    >{formatDate(response.timestamp)}</span
                  >
                </td>
                {#each questionList as question}
                  <td
                    class="px-3 py-2 text-xs text-[color:var(--text)]"
                  >
                    {#if response.answers[question.id] === undefined || response.answers[question.id] === null || response.answers[question.id] === ""}
                      <span class="text-[color:var(--text-soft)] opacity-40">—</span>
                    {:else if question.type === "image-upload"}
                      {@const imageUrl = response.answers[question.id] as string}
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span class="fas fa-image text-xs"></span>
                        <span class="truncate">View Image</span>
                      </a>
                    {:else if Array.isArray(response.answers[question.id])}
                      {@const items = response.answers[question.id] as string[]}
                      <div class="flex flex-wrap gap-0.5">
                        {#each items as item}
                          <span
                            class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[color:var(--surface-strong)] text-[color:var(--text)]"
                          >
                            {item}
                          </span>
                        {/each}
                      </div>
                    {:else}
                      <span
                        class="line-clamp-1 text-xs"
                        title={String(response.answers[question.id] ?? "")}
                      >
                        {String(response.answers[question.id] ?? "")}
                      </span>
                    {/if}
                  </td>
                {/each}
                {#if enableDeviceTracking || anonymousVoting}
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wide bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20"
                    >
                      <i class="fas fa-fingerprint text-[10px]"></i>
                      {getVoterId(response.device_id)}
                    </span>
                  </td>
                {/if}
                {#if enableCheckin}
                  <td class="px-3 py-2 whitespace-nowrap">
                    <button
                      on:click={() =>
                        toggleCheckin(response.id, !!response.checked_in)}
                      class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed {response.checked_in
                        ? 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-700'}"
                      role="switch"
                      aria-checked={response.checked_in}
                    >
                      <span class="sr-only">Toggle check-in</span>
                      <span
                        aria-hidden="true"
                        class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {response.checked_in
                          ? 'translate-x-2'
                          : '-translate-x-2'}"
                      ></span>
                    </button>
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        class="bg-[color:var(--surface)] border-t border-[color:var(--border)] px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="text-xs text-[color:var(--text-soft)]">
          Showing <span class="font-medium"
            >{(currentPage - 1) * PAGE_SIZE + 1}</span
          >
          to
          <span class="font-medium"
            >{Math.min(currentPage * PAGE_SIZE, totalCount)}</span
          >
          of <span class="font-medium">{totalCount}</span> results
        </div>
        <div class="flex gap-2 self-end sm:self-auto">
          <button
            on:click={prevPage}
            disabled={currentPage === 1}
            class="px-3 py-1.5 border border-[color:var(--border)] rounded-lg text-xs font-medium text-[color:var(--text)] bg-[color:var(--surface-strong)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            on:click={nextPage}
            disabled={currentPage === totalPages}
            class="px-3 py-1.5 border border-[color:var(--border)] rounded-lg text-xs font-medium text-[color:var(--text)] bg-[color:var(--surface-strong)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
