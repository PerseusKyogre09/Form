<!-- src/lib/components/ResponseViewer.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import type { FormResponse, FormElement, Question } from "../types";
  import { isQuestionElement } from "../types";
  import { Button } from "bits-ui";

  export let formId: string;
  export let questions: FormElement[] = [];

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

  function downloadCSV() {
    const link = document.createElement("a");
    link.href = `/api/responses/${formId}/csv`;
    link.download = `form-responses-${formId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function togglePopover(id: string) {
    if (openPopoverId === id) {
      openPopoverId = null;
    } else {
      openPopoverId = id;
    }
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold text-gray-900 tracking-tight">Responses</h2>
      <p class="text-sm text-gray-500 mt-1">
        {totalCount} total response{totalCount !== 1 ? "s" : ""}
      </p>
    </div>
    {#if responses.length > 0 || Object.keys(filters).length > 0}
      <button
        on:click={downloadCSV}
        class="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
      >
        <span class="fas fa-download mr-2"></span>
        Download CSV
      </button>
    {/if}
  </div>

  <div
    class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]"
  >
    {#if loading && responses.length === 0}
      <div class="flex-1 flex flex-col items-center justify-center p-12">
        <div
          class="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"
        ></div>
        <p class="text-gray-500">Loading responses...</p>
      </div>
    {:else if responses.length === 0 && Object.values(filters).every((f) => !f)}
      <div
        class="flex-1 flex flex-col items-center justify-center p-12 text-center"
      >
        <div
          class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"
        >
          <span class="fas fa-inbox text-gray-300 text-2xl"></span>
        </div>
        <h3 class="text-lg font-medium text-gray-900">No responses yet</h3>
        <p class="text-gray-500 mt-1">
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
                class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]"
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
                  class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[250px]"
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
                      class="mt-1 text-[10px] text-indigo-600 font-medium truncate max-w-[200px]"
                    >
                      Contains: "{filters[question.id]}"
                    </div>
                  {/if}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each responses as response}
              <tr class="hover:bg-gray-50/50 transition-colors bg-white">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-900"
                      >{formatDate(response.timestamp)}</span
                    >
                    <span
                      class="text-xs text-gray-400 font-mono mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >{response.id.slice(0, 8)}...</span
                    >
                  </div>
                </td>
                {#each questionList as question}
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {#if response.answers[question.id] === undefined || response.answers[question.id] === null || response.answers[question.id] === ""}
                      <span class="text-gray-300">—</span>
                    {:else if Array.isArray(response.answers[question.id])}
                      <div class="flex flex-wrap gap-1">
                        {#each response.answers[question.id] as item}
                          <span
                            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {item}
                          </span>
                        {/each}
                      </div>
                    {:else}
                      <span
                        class="line-clamp-2"
                        title={String(response.answers[question.id] ?? "")}
                      >
                        {String(response.answers[question.id] ?? "")}
                      </span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        class="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between"
      >
        <div class="text-sm text-gray-500">
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
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            on:click={nextPage}
            disabled={currentPage === totalPages}
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
