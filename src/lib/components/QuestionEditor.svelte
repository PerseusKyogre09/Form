<!-- src/lib/components/QuestionEditor.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Question } from '../types';

  export let question: Question;
  export let questionNumber: number;

  const dispatch = createEventDispatcher();

  function updateQuestion() {
    dispatch('update');
  }

  function addOption() {
    if (question.options) {
      question.options = [...question.options, ''];
      updateQuestion();
    }
  }

  function removeOption(index: number) {
    if (question.options) {
      question.options.splice(index, 1);
      question.options = [...question.options];
      updateQuestion();
    }
  }

  const typeLabels = {
    text: 'Short Text',
    'multiple-choice': 'Multiple Choice',
    'yes-no': 'Yes/No',
    rating: 'Rating'
  };
</script>

<div class="border border-gray-200 rounded-lg p-6 bg-white hover:border-gray-300 transition-colors group">
  <div class="flex items-start gap-4 mb-4">
    <div class="text-gray-400 cursor-grab active:cursor-grabbing group-hover:text-gray-600 transition-colors" draggable="true" on:dragstart={(e) => { e.dataTransfer.effectAllowed = 'move'; dispatch('dragstart', e); }} on:dragend={(e) => dispatch('dragend', e)}>
      ⋮⋮
    </div>
    <div class="flex-1">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-sm text-gray-500">Q{questionNumber}</span>
        <select bind:value={question.type} on:change={updateQuestion} class="text-sm border border-gray-300 rounded px-2 py-1 text-gray-700 bg-white">
          <option value="text">Short Text</option>
          <option value="multiple-choice">Multiple Choice</option>
          <option value="yes-no">Yes/No</option>
          <option value="rating">Rating</option>
        </select>
        <label class="ml-auto flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={question.required} on:change={updateQuestion} class="w-4 h-4 rounded cursor-pointer" />
          <span class="text-gray-600">Required</span>
        </label>
        <button on:click={() => dispatch('delete')} class="text-red-500 hover:text-red-700">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
        </button>
      </div>
      <input bind:value={question.title} on:input={updateQuestion} placeholder="Question" class="w-full text-lg font-medium text-gray-900 border-none outline-none placeholder-gray-300 bg-transparent" />
    </div>
  </div>

  {#if question.type === 'multiple-choice'}
    <div class="ml-10 space-y-2">
      <p class="text-sm text-gray-500 font-medium mb-3">Options</p>
      {#each question.options || [] as option, i}
        <div class="flex gap-2 items-center">
          <input bind:value={option} on:input={updateQuestion} placeholder="Option" class="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 text-sm" />
          <button on:click={() => removeOption(i)} class="text-red-500 hover:text-red-700">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
          </button>
        </div>
      {/each}
      <button on:click={addOption} class="text-sm text-gray-600 hover:text-gray-900 mt-2 font-medium">+ Add option</button>
    </div>
  {/if}
</div>