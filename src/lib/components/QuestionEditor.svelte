<!-- src/lib/components/QuestionEditor.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Question, Constraint, AnimationType } from '../types';

  export let question: Question;
  export let questionNumber: number;

  const dispatch = createEventDispatcher();
  let showConstraintDropdown = false;

  const animationOptions: { value: AnimationType; label: string }[] = [
    { value: 'fade', label: 'Fade' },
    { value: 'slide', label: 'Slide Up' },
    { value: 'pulse', label: 'Pulse' },
    { value: 'bounce', label: 'Bounce' },
    { value: 'zoom', label: 'Zoom' },
    { value: 'flip', label: 'Flip' },
    { value: 'rotate', label: 'Rotate' },
    { value: 'slideLeft', label: 'Slide Left' },
    { value: 'slideRight', label: 'Slide Right' },
    { value: 'wobble', label: 'Wobble' },
    { value: 'heartbeat', label: 'Heartbeat' },
    { value: 'swing', label: 'Swing' },
    { value: 'tada', label: 'Tada' },
    { value: 'jello', label: 'Jello' },
    { value: 'blink', label: 'Blink' }
  ];

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

  function addConstraint(type: string) {
    if (!question.constraints) {
      question.constraints = [];
    }
    
    let newConstraint: Constraint = {
      id: Date.now().toString(),
      type: type as any,
      value: type === 'email-type' ? 'edu' : type === 'custom-regex' ? { pattern: '', description: '' } : []
    };
    
    question.constraints = [...question.constraints, newConstraint];
    showConstraintDropdown = false;
    updateQuestion();
  }

  function removeConstraint(id: string) {
    if (question.constraints) {
      question.constraints = question.constraints.filter(c => c.id !== id);
      updateQuestion();
    }
  }

  function updateConstraintValue(constraint: Constraint, newValue: any) {
    constraint.value = newValue;
    updateQuestion();
  }

  const typeLabels = {
    text: 'Short Text',
    'long-text': 'Long Text',
    number: 'Number',
    email: 'Email',
    phone: 'Phone Number',
    date: 'Date',
    'multiple-choice': 'Multiple Choice',
    dropdown: 'Dropdown',
    checkboxes: 'Checkboxes',
    'yes-no': 'Yes/No',
    rating: 'Rating'
  };

  const constraintLabels = {
    'email-type': 'Email Type (edu/work)',
    'email-domain': 'Email Domain Whitelist',
    'number-format': 'Number Format (Phone, PIN, Aadhar, etc.)',
    'custom-regex': 'Custom Pattern (Regex)'
  };

  function getAvailableConstraints() {
    if (question.type === 'email') {
      return [
        { value: 'email-type', label: 'Email Type (edu/work)' },
        { value: 'email-domain', label: 'Email Domain Whitelist' }
      ];
    } else if (question.type === 'number') {
      return [
        { value: 'number-format', label: 'Number Format (Phone, PIN, Aadhar, etc.)' }
      ];
    } else if (question.type === 'text' || question.type === 'long-text') {
      return [
        { value: 'custom-regex', label: 'Custom Pattern (Regex)' }
      ];
    }
    return [];
  }
</script>

<div class="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200 group">
  <div class="flex items-start gap-4 mb-4">
    <div class="flex-shrink-0 pt-1">
      <div class="text-gray-300 cursor-grab active:cursor-grabbing group-hover:text-gray-400 transition-colors text-lg" draggable="true" on:dragstart={(e) => { e.dataTransfer.effectAllowed = 'move'; dispatch('dragstart', e); }} on:dragend={(e) => dispatch('dragend', e)}>
        ⋮⋮
      </div>
    </div>
    <div class="flex-1 space-y-3">
      <div class="flex flex-wrap items-center gap-3">
        <span class="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full">Q{questionNumber}</span>
        <select bind:value={question.type} on:change={updateQuestion} class="text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
          <option value="text">Short Text</option>
          <option value="long-text">Long Text</option>
          <option value="number">Number</option>
          <option value="email">Email</option>
          <option value="phone">Phone Number</option>
          <option value="date">Date</option>
          <option value="multiple-choice">Multiple Choice</option>
          <option value="dropdown">Dropdown</option>
          <option value="checkboxes">Checkboxes</option>
          <option value="yes-no">Yes/No</option>
          <option value="rating">Rating</option>
        </select>
        <label class="ml-auto flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" bind:checked={question.required} on:change={updateQuestion} class="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600" />
          <span class="text-gray-700 font-medium">Required</span>
        </label>
        <select bind:value={question.exitAnimation} on:change={updateQuestion} class="text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
          {#each animationOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
        <button on:click={() => dispatch('delete')} class="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" aria-label="Delete question">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
        </button>
      </div>
      <input bind:value={question.title} on:input={updateQuestion} placeholder="Enter your question here" class="w-full text-xl font-semibold text-gray-900 border-none outline-none placeholder-gray-400 bg-transparent" />
    </div>
  </div>

  {#if question.type === 'multiple-choice' || question.type === 'dropdown' || question.type === 'checkboxes'}
    <div class="ml-10 mt-6 space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
      <p class="text-sm font-semibold text-gray-700">Options</p>
      {#each question.options || [] as option, i}
        <div class="flex gap-2 items-center">
          <input bind:value={option} on:input={updateQuestion} placeholder="Add an option..." class="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all" />
          <button on:click={() => removeOption(i)} class="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" aria-label="Delete option">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
          </button>
        </div>
      {/each}
      <button on:click={addOption} class="text-sm text-blue-600 hover:text-blue-700 font-semibold mt-3 flex items-center gap-2 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add option
      </button>
    </div>
  {:else if question.type === 'number'}
    <div class="ml-10 mt-6 space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
      <p class="text-sm font-semibold text-gray-700">Range Settings</p>
      <div class="flex gap-4">
        <div class="flex-1">
          <label for="min-input" class="block text-xs font-medium text-gray-600 mb-2">Minimum</label>
          <input id="min-input" type="number" bind:value={question.min} on:input={updateQuestion} placeholder="0" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all" />
        </div>
        <div class="flex-1">
          <label for="max-input" class="block text-xs font-medium text-gray-600 mb-2">Maximum</label>
          <input id="max-input" type="number" bind:value={question.max} on:input={updateQuestion} placeholder="100" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all" />
        </div>
      </div>
    </div>
  {:else if question.type === 'text' || question.type === 'long-text' || question.type === 'email' || question.type === 'phone'}
    <div class="ml-10 mt-6 space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
      <p class="text-sm font-semibold text-gray-700">Placeholder Text</p>
      <input bind:value={question.placeholder} on:input={updateQuestion} placeholder="e.g., Enter your answer..." class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all" />
    </div>
  {/if}

  {#if getAvailableConstraints().length > 0}
    <div class="ml-10 mt-6 space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold text-gray-700">Constraints (Optional)</p>
        <div class="relative">
          <button 
            on:click={() => showConstraintDropdown = !showConstraintDropdown}
            class="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add constraint
          </button>
          {#if showConstraintDropdown}
            <div class="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
              {#each getAvailableConstraints() as constraint}
                <button
                  on:click={() => addConstraint(constraint.value)}
                  class="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm text-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
                >
                  {constraint.label}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      {#each question.constraints || [] as constraint (constraint.id)}
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-blue-900">
              {constraintLabels[constraint.type as keyof typeof constraintLabels] || constraint.type}
            </span>
            <button on:click={() => removeConstraint(constraint.id)} class="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors" aria-label="Remove constraint">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
            </button>
          </div>

          {#if constraint.type === 'email-type'}
            <select 
              value={constraint.value}
              on:change={(e) => updateConstraintValue(constraint, e.target.value)}
              class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="edu">Educational (.edu, .edu.in, .ac.in, etc.)</option>
              <option value="work">Work Email</option>
            </select>
            {#if constraint.value === 'work'}
              <input 
                type="text"
                placeholder="Comma-separated domains (e.g., company.com, company.co.uk)"
                on:blur={(e) => {
                  const domains = (e.target as HTMLInputElement).value.split(',').map(d => d.trim());
                  updateConstraintValue(constraint, { type: 'work', domains });
                }}
                class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            {/if}
          {:else if constraint.type === 'email-domain'}
            <input 
              type="text"
              placeholder="Comma-separated domains (e.g., domain1.com, domain2.com)"
              value={Array.isArray(constraint.value) ? constraint.value.join(', ') : ''}
              on:blur={(e) => {
                const domains = (e.target as HTMLInputElement).value.split(',').map(d => d.trim()).filter(d => d);
                updateConstraintValue(constraint, domains);
              }}
              class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          {:else if constraint.type === 'number-format'}
            <div class="space-y-3">
              <div>
                <label for="format-type" class="block text-xs font-medium text-gray-600 mb-2">Format Type</label>
                <select 
                  id="format-type"
                  value={typeof constraint.value === 'string' ? constraint.value : (constraint.value as any)?.type || 'pin'}
                  on:change={(e) => {
                    const type = e.target.value;
                    let defaultLength = 4;
                    if (type === 'pin') defaultLength = 4;
                    else if (type === 'aadhar') defaultLength = 12;
                    else if (type === 'custom') defaultLength = 10;
                    updateConstraintValue(constraint, { type, length: defaultLength });
                  }}
                  class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="pin">PIN Code (4 digits)</option>
                  <option value="aadhar">Aadhar (12 digits)</option>
                  <option value="custom">Custom Length</option>
                </select>
              </div>
              <div>
                <label for="required-digits" class="block text-xs font-medium text-gray-600 mb-2">Required Digits</label>
                <input 
                  id="required-digits"
                  type="number"
                  min="1"
                  value={typeof constraint.value === 'object' ? constraint.value.length : 10}
                  on:blur={(e) => {
                    const length = parseInt((e.target as HTMLInputElement).value) || 10;
                    const type = typeof constraint.value === 'object' ? constraint.value.type : 'phone';
                    updateConstraintValue(constraint, { type, length });
                  }}
                  placeholder="Number of digits"
                  class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          {:else if constraint.type === 'custom-regex'}
            <div class="space-y-3">
              <div>
                <label for="pattern-desc" class="block text-xs font-medium text-gray-600 mb-2">Pattern Description</label>
                <input 
                  id="pattern-desc"
                  type="text"
                  placeholder="e.g., College Roll Number (RA followed by numbers)"
                  value={(constraint.value as any)?.description || ''}
                  on:input={(e) => {
                    const currentValue = constraint.value as any;
                    updateConstraintValue(constraint, { 
                      pattern: currentValue?.pattern || '', 
                      description: e.target.value 
                    });
                  }}
                  class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label for="regex-pattern" class="block text-xs font-medium text-gray-600 mb-2">Regex Pattern</label>
                <input 
                  id="regex-pattern"
                  type="text"
                  placeholder="e.g., ^RA\d+$"
                  value={(constraint.value as any)?.pattern || ''}
                  on:input={(e) => {
                    const currentValue = constraint.value as any;
                    updateConstraintValue(constraint, { 
                      pattern: e.target.value, 
                      description: currentValue?.description || '' 
                    });
                  }}
                  class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                />
                <p class="text-xs text-gray-600 mt-2">Use JavaScript regex syntax. Example: ^RA\d{13}$ for RA followed by 13 digits</p>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>