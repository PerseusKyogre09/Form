<!-- src/lib/components/FormPreview.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import type { Question } from '../types';

  export let questions: Question[];
  export let formId: string;
  export let onSubmit: (answers: Record<string, any>) => void;

  let currentQuestionIndex = 0;
  let answers: Record<string, any> = {};
  let container: HTMLElement;
  let validationError = '';
  let isSubmitting = false;

  onMount(() => {
    animateIn();
  });

  function animateIn() {
    gsap.from(container, { opacity: 0, y: 30, duration: 0.4 });
  }

  function isAnswered(question: Question): boolean {
    const answer = answers[question.id];
    if (question.type === 'text') {
      return answer && answer.trim().length > 0;
    } else if (question.type === 'multiple-choice' || question.type === 'yes-no') {
      return answer !== undefined && answer !== null && answer !== '';
    } else if (question.type === 'rating') {
      return answer !== undefined && answer !== null;
    }
    return false;
  }

  function canAdvance(): boolean {
    const current = currentQuestion;
    if (!current) return false;
    if (!current.required) return true;
    return isAnswered(current);
  }

  function nextQuestion() {
    if (!canAdvance()) {
      validationError = 'This question is required';
      return;
    }
    validationError = '';
    if (currentQuestionIndex < questions.length - 1) {
      gsap.to(container, { opacity: 0, y: -30, duration: 0.3, onComplete: () => {
        currentQuestionIndex++;
        gsap.set(container, { opacity: 1, y: 0 });
        animateIn();
      }});
    }
  }

  function handleEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextQuestion();
    }
  }

  function prevQuestion() {
    validationError = '';
    if (currentQuestionIndex > 0) {
      gsap.to(container, { opacity: 0, y: 30, duration: 0.3, onComplete: () => {
        currentQuestionIndex--;
        gsap.set(container, { opacity: 1, y: 0 });
        animateIn();
      }});
    }
  }

  async function submitForm() {
    if (!canAdvance()) {
      validationError = 'This question is required';
      return;
    }
    validationError = '';
    isSubmitting = true;

    try {
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, answers })
      });

      if (response.ok) {
        gsap.to(container, { opacity: 0, y: -30, duration: 0.3, onComplete: () => {
          onSubmit(answers);
        }});
      } else {
        validationError = 'Failed to submit form. Please try again.';
        isSubmitting = false;
      }
    } catch (error) {
      console.error('Submission error:', error);
      validationError = 'Error submitting form. Please try again.';
      isSubmitting = false;
    }
  }

  $: currentQuestion = questions[currentQuestionIndex];
  $: progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  $: canAdvanceValue = currentQuestion && answers ? (answers[currentQuestion.id], canAdvance()) : false;
</script>

<div class="max-w-2xl mx-auto">
  {#if questions.length > 0}
    <!-- Progress Bar -->
    <div class="mb-12">
      <div class="flex items-center justify-between mb-4">
        <div class="text-sm text-gray-500">
          {currentQuestionIndex + 1} of {questions.length}
        </div>
        <button on:click={() => currentQuestionIndex = 0} class="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
      <div class="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div class="h-full bg-black transition-all duration-500 ease-out" style="width: {progress}%"></div>
      </div>
    </div>

    <!-- Question Container -->
    <div bind:this={container} class="mb-12">
      {#if currentQuestion}
        <div>
          <div class="mb-8">
            <div class="text-sm text-gray-500 mb-4">{currentQuestionIndex + 1}</div>
            <h3 class="text-4xl font-bold text-black">{currentQuestion.title}{#if currentQuestion.required}<span class="text-red-500">*</span>{/if}</h3>
          </div>
          
          {#if currentQuestion.type === 'text'}
            <div>
              <input bind:value={answers[currentQuestion.id]} placeholder="Type your answer here..." class="w-full text-lg text-black placeholder-gray-400 border-b-2 {validationError ? 'border-red-500' : 'border-gray-300'} focus:border-black outline-none bg-transparent py-3 transition-colors" on:keydown={handleEnter} />
              {#if validationError}
                <p class="text-red-500 text-sm mt-2">{validationError}</p>
              {:else}
                <p class="text-xs text-gray-400 mt-2">Press Enter to continue</p>
              {/if}
            </div>
          {:else if currentQuestion.type === 'multiple-choice'}
            <div class="space-y-3">
              {#each currentQuestion.options || [] as option}
                <label class="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" bind:group={answers[currentQuestion.id]} value={option} class="w-5 h-5 cursor-pointer accent-black" />
                  <span class="ml-4 text-gray-900 font-medium">{option}</span>
                </label>
              {/each}
            </div>
          {:else if currentQuestion.type === 'yes-no'}
            <div class="grid grid-cols-2 gap-4">
              {#each ['Yes', 'No'] as option}
                <label class="flex items-center justify-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" bind:group={answers[currentQuestion.id]} value={option} class="w-5 h-5 cursor-pointer accent-black" />
                  <span class="ml-3 text-gray-900 font-semibold">{option}</span>
                </label>
              {/each}
            </div>
          {:else if currentQuestion.type === 'rating'}
            <div class="flex gap-4 justify-center">
              {#each [1, 2, 3, 4, 5] as rating}
                <button on:click={() => { answers[currentQuestion.id] = rating; }} class="text-5xl transition-all duration-200 cursor-pointer {answers[currentQuestion.id] >= rating ? 'scale-125' : 'opacity-30 hover:opacity-50 scale-100'}">
                  ★
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Navigation -->
    <div class="flex gap-6 items-center justify-between pt-8 border-t border-gray-200">
      <button on:click={prevQuestion} disabled={currentQuestionIndex === 0} class="text-gray-600 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2">
        ← Previous
      </button>
      <div class="text-xs text-gray-400">Press Enter to continue</div>
      {#if currentQuestionIndex < questions.length - 1}
        <button on:click={nextQuestion} disabled={!canAdvanceValue} class="px-8 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Next →
        </button>
      {:else}
        <button on:click={submitForm} disabled={!canAdvanceValue || isSubmitting} class="px-8 py-2 bg-black text-white rounded-md font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? 'Submitting...' : 'Submit →'}
        </button>
      {/if}
    </div>
  {:else}
    <div class="text-center py-12">
      <p class="text-gray-500">Add questions to preview your form</p>
    </div>
  {/if}
</div>