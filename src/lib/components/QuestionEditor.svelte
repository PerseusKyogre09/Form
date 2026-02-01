<!-- src/lib/components/QuestionEditor.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Question, Constraint } from '../types';

  export let question: Question;
  export let questionNumber: number;

  const dispatch = createEventDispatcher();
  let showConstraintDropdown = false;

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

  {#if question.type === 'multiple-choice' || question.type === 'dropdown' || question.type === 'checkboxes'}
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
  {:else if question.type === 'number'}
    <div class="ml-10 space-y-2">
      <p class="text-sm text-gray-500 font-medium mb-3">Range Settings</p>
      <div class="flex gap-4">
        <div class="flex-1">
          <label class="block text-xs text-gray-500 mb-1">Minimum</label>
          <input type="number" bind:value={question.min} on:input={updateQuestion} placeholder="0" class="w-full px-3 py-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 text-sm" />
        </div>
        <div class="flex-1">
          <label class="block text-xs text-gray-500 mb-1">Maximum</label>
          <input type="number" bind:value={question.max} on:input={updateQuestion} placeholder="100" class="w-full px-3 py-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 text-sm" />
        </div>
      </div>
    </div>
  {:else if question.type === 'text' || question.type === 'long-text' || question.type === 'email' || question.type === 'phone'}
    <div class="ml-10 space-y-2">
      <p class="text-sm text-gray-500 font-medium mb-3">Placeholder Text</p>
      <input bind:value={question.placeholder} on:input={updateQuestion} placeholder="Enter placeholder text..." class="w-full px-3 py-2 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 text-sm" />
    </div>
  {/if}

  {#if getAvailableConstraints().length > 0}
    <div class="ml-10 mt-4 space-y-2">
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm text-gray-500 font-medium">Constraints (Optional)</p>
        <div class="relative">
          <button 
            on:click={() => showConstraintDropdown = !showConstraintDropdown}
            class="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add constraint
          </button>
          {#if showConstraintDropdown}
            <div class="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
              {#each getAvailableConstraints() as constraint}
                <button
                  on:click={() => addConstraint(constraint.value)}
                  class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                >
                  {constraint.label}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      {#each question.constraints || [] as constraint (constraint.id)}
        <div class="bg-gray-50 p-3 rounded border border-gray-200 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">
              {constraintLabels[constraint.type as keyof typeof constraintLabels] || constraint.type}
            </span>
            <button on:click={() => removeConstraint(constraint.id)} class="text-red-500 hover:text-red-700 text-sm">
              Remove
            </button>
          </div>

          {#if constraint.type === 'email-type'}
            <select 
              value={constraint.value}
              on:change={(e) => updateConstraintValue(constraint, e.target.value)}
              class="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
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
                class="w-full text-sm border border-gray-300 rounded px-2 py-1"
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
              class="w-full text-sm border border-gray-300 rounded px-2 py-1"
            />
          {:else if constraint.type === 'number-format'}
            <div class="space-y-2">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Format Type</label>
                <select 
                  value={typeof constraint.value === 'string' ? constraint.value : (constraint.value as any)?.type || 'pin'}
                  on:change={(e) => {
                    const type = e.target.value;
                    let defaultLength = 4;
                    if (type === 'pin') defaultLength = 4;
                    else if (type === 'aadhar') defaultLength = 12;
                    else if (type === 'custom') defaultLength = 10;
                    updateConstraintValue(constraint, { type, length: defaultLength });
                  }}
                  class="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="pin">PIN Code (4 digits)</option>
                  <option value="aadhar">Aadhar (12 digits)</option>
                  <option value="custom">Custom Length</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Required Digits</label>
                <input 
                  type="number"
                  min="1"
                  value={typeof constraint.value === 'object' ? constraint.value.length : 10}
                  on:blur={(e) => {
                    const length = parseInt((e.target as HTMLInputElement).value) || 10;
                    const type = typeof constraint.value === 'object' ? constraint.value.type : 'phone';
                    updateConstraintValue(constraint, { type, length });
                  }}
                  placeholder="Number of digits"
                  class="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
            </div>
          {:else if constraint.type === 'custom-regex'}
            <div class="space-y-2">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Pattern Description</label>
                <input 
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
                  class="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Regex Pattern</label>
                <input 
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
                  class="w-full text-sm border border-gray-300 rounded px-2 py-1 font-mono"
                />
                <p class="text-xs text-gray-500 mt-1">Use JavaScript regex syntax. Example: ^RA\d{13}$ for RA followed by 13 digits</p>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>