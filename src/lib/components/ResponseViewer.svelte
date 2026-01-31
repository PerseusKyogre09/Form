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
    if (responses.length === 0) {
      alert("No responses to download");
      return;
    }

    try {
      // Create CSV header
      const headers = ["Timestamp", "Response ID", ...questions.map((q) => q.title)];
      const rows = [
        headers.map((h) => `"${h}"`).join(","),
      ];

      // Add data rows
      responses.forEach((response) => {
        const cells = [
          `"${formatDate(response.timestamp)}"`,
          `"${response.id}"`,
        ];

        questions.forEach((q) => {
          const answer = response.answers[q.id];
          let value = "";
          
          if (answer === undefined || answer === null || answer === "") {
            value = "";
          } else if (typeof answer === "string") {
            value = answer;
          } else if (typeof answer === "number") {
            if (q.type === "rating") {
              value = `${answer}/5`;
            } else {
              value = String(answer);
            }
          } else if (Array.isArray(answer)) {
            value = answer.join("; ");
          } else {
            value = String(answer);
          }
          
          // Escape quotes in CSV values
          cells.push(`"${value.replace(/"/g, '""')}"`);
        });

        rows.push(cells.join(","));
      });

      const csvContent = rows.join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `form-responses-${formId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV:", error);
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
      <Button.Root
        on:click={downloadCSV}
        class="rounded-xl bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
      >
        Download CSV
      </Button.Root>
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
