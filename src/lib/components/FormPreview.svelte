<!-- src/lib/components/FormPreview.svelte -->
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { gsap } from 'gsap';
  import { Draggable } from 'gsap/dist/Draggable';
  import { isValidPhoneNumber } from 'libphonenumber-js';
  import type { Question, Constraint, FormElement } from '../types';
  import { isAnimationElement } from '../types';
  import { 
    slideQuestion, 
    animateProgress, 
    shakeElement, 
    bounceError,
    slideDropdown,
    slideDropdownOut
  } from '../animations';

  gsap.registerPlugin(Draggable);

  export let questions: FormElement[] = [];
  export let formId: string;
  export let onSubmit: (answers: Record<string, any>) => void;
  export let isClosed: boolean = false;

  let currentQuestionIndex = 0;
  let answers: Record<string, any> = {};
  let phoneCountries: Record<string, string> = {};
  let container: HTMLElement;
  let progressBar: HTMLElement;
  let questionContainer: HTMLElement;
  let validationError = '';
  let isSubmitting = false;
  let validationElement: HTMLElement;
  let currentElement: FormElement | undefined;
  let currentQuestion: Question | undefined;
  let animationTimer: ReturnType<typeof setTimeout> | null = null;
  let draggableInstance: InstanceType<typeof Draggable> | null = null;

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

  function animateIn() {
    if (container) {
      gsap.set(container, { opacity: 0, y: 20 });
      gsap.to(container, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }
    
    // Setup auto-advance if current element is an animation with auto-advance enabled
    if (animationTimer) clearTimeout(animationTimer);
    if (currentElement && isAnimationElement(currentElement) && currentElement.enableAutoAdvance) {
      // Calculate total animation duration based on type and repeat count
      let animationDuration = 3; // default fade duration in seconds
      if (currentElement.animationType === 'fade') animationDuration = 3;
      else if (currentElement.animationType === 'slide') animationDuration = 2.8;
      else if (currentElement.animationType === 'pulse') animationDuration = 2.2;
      
      // Calculate total animation time with repeats
      let totalAnimationTime = animationDuration;
      if (currentElement.repeatMode === 'times' && currentElement.repeatCount) {
        totalAnimationTime = animationDuration * currentElement.repeatCount;
      }
      
      // Add the auto-advance delay on top of animation completion
      const delay = totalAnimationTime + (currentElement.autoAdvanceDelay || 3);
      animationTimer = setTimeout(() => {
        nextQuestion();
      }, delay * 1000);
    }
  }

  onMount(() => {
    animateIn();
    
    // Setup draggable for smooth swiping
    if (container) {
      draggableInstance = Draggable.create(container, {
        type: 'x,y',
        edgeResistance: 0.65,
        bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
        inertia: true,
        onDragEnd() {
          const x = this.getX();
          const y = this.getY();
          
          // Horizontal swipe: left = next, right = previous
          if (Math.abs(x) > Math.abs(y)) {
            if (x < -30 && currentQuestionIndex < questions.length - 1) {
              this.kill();
              nextQuestion();
              return;
            }
            
            if (x > 30 && currentQuestionIndex > 0) {
              this.kill();
              prevQuestion();
              return;
            }
          }
          
          // Snap back to center
          gsap.to(container, { x: 0, y: 0, duration: 0.4, ease: 'back.out' });
        }
      })[0];
    }
    
    return () => {
      if (animationTimer) clearTimeout(animationTimer);
      if (draggableInstance) draggableInstance.kill();
    };
  });

  function validateCurrentQuestion() {
    if (!currentQuestion) return;
    const answer = answers[currentQuestion.id];
    
    // Clear previous validation error
    const hadError = validationError !== '';
    validationError = '';

    // Skip validation if no answer provided and question is not required
    if (!currentQuestion.required && (!answer || answer.trim?.length === 0)) {
      return;
    }

    // Validate based on question type
    if (currentQuestion.type === 'email' && answer && answer.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(answer.trim())) {
        validationError = 'Please enter a valid email address';
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
      const constraintError = validateEmailConstraints(answer.trim(), currentQuestion.constraints);
      if (constraintError) {
        validationError = constraintError;
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
    } else if (currentQuestion.type === 'number' && answer !== undefined && answer !== null && answer !== '') {
      const numAnswer = Number(answer);
      if (currentQuestion.min !== undefined && numAnswer < currentQuestion.min) {
        validationError = `Please enter a number of at least ${currentQuestion.min}`;
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
      if (currentQuestion.max !== undefined && numAnswer > currentQuestion.max) {
        validationError = `Please enter a number of at most ${currentQuestion.max}`;
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
      const constraintError = validateNumberConstraints(String(answer), currentQuestion.constraints);
      if (constraintError) {
        validationError = constraintError;
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
    } else if ((currentQuestion.type === 'text' || currentQuestion.type === 'long-text') && answer && answer.trim().length > 0) {
      const constraintError = validateTextConstraints(answer.trim(), currentQuestion.constraints);
      if (constraintError) {
        validationError = constraintError;
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
    } else if (currentQuestion.type === 'phone' && answer && answer.trim().length > 0) {
      const constraintError = validatePhoneConstraints(answer.trim(), currentQuestion.id, currentQuestion.constraints);
      if (constraintError) {
        validationError = constraintError;
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
    }

    // Check if required question is answered
    if (currentQuestion.required && !isAnswered(currentQuestion)) {
      validationError = 'This question is required';
      if (!hadError && validationElement) {
        tick().then(() => bounceError(validationElement));
      }
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
    // Get the selected country for this phone question
    const selectedCountryCode = phoneCountries[questionId];
    if (!selectedCountryCode) {
      return 'Please select a country';
    }

    // Always validate phone number format using libphonenumber-js with country code
    if (!isValidPhoneNumber(value, selectedCountryCode as any)) {
      return 'Please enter a valid phone number for the selected country';
    }

    // If there are additional constraints, validate those too
    if (!constraints || constraints.length === 0) return null;

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

  function transitionStep(direction: 'next' | 'prev') {
    const delta = direction === 'next' ? 1 : -1;
    const targetIndex = currentQuestionIndex + delta;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const x = direction === 'next' ? 50 : -50;
    
    // Kill draggable during transition
    if (draggableInstance) draggableInstance.kill();
    
    gsap.to(container, { opacity: 0, x, duration: 0.4, ease: 'power2.in', onComplete: () => {
      currentQuestionIndex = targetIndex;
      slideQuestion(container, direction, 0.4);
    }});
  }

  function nextQuestion() {
    if (!currentElement) return;
    if (isAnimationElement(currentElement)) {
      validationError = '';
      transitionStep('next');
      return;
    }

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
      transitionStep('next');
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
    transitionStep('prev');
  }

  async function submitForm() {
    // Check if all required questions are answered
    for (const question of questions.filter((el) => !isAnimationElement(el))) {
      if (question.required && !isAnswered(question)) {
        validationError = `Please answer: ${question.title}`;
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

  $: if (questions.length === 0) {
    currentQuestionIndex = 0;
  } else if (currentQuestionIndex >= questions.length) {
    currentQuestionIndex = questions.length - 1;
  }
  $: currentElement = questions[currentQuestionIndex];
  $: currentQuestion = currentElement && !isAnimationElement(currentElement) ? currentElement : undefined;
  
  // Calculate only actual questions for numbering (exclude animations)
  $: questionList = questions.filter(q => !isAnimationElement(q));
  $: currentQuestionNumber = currentElement && !isAnimationElement(currentElement) 
    ? questionList.findIndex(q => q.id === currentElement.id) + 1 
    : 0;
  
  $: progress = questionList.length ? (currentQuestionNumber / questionList.length) * 100 : 0;
  $: canAdvanceValue = currentElement ? (isAnimationElement(currentElement) ? true : (currentQuestion?.required ? isAnswered(currentQuestion) : true)) && !validationError : false;
  
  // Animate progress bar when progress changes
  $: if (progressBar) {
    animateProgress(progressBar, progress, 0.6);
  }
  
  // Reinitialize draggable when question changes
  $: if (currentQuestionIndex && container && draggableInstance) {
    // Reset position and reinitialize draggable
    gsap.set(container, { x: 0, y: 0 });
    draggableInstance.kill();
    draggableInstance = Draggable.create(container, {
      type: 'x,y',
      edgeResistance: 0.65,
      bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
      inertia: true,
      onDragEnd() {
        const x = this.getX();
        const y = this.getY();
        
        // Horizontal swipe: left = next, right = previous
        if (Math.abs(x) > Math.abs(y)) {
          if (x < -30 && currentQuestionIndex < questions.length - 1) {
            this.kill();
            nextQuestion();
            return;
          }
          
          if (x > 30 && currentQuestionIndex > 0) {
            this.kill();
            prevQuestion();
            return;
          }
        }
        
        // Snap back to center
        gsap.to(container, { x: 0, y: 0, duration: 0.4, ease: 'back.out' });
      }
    })[0];
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4">
  <div class="max-w-2xl mx-auto">
    {#if isClosed}
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center space-y-6 px-6">
          <div class="text-8xl mb-4"><i class="fas fa-lock text-red-600"></i></div>
          <h2 class="text-4xl font-bold text-gray-900">This form is closed</h2>
          <p class="text-lg text-gray-600">We are no longer accepting responses for this form. Thank you for your interest!</p>
          <p class="text-sm text-gray-500 mt-8">If you believe this is an error, please contact the form owner.</p>
        </div>
      </div>
    {:else if questions.length > 0}
      <!-- Header with Progress -->
      <div class="mb-8 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            {#if !isAnimationElement(currentElement)}
              <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm">
                {currentQuestionNumber}
              </div>
              <div class="text-sm text-gray-600 font-medium">
                Question {currentQuestionNumber} of {questionList.length}
              </div>
            {/if}
          </div>
          <button on:click={() => currentQuestionIndex = 0} class="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        <!-- Progress Bar -->
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div bind:this={progressBar} class="h-full bg-gradient-to-r from-blue-500 to-blue-600" style="width: {progress}%"></div>
        </div>
      </div>

      <!-- Question Container -->
      <div bind:this={container} class="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 mb-8">
        {#if currentElement}
          <div>
            <div class="mb-10">
              <h3 class="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                {currentElement.title}{#if currentQuestion?.required}<span class="text-red-500 ml-1">*</span>{/if}
              </h3>
              {#if isAnimationElement(currentElement) && currentElement.description}
                <p class="text-sm text-gray-500 mt-2 max-w-2xl">{currentElement.description}</p>
              {/if}
            </div>

            {#if isAnimationElement(currentElement)}
              <div 
                class={`animation-stage animation-stage--${currentElement.animationType}`} 
                style="background-color: {currentElement.backgroundColor || 'transparent'}; animation-iteration-count: {currentElement.repeatMode === 'loop' ? 'infinite' : currentElement.repeatCount || 1};"
              >
                {#if currentElement.assetUrl}
                  <img src={currentElement.assetUrl} alt={currentElement.title || 'Animation'} class="max-h-96 max-w-full object-contain" />
                {:else}
                  <div class="text-center space-y-3 px-4">
                    <p class="text-3xl font-bold {currentElement.backgroundColor === 'transparent' ? 'text-gray-900' : 'text-white'}">{currentElement.title || 'Animation'}</p>
                    {#if currentElement.description}
                      <p class="text-sm {currentElement.backgroundColor === 'transparent' ? 'text-gray-600' : 'text-white text-opacity-90'}">
                        {currentElement.description}
                      </p>
                    {/if}
                    {#if currentElement.enableAutoAdvance}
                      <p class="text-xs font-semibold pt-4 {currentElement.backgroundColor === 'transparent' ? 'text-gray-400' : 'text-white text-opacity-70'}">
                        Auto-advancing...
                      </p>
                    {/if}
                  </div>
                {/if}
              </div>
            {:else if currentQuestion}
              <div>
                <div class="space-y-10">
                  {#if currentQuestion.type === 'text'}
                    <div>
                      <input bind:value={answers[currentQuestion.id]} placeholder={currentQuestion.placeholder || "Type your answer here..."} class="w-full text-lg text-gray-900 placeholder-gray-400 bg-gray-50 border-2 {validationError ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} focus:outline-none py-4 px-4 rounded-xl transition-all duration-200" on:keydown={handleEnter} on:input={validateCurrentQuestion} />
                      {#if validationError}
                        <p bind:this={validationElement} class="text-red-600 text-sm mt-3 flex items-center gap-2"><i class="fas fa-exclamation-circle"></i> {validationError}</p>
                      {:else}
                        <p class="text-xs text-gray-400 mt-3"><i class="fas fa-keyboard mr-1"></i>Press Enter to continue</p>
                      {/if}
                    </div>
                  {:else if currentQuestion.type === 'long-text'}
                    <div>
                      <textarea bind:value={answers[currentQuestion.id]} placeholder={currentQuestion.placeholder || "Type your answer here..."} rows="5" class="w-full text-lg text-gray-900 placeholder-gray-400 bg-gray-50 border-2 {validationError ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} focus:outline-none py-4 px-4 rounded-xl transition-all duration-200 resize-none" on:keydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); nextQuestion(); } }} on:input={validateCurrentQuestion}></textarea>
                      {#if validationError}
                        <p bind:this={validationElement} class="text-red-600 text-sm mt-3 flex items-center gap-2"><i class="fas fa-exclamation-circle"></i> {validationError}</p>
                      {:else}
                        <p class="text-xs text-gray-400 mt-3"><i class="fas fa-keyboard mr-1"></i>Press Enter to continue, Shift+Enter for new line</p>
                      {/if}
                    </div>
                  {:else if currentQuestion.type === 'number'}
                    <div>
                      <input type="number" bind:value={answers[currentQuestion.id]} min={currentQuestion.min} max={currentQuestion.max} placeholder={currentQuestion.placeholder || "Enter a number..."} class="w-full text-lg text-gray-900 placeholder-gray-400 bg-gray-50 border-2 {validationError ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} focus:outline-none py-4 px-4 rounded-xl transition-all duration-200" on:keydown={handleEnter} on:input={validateCurrentQuestion} />
                      {#if validationError}
                        <p bind:this={validationElement} class="text-red-600 text-sm mt-3 flex items-center gap-2"><i class="fas fa-exclamation-circle"></i> {validationError}</p>
                      {:else}
                        <p class="text-xs text-gray-400 mt-3"><i class="fas fa-keyboard mr-1"></i>Press Enter to continue</p>
                      {/if}
                    </div>
                  {:else if currentQuestion.type === 'email'}
                    <div>
                      <input type="email" bind:value={answers[currentQuestion.id]} placeholder={currentQuestion.placeholder || "Enter your email..."} class="w-full text-lg text-gray-900 placeholder-gray-400 bg-gray-50 border-2 {validationError ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} focus:outline-none py-4 px-4 rounded-xl transition-all duration-200" on:keydown={handleEnter} on:input={validateCurrentQuestion} />
                      {#if validationError}
                        <p bind:this={validationElement} class="text-red-600 text-sm mt-3 flex items-center gap-2"><i class="fas fa-exclamation-circle"></i> {validationError}</p>
                      {:else}
                        <p class="text-xs text-gray-400 mt-3"><i class="fas fa-keyboard mr-1"></i>Press Enter to continue</p>
                      {/if}
                    </div>
                  {:else if currentQuestion.type === 'phone'}
                    <div>
                      <div class="flex gap-3 items-end">
                        <!-- Country Selector Button -->
                        <div class="flex-shrink-0 relative">
                          <button
                            type="button"
                            on:click={() => {
                              openCountryDropdown = openCountryDropdown === currentQuestion.id ? null : currentQuestion.id;
                              countrySearchQuery = '';
                              highlightedCountryIndex = 0;
                            }}
                            class="text-lg text-gray-900 outline-none bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:outline-none px-4 py-4 rounded-xl transition-all duration-200 min-w-max hover:border-gray-300 {validationError ? 'border-red-400' : ''}"
                          >
                            {#if phoneCountries[currentQuestion.id]}
                              {countryOptions.find(c => c.code === phoneCountries[currentQuestion.id])?.flag}
                              <span class="ml-2 font-medium">{phoneCountries[currentQuestion.id]}</span>
                            {:else}
                              <i class="fas fa-globe mr-2"></i>
                              <span class="ml-2 font-medium text-gray-500">Select</span>
                            {/if}
                          </button>

                          <!-- Dropdown Menu -->
                          {#if openCountryDropdown === currentQuestion.id}
                            <div class="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-72 max-h-72 overflow-y-auto">
                              <input
                                type="text"
                                placeholder="Search country..."
                                bind:value={countrySearchQuery}
                                on:keydown={(e) => handleCountrySearch(e, currentQuestion.id)}
                                class="w-full px-4 py-3 border-b border-gray-200 text-sm outline-none focus:ring-0 sticky top-0 bg-white rounded-t-xl"
                              />
                              {#each getFilteredCountries(countrySearchQuery) as country, idx}
                                <button
                                  type="button"
                                  on:click={() => selectCountry(currentQuestion.id, country.code)}
                                  class="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors {idx === highlightedCountryIndex ? 'bg-blue-100' : ''} border-b border-gray-100 last:border-b-0"
                                >
                                  <span class="text-lg mr-2">{country.flag}</span>
                                  <span class="font-medium text-gray-900">{country.code}</span>
                                  <span class="text-gray-600 ml-2">{country.name}</span>
                                  <span class="text-gray-400 ml-1">{country.dialCode}</span>
                                </button>
                              {/each}
                              {#if getFilteredCountries(countrySearchQuery).length === 0}
                                <div class="px-4 py-6 text-sm text-gray-500 text-center">
                                  <i class="fas fa-search mb-2"></i>
                                  <p>No countries found</p>
                                </div>
                              {/if}
                            </div>
                          {/if}
                        </div>

                        <!-- Phone Number Input -->
                        <div class="flex-1">
                          <input type="tel" bind:value={answers[currentQuestion.id]} placeholder={currentQuestion.placeholder || "Enter your phone number..."} class="w-full text-lg text-gray-900 placeholder-gray-400 bg-gray-50 border-2 {validationError ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} focus:outline-none py-4 px-4 rounded-xl transition-all duration-200" on:keydown={handleEnter} on:input={validateCurrentQuestion} />
                        </div>
                      </div>
                      {#if validationError}
                        <p bind:this={validationElement} class="text-red-600 text-sm mt-3 flex items-center gap-2"><i class="fas fa-exclamation-circle"></i> {validationError}</p>
                      {:else}
                        <p class="text-xs text-gray-400 mt-3"><i class="fas fa-keyboard mr-1"></i>Press Enter to continue</p>
                      {/if}
                    </div>
                  {:else if currentQuestion.type === 'date'}
                    <div>
                      <input type="date" bind:value={answers[currentQuestion.id]} class="w-full text-lg text-gray-900 bg-gray-50 border-2 {validationError ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} focus:outline-none py-4 px-4 rounded-xl transition-all duration-200" />
                      {#if validationError}
                        <p bind:this={validationElement} class="text-red-600 text-sm mt-3 flex items-center gap-2"><i class="fas fa-exclamation-circle"></i> {validationError}</p>
                      {/if}
                    </div>
                  {:else if currentQuestion.type === 'multiple-choice'}
                    <div class="space-y-3">
                      {#each currentQuestion.options || [] as option}
                        <label class="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group">
                          <div class="relative flex items-center justify-center">
                            <input type="radio" bind:group={answers[currentQuestion.id]} value={option} class="w-5 h-5 cursor-pointer accent-blue-500 opacity-0 absolute" on:change={validateCurrentQuestion} />
                            <div class="w-5 h-5 border-2 border-gray-300 rounded-full group-hover:border-blue-400 transition-colors"></div>
                            {#if answers[currentQuestion.id] === option}
                              <div class="absolute w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                            {/if}
                          </div>
                          <span class="ml-4 text-gray-900 font-medium group-hover:text-blue-600 transition-colors">{option}</span>
                        </label>
                      {/each}
                    </div>
                  {:else if currentQuestion.type === 'dropdown'}
                    <div>
                      <select bind:value={answers[currentQuestion.id]} class="w-full text-lg text-gray-900 bg-gray-50 border-2 {validationError ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} focus:outline-none py-4 px-4 rounded-xl transition-all duration-200" on:change={validateCurrentQuestion}>
                        <option value="" disabled selected>Select an option...</option>
                        {#each currentQuestion.options || [] as option}
                          <option value={option}>{option}</option>
                        {/each}
                      </select>
                      {#if validationError}
                        <p bind:this={validationElement} class="text-red-600 text-sm mt-3 flex items-center gap-2"><i class="fas fa-exclamation-circle"></i> {validationError}</p>
                      {/if}
                    </div>
                  {:else if currentQuestion.type === 'checkboxes'}
                    <div class="space-y-3">
                      {#each currentQuestion.options || [] as option}
                        <label class="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group">
                          <div class="relative flex items-center justify-center">
                            <input type="checkbox" bind:group={answers[currentQuestion.id]} value={option} class="w-5 h-5 cursor-pointer accent-blue-500 opacity-0 absolute" on:change={validateCurrentQuestion} />
                            <div class="w-5 h-5 border-2 border-gray-300 rounded-lg group-hover:border-blue-400 transition-colors flex items-center justify-center">
                              {#if answers[currentQuestion.id]?.includes(option)}
                                <i class="fas fa-check text-blue-500 text-xs"></i>
                              {/if}
                            </div>
                          </div>
                          <span class="ml-4 text-gray-900 font-medium group-hover:text-blue-600 transition-colors">{option}</span>
                        </label>
                      {/each}
                    </div>
                  {:else if currentQuestion.type === 'yes-no'}
                    <div class="grid grid-cols-2 gap-4">
                      {#each ['Yes', 'No'] as option}
                        <label class="flex items-center justify-center p-4 border-2 {answers[currentQuestion.id] === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'} rounded-xl cursor-pointer transition-all duration-200 group">
                          <input type="radio" bind:group={answers[currentQuestion.id]} value={option} class="w-5 h-5 cursor-pointer accent-blue-500 opacity-0 absolute" on:change={validateCurrentQuestion} />
                          <span class="text-lg font-bold {answers[currentQuestion.id] === option ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-600'} transition-colors">{option}</span>
                        </label>
                      {/each}
                    </div>
                  {:else if currentQuestion.type === 'rating'}
                    <div class="flex gap-6 justify-center py-6">
                      {#each [1, 2, 3, 4, 5] as rating}
                        <button on:click={() => { answers[currentQuestion.id] = rating; validateCurrentQuestion(); }} class="transition-all duration-200 cursor-pointer text-5xl {answers[currentQuestion.id] >= rating ? 'text-yellow-400 scale-125 drop-shadow-lg' : 'text-gray-300 hover:text-yellow-300 scale-100 hover:scale-110'}">
                          <i class="fas fa-star"></i>
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

    <!-- Navigation -->
    <div class="flex gap-6 items-center justify-between pt-6">
      <button on:click={prevQuestion} disabled={currentQuestionIndex === 0} class="px-6 py-3 text-gray-700 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 disabled:hover:border-gray-200 disabled:hover:bg-transparent">
        <i class="fas fa-arrow-left"></i> Previous
      </button>
      <div class="text-xs text-gray-400 hidden md:block"><i class="fas fa-keyboard mr-1"></i>Press Enter to continue</div>
      {#if currentQuestionIndex < questions.length - 1}
        <button on:click={nextQuestion} disabled={!canAdvanceValue} class="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2 disabled:shadow-none">
          Next <i class="fas fa-arrow-right"></i>
        </button>
      {:else}
        <button on:click={submitForm} disabled={!canAdvanceValue || isSubmitting} class="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2 disabled:shadow-none">
          {#if isSubmitting}
            <i class="fas fa-spinner fa-spin"></i> Submitting...
          {:else}
            <i class="fas fa-check"></i> Submit
          {/if}
        </button>
      {/if}
    </div>
  {:else}
    <div class="text-center py-12">
      <p class="text-gray-500">Add questions to preview your form</p>
    </div>
  {/if}
  </div>
</div>

<style>
  .animation-stage {
    min-height: 280px;
    border-radius: 2rem;
    border: 1px solid rgba(229, 231, 235, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 2rem;
    position: relative;
  }

  .animation-stage--fade {
    animation: previewFade 3s ease-in-out infinite;
  }

  .animation-stage--slide {
    animation: previewSlide 2.8s ease-in-out infinite;
  }

  .animation-stage--pulse {
    animation: previewPulse 2.4s ease-in-out infinite;
  }

  .animation-stage img {
    max-height: 100%;
    max-width: 100%;
    border-radius: 1rem;
    object-fit: contain;
  }

  @keyframes previewFade {
    0% {
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes previewSlide {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    30% {
      opacity: 1;
      transform: translateY(0);
    }
    70% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-30px);
    }
  }

  @keyframes previewPulse {
    0% {
      opacity: 0;
      transform: scale(0.85);
    }
    30% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.08);
    }
    70% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.15);
    }
  }
</style>