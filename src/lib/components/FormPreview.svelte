<!-- src/lib/components/FormPreview.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { isValidPhoneNumber } from 'libphonenumber-js';
  import type { Question, Constraint } from '../types';

  export let questions: Question[];
  export let formId: string;
  export let onSubmit: (answers: Record<string, any>) => void;

  let currentQuestionIndex = 0;
  let answers: Record<string, any> = {};
  let phoneCountries: Record<string, string> = {};
  let container: HTMLElement;
  let validationError = '';
  let isSubmitting = false;

  // Country code to country name mapping
  const countryOptions = [
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
    { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
    { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
    { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
    { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
    { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
    { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
    { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
    { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
    { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
    { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
    { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
    { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
    { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
    { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
    { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
    { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
    { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
    { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
    { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
    { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
    { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
    { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
    { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
    { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
    { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
    { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿' },
    { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  ];

  let openCountryDropdown: string | null = null;
  let countrySearchQuery = '';
  let highlightedCountryIndex = 0;

  function getFilteredCountries(query: string) {
    if (!query) return countryOptions;
    const lowerQuery = query.toLowerCase();
    return countryOptions.filter(c => 
      c.code.toLowerCase().includes(lowerQuery) || 
      c.name.toLowerCase().includes(lowerQuery)
    );
  }

  function handleCountrySearch(e: KeyboardEvent, questionId: string) {
    const filteredCountries = getFilteredCountries(countrySearchQuery);
    
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCountries.length > 0) {
        phoneCountries[questionId] = filteredCountries[highlightedCountryIndex].code;
        openCountryDropdown = null;
        countrySearchQuery = '';
        highlightedCountryIndex = 0;
        validateCurrentQuestion();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedCountryIndex = (highlightedCountryIndex + 1) % filteredCountries.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedCountryIndex = (highlightedCountryIndex - 1 + filteredCountries.length) % filteredCountries.length;
    } else if (e.key === 'Escape') {
      openCountryDropdown = null;
      countrySearchQuery = '';
      highlightedCountryIndex = 0;
    }
  }

  function selectCountry(questionId: string, countryCode: string) {
    phoneCountries[questionId] = countryCode;
    openCountryDropdown = null;
    countrySearchQuery = '';
    highlightedCountryIndex = 0;
    validateCurrentQuestion();
  }

  onMount(() => {
    animateIn();
  });

  function validateCurrentQuestion() {
    const answer = answers[currentQuestion.id];
    
    // Clear previous validation error
    validationError = '';

    // Skip validation if no answer provided and question is not required
    if (!currentQuestion.required && (!answer || answer.trim().length === 0)) {
      return;
    }

    // Validate based on question type
    if (currentQuestion.type === 'email' && answer && answer.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(answer.trim())) {
        validationError = 'Please enter a valid email address';
        return;
      }
      const constraintError = validateEmailConstraints(answer.trim(), currentQuestion.constraints);
      if (constraintError) {
        validationError = constraintError;
        return;
      }
    } else if (currentQuestion.type === 'number' && answer !== undefined && answer !== null && answer !== '') {
      const numAnswer = Number(answer);
      if (currentQuestion.min !== undefined && numAnswer < currentQuestion.min) {
        validationError = `Please enter a number of at least ${currentQuestion.min}`;
        return;
      }
      if (currentQuestion.max !== undefined && numAnswer > currentQuestion.max) {
        validationError = `Please enter a number of at most ${currentQuestion.max}`;
        return;
      }
      const constraintError = validateNumberConstraints(String(answer), currentQuestion.constraints);
      if (constraintError) {
        validationError = constraintError;
        return;
      }
    } else if ((currentQuestion.type === 'text' || currentQuestion.type === 'long-text') && answer && answer.trim().length > 0) {
      const constraintError = validateTextConstraints(answer.trim(), currentQuestion.constraints);
      if (constraintError) {
        validationError = constraintError;
        return;
      }
    } else if (currentQuestion.type === 'phone' && answer && answer.trim().length > 0) {
      const constraintError = validatePhoneConstraints(answer.trim(), currentQuestion.id, currentQuestion.constraints);
      if (constraintError) {
        validationError = constraintError;
        return;
      }
    }

    // Check if required question is answered
    if (currentQuestion.required && !isAnswered(currentQuestion)) {
      validationError = 'This question is required';
      return;
    }
  }

  function validateEmailConstraints(email: string, constraints?: Constraint[]): string | null {
    if (!constraints || constraints.length === 0) return null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }

    for (const constraint of constraints) {
      if (constraint.type === 'email-type') {
        const emailType = constraint.value as string;
        const domain = email.split('@')[1].toLowerCase();

        if (emailType === 'work') {
          const workDomains = constraint.value as any;
          if (Array.isArray(workDomains.domains)) {
            if (!workDomains.domains.some((d: string) => domain.includes(d))) {
              return `Please use a work email from approved domains`;
            }
          }
        } else if (emailType === 'edu') {
          const eduPatterns = ['.edu', '.edu.in', '.ac.in', '.ac.uk', '.edu.au', '.edu.br'];
          if (!eduPatterns.some(pattern => domain.endsWith(pattern))) {
            return 'Please use an educational email address (.edu, .edu.in, .ac.in, etc.)';
          }
        }
      } else if (constraint.type === 'email-domain') {
        const allowedDomains = constraint.value as string[];
        const domain = email.split('@')[1].toLowerCase();
        if (!allowedDomains.some(d => domain.includes(d))) {
          return `Email must be from one of: ${allowedDomains.join(', ')}`;
        }
      }
    }
    return null;
  }

  function validateNumberConstraints(value: string, constraints?: Constraint[]): string | null {
    if (!constraints || constraints.length === 0) return null;

    for (const constraint of constraints) {
      if (constraint.type === 'number-format') {
        const formatConfig = constraint.value as any;
        const digitsOnly = value.replace(/\D/g, '');
        const requiredLength = formatConfig.length || 10;
        const formatType = formatConfig.type || 'phone';

        if (digitsOnly.length !== requiredLength) {
          const typeLabel = formatType.charAt(0).toUpperCase() + formatType.slice(1);
          return `${typeLabel} must have exactly ${requiredLength} digits`;
        }
      }
    }
    return null;
  }

  function validateTextConstraints(value: string, constraints?: Constraint[]): string | null {
    if (!constraints || constraints.length === 0) return null;

    for (const constraint of constraints) {
      if (constraint.type === 'custom-regex') {
        const regexConfig = constraint.value as any;
        if (regexConfig.pattern) {
          try {
            const regex = new RegExp(regexConfig.pattern);
            if (!regex.test(value)) {
              const description = regexConfig.description || 'custom pattern';
              return `Please enter a value that matches the ${description}`;
            }
          } catch (e) {
            return 'Invalid regex pattern configured';
          }
        }
      }
    }
    return null;
  }

  function validatePhoneConstraints(value: string, questionId: string, constraints?: Constraint[]): string | null {
    if (!constraints || constraints.length === 0) return null;

    // Get the selected country for this phone question
    const selectedCountryCode = phoneCountries[questionId];
    if (!selectedCountryCode) {
      return 'Please select a country';
    }

    // Basic phone number validation using libphonenumber-js with country code
    if (!isValidPhoneNumber(value, selectedCountryCode as any)) {
      return 'Please enter a valid phone number for the selected country';
    }

    return null;
  }

  function isAnswered(question: Question): boolean {
    const answer = answers[question.id];
    if (question.type === 'text' || question.type === 'long-text' || question.type === 'email' || question.type === 'phone') {
      return answer && answer.trim().length > 0;
    } else if (question.type === 'number') {
      if (answer === undefined || answer === null || answer === '') {
        return false;
      }
      const numAnswer = Number(answer);
      if (question.min !== undefined && numAnswer < question.min) {
        return false;
      }
      if (question.max !== undefined && numAnswer > question.max) {
        return false;
      }
      return true;
    } else if (question.type === 'date') {
      return answer && answer.trim().length > 0;
    } else if (question.type === 'multiple-choice' || question.type === 'dropdown' || question.type === 'yes-no') {
      return answer !== undefined && answer !== null && answer !== '';
    } else if (question.type === 'checkboxes') {
      return Array.isArray(answer) && answer.length > 0;
    } else if (question.type === 'rating') {
      return answer !== undefined && answer !== null;
    }
    return false;
  }

  function getValidationError(question: Question): string {
    const answer = answers[question.id];
    
    if (question.type === 'email') {
      if (!answer || answer.trim().length === 0) {
        return 'This question is required';
      }
      const constraintError = validateEmailConstraints(answer.trim(), question.constraints);
      if (constraintError) return constraintError;
    } else if (question.type === 'number') {
      if (answer === undefined || answer === null || answer === '') {
        return 'This question is required';
      }
      const numAnswer = Number(answer);
      if (question.min !== undefined && numAnswer < question.min) {
        return `Please enter a number of at least ${question.min}`;
      }
      if (question.max !== undefined && numAnswer > question.max) {
        return `Please enter a number of at most ${question.max}`;
      }
      const constraintError = validateNumberConstraints(String(answer), question.constraints);
      if (constraintError) return constraintError;
    } else if (question.type === 'text' || question.type === 'long-text') {
      if (!answer || answer.trim().length === 0) {
        return 'This question is required';
      }
      const constraintError = validateTextConstraints(answer.trim(), question.constraints);
      if (constraintError) return constraintError;
    } else if (question.type === 'phone') {
      if (!answer || answer.trim().length === 0) {
        return 'This question is required';
      }
      const constraintError = validatePhoneConstraints(answer.trim(), question.id, question.constraints);
      if (constraintError) return constraintError;
    }
    
    if (!isAnswered(question)) {
      return 'This question is required';
    }
    return '';
  }

  function nextQuestion() {
    // Validate required questions
    if (currentQuestion.required && !isAnswered(currentQuestion)) {
      validationError = getValidationError(currentQuestion);
      return;
    }

    // Validate email format if email field has a value (even if optional)
    if (currentQuestion.type === 'email') {
      const email = answers[currentQuestion.id];
      if (email && email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          validationError = 'Please enter a valid email address';
          return;
        }
        const constraintError = validateEmailConstraints(email.trim(), currentQuestion.constraints);
        if (constraintError) {
          validationError = constraintError;
          return;
        }
      }
    }

    // Validate number format constraints if number field has a value
    if (currentQuestion.type === 'number') {
      const numValue = answers[currentQuestion.id];
      if (numValue !== undefined && numValue !== null && numValue !== '') {
        const constraintError = validateNumberConstraints(String(numValue), currentQuestion.constraints);
        if (constraintError) {
          validationError = constraintError;
          return;
        }
      }
    }

    // Validate text constraints if text field has a value
    if (currentQuestion.type === 'text' || currentQuestion.type === 'long-text') {
      const textValue = answers[currentQuestion.id];
      if (textValue && textValue.trim().length > 0) {
        const constraintError = validateTextConstraints(textValue.trim(), currentQuestion.constraints);
        if (constraintError) {
          validationError = constraintError;
          return;
        }
      }
    }

    // Validate phone constraints if phone field has a value
    if (currentQuestion.type === 'phone') {
      const phoneValue = answers[currentQuestion.id];
      if (phoneValue && phoneValue.trim().length > 0) {
        const constraintError = validatePhoneConstraints(phoneValue.trim(), currentQuestion.id, currentQuestion.constraints);
        if (constraintError) {
          validationError = constraintError;
          return;
        }
      }
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
    // Check if all required questions are answered
    for (const question of questions) {
      if (question.required && !isAnswered(question)) {
        validationError = `Please answer: ${question.question}`;
        return;
      }

      // Validate email format for all email fields that have values
      if (question.type === 'email') {
        const email = answers[question.id];
        if (email && email.trim().length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email.trim())) {
            validationError = `Invalid email in question: ${question.title}`;
            return;
          }
          const constraintError = validateEmailConstraints(email.trim(), question.constraints);
          if (constraintError) {
            validationError = constraintError;
            return;
          }
        }
      }

      // Validate number format constraints for all number fields that have values
      if (question.type === 'number') {
        const numValue = answers[question.id];
        if (numValue !== undefined && numValue !== null && numValue !== '') {
          const constraintError = validateNumberConstraints(String(numValue), question.constraints);
          if (constraintError) {
            validationError = constraintError;
            return;
          }
        }
      }

      // Validate text constraints for all text fields that have values
      if (question.type === 'text' || question.type === 'long-text') {
        const textValue = answers[question.id];
        if (textValue && textValue.trim().length > 0) {
          const constraintError = validateTextConstraints(textValue.trim(), question.constraints);
          if (constraintError) {
            validationError = constraintError;
            return;
          }
        }
      }

      // Validate phone constraints for all phone fields that have values
      if (question.type === 'phone') {
        const phoneValue = answers[question.id];
        if (phoneValue && phoneValue.trim().length > 0) {
          const constraintError = validatePhoneConstraints(phoneValue.trim(), question.id, question.constraints);
          if (constraintError) {
            validationError = constraintError;
            return;
          }
        }
      }
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
  $: canAdvanceValue = currentQuestion ? (currentQuestion.required ? isAnswered(currentQuestion) : true) && !validationError : false;
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
              <input bind:value={answers[currentQuestion.id]} placeholder={currentQuestion.placeholder || "Type your answer here..."} class="w-full text-lg text-black placeholder-gray-400 border-b-2 {validationError ? 'border-red-500' : 'border-gray-300'} focus:border-black outline-none bg-transparent py-3 transition-colors" on:keydown={handleEnter} on:input={validateCurrentQuestion} />
              {#if validationError}
                <p class="text-red-500 text-sm mt-2">{validationError}</p>
              {:else}
                <p class="text-xs text-gray-400 mt-2">Press Enter to continue</p>
              {/if}
            </div>
          {:else if currentQuestion.type === 'long-text'}
            <div>
              <textarea bind:value={answers[currentQuestion.id]} placeholder={currentQuestion.placeholder || "Type your answer here..."} rows="4" class="w-full text-lg text-black placeholder-gray-400 border-2 {validationError ? 'border-red-500' : 'border-gray-300'} focus:border-black outline-none bg-transparent py-3 px-4 rounded-lg transition-colors resize-none" on:keydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); nextQuestion(); } }} on:input={validateCurrentQuestion}></textarea>
              {#if validationError}
                <p class="text-red-500 text-sm mt-2">{validationError}</p>
              {:else}
                <p class="text-xs text-gray-400 mt-2">Press Enter to continue, Shift+Enter for new line</p>
              {/if}
            </div>
          {:else if currentQuestion.type === 'number'}
            <div>
              <input type="number" bind:value={answers[currentQuestion.id]} min={currentQuestion.min} max={currentQuestion.max} placeholder={currentQuestion.placeholder || "Enter a number..."} class="w-full text-lg text-black placeholder-gray-400 border-b-2 {validationError ? 'border-red-500' : 'border-gray-300'} focus:border-black outline-none bg-transparent py-3 transition-colors" on:keydown={handleEnter} on:input={validateCurrentQuestion} />
              {#if validationError}
                <p class="text-red-500 text-sm mt-2">{validationError}</p>
              {:else}
                <p class="text-xs text-gray-400 mt-2">Press Enter to continue</p>
              {/if}
            </div>
          {:else if currentQuestion.type === 'email'}
            <div>
              <input type="email" bind:value={answers[currentQuestion.id]} placeholder={currentQuestion.placeholder || "Enter your email..."} class="w-full text-lg text-black placeholder-gray-400 border-b-2 {validationError ? 'border-red-500' : 'border-gray-300'} focus:border-black outline-none bg-transparent py-3 transition-colors" on:keydown={handleEnter} on:input={validateCurrentQuestion} />
              {#if validationError}
                <p class="text-red-500 text-sm mt-2">{validationError}</p>
              {:else}
                <p class="text-xs text-gray-400 mt-2">Press Enter to continue</p>
              {/if}
            </div>
          {:else if currentQuestion.type === 'phone'}
            <div>
              <div class="relative">
                <div class="flex gap-3 items-end">
                  <!-- Country Selector Button -->
                  <div class="flex-shrink-0 pb-3 border-b-2 {validationError ? 'border-red-500' : 'border-gray-300'} transition-colors relative">
                    <button
                      type="button"
                      on:click={() => {
                        openCountryDropdown = openCountryDropdown === currentQuestion.id ? null : currentQuestion.id;
                        countrySearchQuery = '';
                        highlightedCountryIndex = 0;
                      }}
                      class="text-lg text-black outline-none bg-transparent border-none focus:ring-0 min-w-max hover:bg-gray-50 px-2 rounded transition-colors"
                    >
                      {#if phoneCountries[currentQuestion.id]}
                        {countryOptions.find(c => c.code === phoneCountries[currentQuestion.id])?.flag}
                        {phoneCountries[currentQuestion.id]}
                      {:else}
                        🌍
                      {/if}
                    </button>

                    <!-- Dropdown Menu -->
                    {#if openCountryDropdown === currentQuestion.id}
                      <div class="absolute bottom-full left-0 mb-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-64 max-h-64 overflow-y-auto">
                        <input
                          type="text"
                          placeholder="Search country (IN, India)..."
                          bind:value={countrySearchQuery}
                          on:keydown={(e) => handleCountrySearch(e, currentQuestion.id)}
                          class="w-full px-3 py-2 border-b border-gray-300 text-sm outline-none focus:ring-1 focus:ring-black"
                        />
                        {#each getFilteredCountries(countrySearchQuery) as country, idx}
                          <button
                            type="button"
                            on:click={() => selectCountry(currentQuestion.id, country.code)}
                            class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors {idx === highlightedCountryIndex ? 'bg-gray-200' : ''}"
                          >
                            <span class="text-lg">{country.flag}</span> {country.code} {country.name} {country.dialCode}
                          </button>
                        {/each}
                        {#if getFilteredCountries(countrySearchQuery).length === 0}
                          <div class="px-4 py-3 text-sm text-gray-500 text-center">
                            No countries found
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>

                  <!-- Phone Number Input -->
                  <div class="flex-1 border-b-2 {validationError ? 'border-red-500' : 'border-gray-300'} transition-colors">
                    <input type="tel" bind:value={answers[currentQuestion.id]} placeholder={currentQuestion.placeholder || "Enter your phone number..."} class="w-full text-lg text-black placeholder-gray-400 border-none outline-none bg-transparent py-3 transition-colors" on:keydown={handleEnter} on:input={validateCurrentQuestion} />
                  </div>
                </div>
              </div>
              {#if validationError}
                <p class="text-red-500 text-sm mt-2">{validationError}</p>
              {:else}
                <p class="text-xs text-gray-400 mt-2">Press Enter to continue</p>
              {/if}
            </div>
          {:else if currentQuestion.type === 'date'}
            <div>
              <input type="date" bind:value={answers[currentQuestion.id]} class="w-full text-lg text-black border-b-2 {validationError ? 'border-red-500' : 'border-gray-300'} focus:border-black outline-none bg-transparent py-3 transition-colors" />
              {#if validationError}
                <p class="text-red-500 text-sm mt-2">{validationError}</p>
              {/if}
            </div>
          {:else if currentQuestion.type === 'multiple-choice'}
            <div class="space-y-3">
              {#each currentQuestion.options || [] as option}
                <label class="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" bind:group={answers[currentQuestion.id]} value={option} class="w-5 h-5 cursor-pointer accent-black" on:change={validateCurrentQuestion} />
                  <span class="ml-4 text-gray-900 font-medium">{option}</span>
                </label>
              {/each}
            </div>
          {:else if currentQuestion.type === 'dropdown'}
            <div>
              <select bind:value={answers[currentQuestion.id]} class="w-full text-lg text-black border-b-2 {validationError ? 'border-red-500' : 'border-gray-300'} focus:border-black outline-none bg-transparent py-3 transition-colors" on:change={validateCurrentQuestion}>
                <option value="" disabled selected>Select an option...</option>
                {#each currentQuestion.options || [] as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
              {#if validationError}
                <p class="text-red-500 text-sm mt-2">{validationError}</p>
              {/if}
            </div>
          {:else if currentQuestion.type === 'checkboxes'}
            <div class="space-y-3">
              {#each currentQuestion.options || [] as option}
                <label class="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" bind:group={answers[currentQuestion.id]} value={option} class="w-5 h-5 cursor-pointer accent-black" on:change={validateCurrentQuestion} />
                  <span class="ml-4 text-gray-900 font-medium">{option}</span>
                </label>
              {/each}
            </div>
          {:else if currentQuestion.type === 'yes-no'}
            <div class="grid grid-cols-2 gap-4">
              {#each ['Yes', 'No'] as option}
                <label class="flex items-center justify-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" bind:group={answers[currentQuestion.id]} value={option} class="w-5 h-5 cursor-pointer accent-black" on:change={validateCurrentQuestion} />
                  <span class="ml-3 text-gray-900 font-semibold">{option}</span>
                </label>
              {/each}
            </div>
          {:else if currentQuestion.type === 'rating'}
            <div class="flex gap-4 justify-center">
              {#each [1, 2, 3, 4, 5] as rating}
                <button on:click={() => { answers[currentQuestion.id] = rating; validateCurrentQuestion(); }} class="text-5xl transition-all duration-200 cursor-pointer {answers[currentQuestion.id] >= rating ? 'scale-125' : 'opacity-30 hover:opacity-50 scale-100'}">
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