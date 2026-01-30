<!-- src/lib/components/FormBuilder.svelte -->
<script lang="ts">
  import { currentForm } from '../stores';
  import type { Question } from '../types';
  import QuestionEditor from './QuestionEditor.svelte';

  export let saveForm: () => void;

  let form: { id: string; title: string; slug?: string; questions: Question[] };
  let draggedIndex: number | null = null;

  currentForm.subscribe(value => {
    form = { ...value };
  });

  function addQuestion(type: Question['type']) {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: '',
      required: false,
      options: type === 'multiple-choice' ? ['Option 1', 'Option 2'] : undefined
    };
    form.questions = [...form.questions, newQuestion];
    currentForm.set(form);
  }

  function updateForm() {
    currentForm.set(form);
  }

  function deleteQuestion(id: string) {
    form.questions = form.questions.filter(q => q.id !== id);
    updateForm();
  }

  function handleDragStart(e: DragEvent, index: number) {
    draggedIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(e: DragEvent, dropIndex: number) {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newQuestions = [...form.questions];
      const draggedQuestion = newQuestions[draggedIndex];
      
      newQuestions.splice(draggedIndex, 1);
      newQuestions.splice(dropIndex, 0, draggedQuestion);
      
      form.questions = newQuestions;
      updateForm();
    }
    draggedIndex = null;
  }

  function handleDragEnd() {
    draggedIndex = null;
  }
</script>

<div>
  <div class="mb-8">
    <input bind:value={form.title} on:input={updateForm} placeholder="Untitled form" class="text-4xl font-bold text-black border-none outline-none placeholder-gray-300 w-full" />
    <div class="mt-4 flex gap-4 items-center">
      <label class="text-sm font-medium text-gray-700">
        Link identifier (optional):
      </label>
      <input 
        bind:value={form.slug} 
        on:input={updateForm} 
        placeholder="e.g., data-class" 
        class="text-sm px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black" 
      />
      {#if form.slug}
        <span class="text-xs text-gray-600">
          Link: localhost:5173/form/{form.slug}
        </span>
      {/if}
    </div>
  </div>

  <div class="space-y-4">
    {#each form.questions as question, idx (question.id)}
      <div on:dragover={handleDragOver} on:drop={(e) => handleDrop(e, idx)} class={draggedIndex === idx ? 'opacity-50' : ''}>
        <QuestionEditor 
          {question} 
          questionNumber={idx + 1} 
          on:update={updateForm} 
          on:delete={() => deleteQuestion(question.id)}
          on:dragstart={(e) => handleDragStart(e.detail, idx)}
          on:dragend={handleDragEnd}
        />
      </div>
    {/each}
  </div>

  {#if form.questions.length === 0}
    <div class="text-center py-12 text-gray-400">
      <p>No questions yet. Start adding questions below.</p>
    </div>
  {/if}

  <div class="mt-8 flex flex-wrap gap-2 pt-6 border-t border-gray-200">
    <button on:click={() => addQuestion('text')} class="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
      + Short Text
    </button>
    <button on:click={() => addQuestion('multiple-choice')} class="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
      + Multiple Choice
    </button>
    <button on:click={() => addQuestion('yes-no')} class="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
      + Yes/No
    </button>
    <button on:click={() => addQuestion('rating')} class="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
      + Rating
    </button>
  </div>
</div>