<!-- src/lib/components/FormBuilder.svelte -->
<script lang="ts">
  import { currentForm } from '../stores';
  import type { Question, FormElement, AnimationElement } from '../types';
  import { isAnimationElement } from '../types';
  import QuestionEditor from './QuestionEditor.svelte';
  import AnimationEditor from './AnimationEditor.svelte';
  import { DropdownMenu } from 'bits-ui';

  export let saveForm: () => void;

  let form: { id: string; title: string; slug?: string; questions: FormElement[] };
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
      exitAnimation: 'slideRight',
      options: (type === 'multiple-choice' || type === 'dropdown' || type === 'checkboxes') ? ['Option 1', 'Option 2'] : undefined
    };
    form.questions = [...form.questions, newQuestion];
    currentForm.set(form);
  }

  function createAnimationBlock(): AnimationElement {
    return {
      id: Date.now().toString(),
      kind: 'animation',
      title: 'Animated moment',
      description: 'Share a quick animation or logo',
      assetUrl: '',
      animationType: 'fade',
      repeatMode: 'once',
      repeatCount: 1,
      backgroundColor: 'transparent',
      autoAdvanceDelay: 3,
      enableAutoAdvance: false
    };
  }

  function addAnimation() {
    form.questions = [...form.questions, createAnimationBlock()];
    currentForm.set(form);
  }

  function updateForm() {
    currentForm.set(form);
  }

  function deleteElement(id: string) {
    form.questions = form.questions.filter(q => q.id !== id);
    updateForm();
  }

  function getQuestionNumber(index: number) {
    return form.questions.slice(0, index + 1).reduce((count, item) => {
      return isAnimationElement(item) ? count : count + 1;
    }, 0);
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
  <div class="mb-12 pb-8 border-b border-gray-200">
    <div class="space-y-4">
      <div>
        <input bind:value={form.title} on:input={updateForm} placeholder="Untitled form" class="text-5xl font-bold text-gray-900 border-none outline-none placeholder-gray-400 w-full leading-tight" />
        <p class="text-sm text-gray-500 mt-2">Give your form a descriptive title</p>
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-sm font-semibold text-gray-700">
          Link identifier (optional)
        </label>
        <input 
          bind:value={form.slug} 
          on:input={updateForm} 
          placeholder="e.g., data-class" 
          class="text-sm px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
        />
        {#if form.slug}
          <span class="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md font-mono">
            localhost:5173/form/{form.slug}
          </span>
        {/if}
      </div>
    </div>
  </div>

  <div class="space-y-6">
    {#each form.questions as element, idx (element.id)}
      <div on:dragover={handleDragOver} on:drop={(e) => handleDrop(e, idx)} class={draggedIndex === idx ? 'opacity-50' : ''}>
        {#if isAnimationElement(element)}
          <AnimationEditor
            animation={element}
            on:update={updateForm}
            on:delete={() => deleteElement(element.id)}
            on:dragstart={(e) => handleDragStart(e.detail, idx)}
            on:dragend={handleDragEnd}
          />
        {:else}
          <QuestionEditor 
            question={element}
            questionNumber={getQuestionNumber(idx)} 
            on:update={updateForm} 
            on:delete={() => deleteElement(element.id)}
            on:dragstart={(e) => handleDragStart(e.detail, idx)}
            on:dragend={handleDragEnd}
          />
        {/if}
      </div>
    {/each}
  </div>

  {#if form.questions.length === 0}
    <div class="border-2 border-dashed border-gray-300 rounded-lg p-16 text-center bg-gray-50">
      <div class="mb-4">
        <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-1">No questions yet</h3>
      <p class="text-gray-600 mb-6">Start building your form by adding your first question</p>
    </div>
  {/if}

  <div class="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-3">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Question
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="bg-white border border-gray-200 rounded-xl shadow-xl w-64 py-2 z-50" sideOffset={12}>
          <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Input Fields</div>
          <DropdownMenu.Item
            onSelect={() => addQuestion('text')}
            class="px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer data-highlighted:bg-blue-50 transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Short Text
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('long-text')}
            class="px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer data-highlighted:bg-blue-50 transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Long Text
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('number')}
            class="px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer data-highlighted:bg-blue-50 transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Number
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('email')}
            class="px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer data-highlighted:bg-blue-50 transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('phone')}
            class="px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer data-highlighted:bg-blue-50 transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Phone Number
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('date')}
            class="px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer data-highlighted:bg-blue-50 transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Date
          </DropdownMenu.Item>
          <DropdownMenu.Separator class="my-2 h-px bg-gray-100" />
          <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Selection</div>
          <DropdownMenu.Item
            onSelect={() => addQuestion('multiple-choice')}
            class="px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer data-highlighted:bg-blue-50 transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Multiple Choice
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('dropdown')}
            class="px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer data-highlighted:bg-blue-50 transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Dropdown
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('checkboxes')}
            class="px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer data-highlighted:bg-blue-50 transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Checkboxes
          </DropdownMenu.Item>
          <DropdownMenu.Separator class="my-2 h-px bg-gray-100" />
          <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Special</div>
          <DropdownMenu.Item
            onSelect={() => addQuestion('yes-no')}
            class="px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer data-highlighted:bg-blue-50 transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Yes/No
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => addQuestion('rating')}
            class="px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer data-highlighted:bg-blue-50 transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Rating
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
      <button
        on:click={addAnimation}
        class="inline-flex items-center gap-2 px-5 py-3 border border-dashed border-purple-300 text-purple-700 rounded-lg text-sm font-semibold hover:border-purple-400 hover:text-purple-800 transition-all duration-200"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 4v16"></path>
          <path d="M4 12h16"></path>
          <path d="M16 7l3.5 3.5" stroke-dasharray="4 2"></path>
          <path d="M8 17l-3.5-3.5" stroke-dasharray="4 2"></path>
        </svg>
        Add Animation
      </button>
  </div>
</div>