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
  let loadingMore = false;
  let hasMore = true;
  const PAGE_SIZE = 50;
  let selectedResponseId: string | null = null;

  onMount(async () => {
    await loadResponses();
  });

  async function loadResponses() {
    try {
      const { data, error } = await supabase
        .from("form_responses")
        .select("*")
        .eq("form_id", formId)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;

      // Map Supabase fields to the component's expected format
      responses = (data || []).map((r) => ({
        ...r,
        timestamp: new Date(r.created_at).getTime(),
      })) as FormResponse[];
      hasMore = data && data.length === PAGE_SIZE;
    } catch (error) {
      console.error("Error loading responses:", error);
    } finally {
      loading = false;
    }
  }

  async function loadMoreResponses() {
    if (loadingMore || !hasMore) return;

    loadingMore = true;
    try {
      const { data, error } = await supabase
        .from("form_responses")
        .select("*")
        .eq("form_id", formId)
        .order("created_at", { ascending: false })
        .range(responses.length, responses.length + PAGE_SIZE - 1);

      if (error) throw error;
      if (data && data.length > 0) {
        const newResponses = (data || []).map((r) => ({
          ...r,
          timestamp: new Date(r.created_at).getTime(),
        })) as FormResponse[];
        responses = [...responses, ...newResponses];
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error("Error loading more responses:", error);
    } finally {
      loadingMore = false;
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

  function toggleResponse(responseId: string) {
    selectedResponseId = selectedResponseId === responseId ? null : responseId;
  }

  function getSelectedResponse(): FormResponse | undefined {
    return responses.find((r) => r.id === selectedResponseId);
  }
</script>

<div class="max-w-4xl mx-auto">
  <div class="mb-8">
    <h2 class="text-4xl font-bold text-black mb-2">Responses</h2>
    <p class="text-gray-600">
      {responses.length} response{responses.length !== 1 ? "s" : ""}
    </p>
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
    <div class="space-y-3">
      {#each responses as response}
        <Button.Root
          on:click={() => toggleResponse(response.id)}
          class="w-full text-left px-6 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors {selectedResponseId ===
          response.id
            ? 'bg-gray-50 border-black'
            : ''} rounded-input bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-gray-900">
                {formatDate(response.timestamp)}
              </p>
              <p class="text-xs text-gray-500">ID: {response.id}</p>
            </div>
            <div class="text-gray-400">
              {selectedResponseId === response.id ? "▼" : "▶"}
            </div>
          </div>
        </Button.Root>

        {#if selectedResponseId === response.id}
          <div
            class="border border-gray-200 rounded-lg p-6 bg-white space-y-4 mb-3"
          >
            {#each questions as question}
              {@const answer = response.answers[question.id]}
              <div
                class="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                <p class="font-semibold text-gray-900 mb-2">{question.title}</p>
                <p class="text-gray-700">
                  {#if answer === undefined || answer === null || answer === ""}
                    <span class="text-gray-400">__________</span>
                  {:else if typeof answer === "string"}
                    {answer}
                  {:else if typeof answer === "number"}
                    {#if question.type === "rating"}
                      {"★".repeat(answer)} ({answer}/5)
                    {:else}
                      {answer}
                    {/if}
                  {:else}
                    {String(answer)}
                  {/if}
                </p>
              </div>
            {/each}
          </div>
        {/if}
      {/each}
    </div>
    {#if hasMore}
      <div class="text-center mt-8">
        <Button.Root
          on:click={loadMoreResponses}
          disabled={loadingMore}
          class="rounded-input bg-black text-white shadow-mini hover:bg-black/95 inline-flex
	h-12 items-center justify-center px-[21px] text-[15px]
	font-semibold active:scale-[0.98] active:transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingMore ? "Loading..." : "Load More Responses"}
        </Button.Root>
      </div>
    {/if}
  {/if}
</div>
