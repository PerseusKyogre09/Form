<!-- src/lib/components/FormBuilder.svelte -->
<script lang="ts">
  import { currentForm } from '../stores';
  import type { Question } from '../types';
  import QuestionEditor from './QuestionEditor.svelte';
  import { DropdownMenu } from 'bits-ui';

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
      options: (type === 'multiple-choice' || type === 'dropdown' || type === 'checkboxes') ? ['Option 1', 'Option 2'] : undefined
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

  <div class="mt-8 flex gap-2 pt-6 border-t border-gray-200">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition-colors text-sm font-medium">
        + Add question
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="bg-white border border-gray-300 rounded-md shadow-lg w-56 py-1" sideOffset={8}>
          <DropdownMenu.Item
            onSelect={() => addQuestion('text')}
            class="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer data-highlighted:bg-gray-100 transition-colors"
          >
            Short Text
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('long-text')}
            class="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer data-highlighted:bg-gray-100 transition-colors"
          >
            Long Text
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('number')}
            class="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer data-highlighted:bg-gray-100 transition-colors"
          >
            Number
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('email')}
            class="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer data-highlighted:bg-gray-100 transition-colors"
          >
            Email
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('phone')}
            class="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer data-highlighted:bg-gray-100 transition-colors"
          >
            Phone Number
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('date')}
            class="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer data-highlighted:bg-gray-100 transition-colors"
          >
            Date
          </DropdownMenu.Item>
          <DropdownMenu.Separator class="my-1 h-px bg-gray-200" />
          <DropdownMenu.Item
            onSelect={() => addQuestion('multiple-choice')}
            class="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer data-highlighted:bg-gray-100 transition-colors"
          >
            Multiple Choice
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('dropdown')}
            class="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer data-highlighted:bg-gray-100 transition-colors"
          >
            Dropdown
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('checkboxes')}
            class="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer data-highlighted:bg-gray-100 transition-colors"
          >
            Checkboxes
          </DropdownMenu.Item>
          <DropdownMenu.Separator class="my-1 h-px bg-gray-200" />
          <DropdownMenu.Item
            onSelect={() => addQuestion('yes-no')}
            class="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer data-highlighted:bg-gray-100 transition-colors"
          >
            Yes/No
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('rating')}
            class="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer data-highlighted:bg-gray-100 transition-colors"
          >
            Rating
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  </div>
</div>