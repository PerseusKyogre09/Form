<!-- src/lib/components/ResponseViewer.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import type { FormResponse, Question } from "../types";
  import { Button } from "bits-ui";

  export let formId: string;
  export let questions: Question[];

  let responses: FormResponse[] = [];
  let loading = true;
  let allResponses: FormResponse[] = [];
  const PAGE_SIZE = 50;

  onMount(async () => {
    await loadAllResponses();
  });

  async function loadAllResponses() {
    try {
      let allData: any[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("form_responses")
          .select("*")
          .eq("form_id", formId)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += PAGE_SIZE;
          hasMore = data.length === PAGE_SIZE;
        } else {
          hasMore = false;
        }
      }

      allResponses = allData.map((r) => ({
        ...r,
        timestamp: new Date(r.created_at).getTime(),
      })) as FormResponse[];
      responses = allResponses;
    } catch (error) {
      console.error("Error loading responses:", error);
    } finally {
      loading = false;
    }
  }

  function getQuestionTitle(questionId: string): string {
    return (
      questions.find((q) => q.id === questionId)?.title || "Unknown Question"
    );
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  function downloadCSV() {
    console.log("CSV Download: Starting download for formId:", formId);
    console.log("CSV Download: Number of responses:", responses.length);

    if (responses.length === 0) {
      console.log("CSV Download: No responses to download");
      alert("No responses to download");
      return;
    }

    try {
      console.log("CSV Download: Creating download link to:", `/api/responses/${formId}/csv`);
      // Create download link to server endpoint
      const link = document.createElement("a");
      link.href = `/api/responses/${formId}/csv`;
      link.download = `form-responses-${formId}.csv`;
      console.log("CSV Download: Link created, clicking...");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("CSV Download: Link clicked and removed");
    } catch (error) {
      console.error("CSV Download: Error in client:", error);
      alert("Failed to download CSV file");
    }
  }
</script>

<div class="max-w-6xl mx-auto">
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h2 class="text-4xl font-bold text-black mb-2">Responses</h2>
      <p class="text-gray-600">
        {responses.length} response{responses.length !== 1 ? "s" : ""}
      </p>
    </div>
    {#if responses.length > 0}
      <button
        on:click={downloadCSV}
        class="rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all cursor-pointer"
      >
        Download CSV
      </button>
    {/if}
  </div>

  {#if loading}
    <div class="text-center py-12">
      <p class="text-gray-500">Loading responses...</p>
    </div>
  {:else if responses.length === 0}
    <div class="text-center py-12">
      <p class="text-gray-500">
        No responses yet. Share your form to collect responses.
      </p>
    </div>
  {:else}
    <div class="overflow-x-auto border border-gray-200 rounded-lg">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-200">
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">
              Timestamp
            </th>
            {#each questions as question}
              <th
                class="px-6 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200 min-w-48"
              >
                {question.title}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each responses as response, idx}
            <tr
              class={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
              }`}
            >
              <td class="px-6 py-4 text-sm text-gray-700 border-r border-gray-200 whitespace-nowrap">
                <div class="font-medium">{formatDate(response.timestamp)}</div>
                <div class="text-xs text-gray-500">{response.id}</div>
              </td>
              {#each questions as question}
                <td class="px-6 py-4 text-sm text-gray-700 border-r border-gray-200">
                  {#if response.answers[question.id] === undefined || response.answers[question.id] === null || response.answers[question.id] === ""}
                    <span class="text-gray-400 italic">—</span>
                  {:else if typeof response.answers[question.id] === "string"}
                    {response.answers[question.id]}
                  {:else if typeof response.answers[question.id] === "number"}
                    {#if question.type === "rating"}
                      {"★".repeat(response.answers[question.id])} ({response.answers[question.id]}/5)
                    {:else}
                      {response.answers[question.id]}
                    {/if}
                  {:else if Array.isArray(response.answers[question.id])}
                    {response.answers[question.id].join(", ")}
                  {:else}
                    {String(response.answers[question.id])}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
