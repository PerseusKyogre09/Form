<!-- src/lib/components/ResponseViewer.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import type { FormResponse, FormElement, Question } from "../types";
  import { isQuestionElement } from "../types";
  import { Button } from "bits-ui";

  export let formId: string;
  export let questions: FormElement[] = [];
  export let enableCheckin: boolean = false;

  let questionList: Question[] = [];
  $: questionList = questions.filter(isQuestionElement);

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

  // Format: { [questionId]: filterString }
  let filters: Record<string, string> = {};
  // Track which popover is open
  let openPopoverId: string | null = null;

  // Debounce for text inputs
  let filterTimeout: ReturnType<typeof setTimeout>;

  onMount(async () => {
    await fetchResponses();
  });

  async function fetchResponses() {
    loading = true;
    try {
      // Check if we have any active filters
      const activeFilters = Object.entries(filters).filter(
        ([_, value]) => value,
      );

      if (activeFilters.length > 0) {
        // Use RPC function for filtered queries (more reliable with JSONB)
        // For simplicity, we'll only support one filter at a time initially
        const [key, value] = activeFilters[0];

        const { data, error } = await supabase.rpc("filter_form_responses", {
          p_form_id: formId,
          p_question_id: key === "id" || key === "created_at" ? null : key,
          p_filter_value: value,
          p_limit: PAGE_SIZE,
          p_offset: (currentPage - 1) * PAGE_SIZE,
        });

        if (error) throw error;

        if (data) {
          responses = data.map((r: any) => ({
            ...r,
            timestamp: new Date(r.created_at).getTime(),
          })) as FormResponse[];

          // For count, we'll need to make a separate count query
          const { count } = await supabase
            .from("form_responses")
            .select("*", { count: "exact", head: true })
            .eq("form_id", formId);
          totalCount = count || 0;
        }
      } else {
        // No filters - use standard query
        let query = supabase
          .from("form_responses")
          .select("*", { count: "exact" })
          .eq("form_id", formId);

        // Apply Sorting
        if (sortConfig.column === "created_at") {
          query = query.order("created_at", {
            ascending: sortConfig.direction === "asc",
          });
        } else {
          query = query.order(sortConfig.column, {
            ascending: sortConfig.direction === "asc",
          });
        }

        // Apply Pagination
        const from = (currentPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        if (data) {
          responses = data.map((r) => ({
            ...r,
            timestamp: new Date(r.created_at).getTime(),
          })) as FormResponse[];
          totalCount = count || 0;
        }
      }
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
      currentPage = 1; // Reset to page 1 on filter
      fetchResponses();
    }, 500); // 500ms debounce
  }

  function handleSort(column: string, type: "meta" | "answer") {
    if (sortConfig.column === column) {
      // Toggle direction
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

  async function downloadCSV() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        alert("Not authenticated. Please log in again.");
        return;
      }

      const response = await fetch(`/api/responses/${formId}/csv`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(`Error downloading CSV: ${error.error || response.statusText}`);
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
      alert("Failed to download CSV. Please try again.");
    }
  }

  async function deleteAllResponses() {
    const confirmed = window.confirm(
      `Are you sure you want to delete all ${totalCount} response(s)? This action cannot be undone and will free up storage space.`,
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("form_responses")
        .delete()
        .eq("form_id", formId);

      if (error) throw error;

      // Refresh responses list
      responses = [];
      totalCount = 0;
      currentPage = 1;
      await fetchResponses();
    } catch (error) {
      console.error("Error deleting responses:", error);
      alert("Failed to delete responses. Please try again.");
    }
  }

  function togglePopover(id: string) {
    if (openPopoverId === id) {
      openPopoverId = null;
    } else {
      openPopoverId = id;
    }
  }

  async function toggleCheckin(responseId: string, currentStatus: boolean) {
    try {
      // Optimistically update
      const responseIndex = responses.findIndex((r) => r.id === responseId);
      if (responseIndex !== -1) {
        responses[responseIndex].checked_in = !currentStatus;
      }

      const { error } = await supabase
        .from("form_responses")
        .update({ checked_in: !currentStatus })
        .eq("id", responseId);

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Error toggling checkin:", err);
      // Revert optimistic update
      const responseIndex = responses.findIndex((r) => r.id === responseId);
      if (responseIndex !== -1) {
        responses[responseIndex].checked_in = currentStatus;
      }
      alert("Failed to update check-in status.");
    }
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Responses</h2>
      <p class="text-xs text-gray-500 mt-1">
        {totalCount} total response{totalCount !== 1 ? "s" : ""}
      </p>
    </div>
    {#if responses.length > 0 || Object.keys(filters).length > 0}
      <div class="flex gap-2">
        <button
          on:click={downloadCSV}
          class="inline-flex items-center px-3 py-2 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          <span class="fas fa-download mr-1.5"></span>
          Download CSV
        </button>
        <button
          on:click={deleteAllResponses}
          class="inline-flex items-center px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <span class="fas fa-trash mr-1.5"></span>
          Delete All
        </button>
      </div>
    {/if}
  </div>

  <div
    class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[300px]"
  >
    {#if loading && responses.length === 0}
      <div class="flex-1 flex flex-col items-center justify-center p-8">
        <div
          class="w-6 h-6 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-2"
        ></div>
        <p class="text-xs text-gray-500">Loading responses...</p>
      </div>
    {:else if responses.length === 0 && Object.values(filters).every((f) => !f)}
      <div
        class="flex-1 flex flex-col items-center justify-center p-8 text-center"
      >
        <div
          class="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3"
        >
          <span class="fas fa-inbox text-gray-300 text-lg"></span>
        </div>
        <h3 class="text-sm font-medium text-gray-900">No responses yet</h3>
        <p class="text-xs text-gray-500 mt-0.5">
          Share your form link to start collecting responses.
        </p>
      </div>
    {:else}
      <div class="overflow-x-auto flex-1">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50 border-b border-gray-200">
              <!-- Timestamp Header -->
              <th
                class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]"
              >
                <div class="flex items-center justify-between group">
                  <span class="flex items-center gap-2">
                    Timestamp
                    {#if sortConfig.column === "created_at"}
                      <span
                        class={`fas fa-sort-${sortConfig.direction === "asc" ? "up" : "down"} text-gray-800`}
                      ></span>
                    {/if}
                  </span>

                  <div class="relative">
                    <button
                      on:click={() => handleSort("created_at", "meta")}
                      class="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <span class="fas fa-sort"></span>
                    </button>
                  </div>
                </div>
              </th>

              <!-- Question Headers -->
              {#each questionList as question}
                <th
                  class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="truncate" title={question.title}
                      >{question.title}</span
                    >
                    <!-- Filter/Sort Trigger -->
                    <div class="relative">
                      <button
                        on:click={() => togglePopover(question.id)}
                        class={`p-1.5 rounded transition-colors ${
                          filters[question.id]
                            ? "bg-indigo-50 text-indigo-600"
                            : "hover:bg-gray-200 text-gray-400 hover:text-gray-700"
                        }`}
                      >
                        <span class="fas fa-filter text-xs"></span>
                      </button>

                      <!-- Custom Popover Implementation -->
                      {#if openPopoverId === question.id}
                        <div
                          class="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 p-4"
                        >
                          <div class="space-y-4">
                            <div>
                              <label
                                class="block text-xs font-medium text-gray-700 mb-1"
                                >Filter</label
                              >
                              <div class="relative">
                                <input
                                  type="text"
                                  placeholder="Search..."
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
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
                                    class="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                                  >
                                    <span class="fas fa-times text-xs"></span>
                                  </button>
                                {/if}
                              </div>
                            </div>
                          </div>

                          <!-- Click outside to close (simple overlay for now or rely on specific close) -->
                          <button
                            class="absolute top-2 right-2 text-gray-300 hover:text-gray-500"
                            on:click={() => (openPopoverId = null)}
                          >
                            <span class="fas fa-times"></span>
                          </button>
                        </div>
                        <!-- Backdrop to close -->
                        <div
                          class="fixed inset-0 z-10"
                          on:click={() => (openPopoverId = null)}
                          style="cursor: default;"
                        ></div>
                      {/if}
                    </div>
                  </div>
                  {#if filters[question.id]}
                    <div
                      class="mt-0.5 text-[9px] text-indigo-600 font-medium truncate max-w-[140px]"
                    >
                      Contains: "{filters[question.id]}"
                    </div>
                  {/if}
                </th>
              {/each}
              {#if enableCheckin}
                <th
                  class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]"
                >
                  <div class="flex items-center justify-between group">
                    <span class="flex items-center gap-2"> Checked In </span>
                  </div>
                </th>
              {/if}
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each responses as response}
              <tr class="hover:bg-gray-50/50 transition-colors bg-white">
                <td class="px-3 py-2 whitespace-nowrap">
                  <span class="text-xs font-medium text-gray-900"
                    >{formatDate(response.timestamp)}</span
                  >
                </td>
                {#each questionList as question}
                  <td class="px-3 py-2 text-xs text-gray-700">
                    {#if response.answers[question.id] === undefined || response.answers[question.id] === null || response.answers[question.id] === ""}
                      <span class="text-gray-300">—</span>
                    {:else if Array.isArray(response.answers[question.id])}
                      <div class="flex flex-wrap gap-0.5">
                        {#each response.answers[question.id] as item}
                          <span
                            class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
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
                {#if enableCheckin}
                  <td class="px-3 py-2 whitespace-nowrap">
                    <button
                      on:click={() =>
                        toggleCheckin(response.id, !!response.checked_in)}
                      class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed {response.checked_in
                        ? 'bg-green-500'
                        : 'bg-gray-200'}"
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
        class="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between"
      >
        <div class="text-xs text-gray-500">
          Showing <span class="font-medium"
            >{(currentPage - 1) * PAGE_SIZE + 1}</span
          >
          to
          <span class="font-medium"
            >{Math.min(currentPage * PAGE_SIZE, totalCount)}</span
          >
          of <span class="font-medium">{totalCount}</span> results
        </div>
        <div class="flex gap-2">
          <button
            on:click={prevPage}
            disabled={currentPage === 1}
            class="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            on:click={nextPage}
            disabled={currentPage === totalPages}
            class="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
