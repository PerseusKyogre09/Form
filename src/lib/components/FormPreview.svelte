<!-- src/lib/components/FormPreview.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { gsap } from "gsap";
  import { Draggable } from "gsap/dist/Draggable";
  import { isValidPhoneNumber } from "libphonenumber-js";
  import type {
    Question,
    Constraint,
    FormElement,
    AnimationType,
    Theme,
  } from "../types";
  import { isBlockElement } from "../types";
  import {
    formatText,
    getTextSizeClass,
    getFontFamilyClass,
    getTextAlignClass,
  } from "../utils/textFormatter";
  import {
    slideQuestion,
    animateProgress,
    shakeElement,
    bounceError,
    slideDropdown,
    slideDropdownOut,
    slideInRight,
    slideOutLeft,
    zoomIn,
    bounceIn,
    flipIn,
    staggerElements,
    animateCheckmark,
  } from "../animations";

  gsap.registerPlugin(Draggable);

  export let questions: FormElement[] = [];
  export let formId: string;
  export let onSubmit: (answers: Record<string, any>) => void;
  export let isClosed: boolean = false;
  export let backgroundType: "color" | "image" = "color";
  export let backgroundColor: string = "#f8fafc";
  export let backgroundImage: string = "";
  export let theme: Theme | undefined = undefined;

  let currentQuestionIndex = 0;
  let answers: Record<string, any> = {};
  let phoneCountries: Record<string, string> = {};
  let container: HTMLElement;
  let progressBar: HTMLElement;
  let questionContainer: HTMLElement;
  let validationError = "";
  let isSubmitting = false;
  let validationElement: HTMLElement;
  let currentElement: FormElement | undefined;
  let currentQuestion: Question | undefined;
  let animationTimer: ReturnType<typeof setTimeout> | null = null;
  let showBlurredImage = true;

  // Country code to country name mapping
  const countryOptions = [
    { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
    { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
    { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
    { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
    { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
    { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
    { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
    { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
    { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
    { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
    { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
    { code: "HK", name: "Hong Kong", dialCode: "+852", flag: "🇭🇰" },
    { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
    { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
    { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
    { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
    { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
    { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳" },
    { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
    { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭" },
    { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭" },
    { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
    { code: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳" },
    { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰" },
    { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩" },
    { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰" },
    { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
    { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪" },
    { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬" },
    { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
    { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸" },
    { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
    { code: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪" },
    { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪" },
    { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭" },
    { code: "AT", name: "Austria", dialCode: "+43", flag: "🇦🇹" },
    { code: "PL", name: "Poland", dialCode: "+48", flag: "🇵🇱" },
    { code: "CZ", name: "Czech Republic", dialCode: "+420", flag: "🇨🇿" },
    { code: "RU", name: "Russia", dialCode: "+7", flag: "🇷🇺" },
  ];

  let openCountryDropdown: string | null = null;
  let countrySearchQuery = "";
  let highlightedCountryIndex = 0;

  function getFilteredCountries(query: string) {
    if (!query) return countryOptions;
    const lowerQuery = query.toLowerCase();
    return countryOptions.filter(
      (c) =>
        c.code.toLowerCase().includes(lowerQuery) ||
        c.name.toLowerCase().includes(lowerQuery),
    );
  }

  function handleCountrySearch(e: KeyboardEvent, questionId: string) {
    const filteredCountries = getFilteredCountries(countrySearchQuery);

    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCountries.length > 0) {
        phoneCountries[questionId] =
          filteredCountries[highlightedCountryIndex].code;
        openCountryDropdown = null;
        countrySearchQuery = "";
        highlightedCountryIndex = 0;
        validateCurrentQuestion();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      highlightedCountryIndex =
        (highlightedCountryIndex + 1) % filteredCountries.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlightedCountryIndex =
        (highlightedCountryIndex - 1 + filteredCountries.length) %
        filteredCountries.length;
    } else if (e.key === "Escape") {
      openCountryDropdown = null;
      countrySearchQuery = "";
      highlightedCountryIndex = 0;
    }
  }

  function selectCountry(questionId: string, countryCode: string) {
    phoneCountries[questionId] = countryCode;
    openCountryDropdown = null;
    countrySearchQuery = "";
    highlightedCountryIndex = 0;
    validateCurrentQuestion();
  }

  function animateIn() {
    if (container) {
      gsap.set(container, { opacity: 0, y: 30, scale: 0.95 });
      gsap.to(container, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: "cubic.out",
      });
    }

    // Setup auto-advance if current element is a block with auto-advance enabled
    if (animationTimer) clearTimeout(animationTimer);
    if (
      currentElement &&
      isBlockElement(currentElement) &&
      currentElement.enableAutoAdvance
    ) {
      // Calculate delay based on entry animation if present, otherwise just use auto-advance delay
      const delay = currentElement.autoAdvanceDelay || 3;
      animationTimer = setTimeout(() => {
        nextQuestion();
      }, delay * 1000);
    }
  }

  // Theme-related elements that need cleanup
  let themeElements: HTMLElement[] = [];

  function applyFormTheme() {
    // Remove any previously injected theme elements for this form
    cleanupTheme();

    if (!theme) return;

    // Apply external font if available
    if (theme.fontUrl) {
      const fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.href = theme.fontUrl;
      fontLink.setAttribute("data-form-theme", formId);
      document.head.appendChild(fontLink);
      themeElements.push(fontLink);
    }

    // Apply external CSS if available
    if (theme.cssUrl) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = theme.cssUrl;
      link.setAttribute("data-form-theme", formId);
      document.head.appendChild(link);
      themeElements.push(link);
    }

    // Apply custom CSS if available
    if (theme.customCss) {
      const style = document.createElement("style");
      style.setAttribute("data-form-theme", formId);
      style.textContent = theme.customCss;
      document.head.appendChild(style);
      themeElements.push(style);
    }
  }

  function cleanupTheme() {
    // Remove all theme elements for this form
    themeElements.forEach((el) => el.remove());
    themeElements = [];

    // Also remove any orphaned theme elements with this form's ID
    document
      .querySelectorAll(`[data-form-theme="${formId}"]`)
      .forEach((el) => el.remove());
  }

  onMount(() => {
    // Ensure all questions have exitAnimation set (for backward compatibility)
    questions.forEach((el) => {
      if (!isBlockElement(el) && !el.exitAnimation) {
        (el as Question).exitAnimation = "slideRight";
      }
    });

    // Apply theme if available
    applyFormTheme();

    animateIn();

    return () => {
      if (animationTimer) clearTimeout(animationTimer);
      cleanupTheme();
    };
  });

  // Re-apply theme when it changes (for preview mode)
  $: if (theme) {
    // Only apply if we're mounted (themeElements array exists)
    if (typeof document !== "undefined") {
      applyFormTheme();
    }
  }

  function validateCurrentQuestion() {
    if (!currentQuestion) return;
    const answer = answers[currentQuestion.id];

    // Clear previous validation error
    const hadError = validationError !== "";
    validationError = "";

    // Skip validation if no answer provided and question is not required
    if (!currentQuestion.required && (!answer || answer.trim?.length === 0)) {
      return;
    }

    // Validate based on question type
    if (
      currentQuestion.type === "email" &&
      answer &&
      answer.trim().length > 0
    ) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(answer.trim())) {
        validationError = "Please enter a valid email address";
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
      const constraintError = validateEmailConstraints(
        answer.trim(),
        currentQuestion.constraints,
      );
      if (constraintError) {
        validationError = constraintError;
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
    } else if (
      currentQuestion.type === "number" &&
      answer !== undefined &&
      answer !== null &&
      answer !== ""
    ) {
      const numAnswer = Number(answer);
      if (
        currentQuestion.min !== undefined &&
        numAnswer < currentQuestion.min
      ) {
        validationError = `Please enter a number of at least ${currentQuestion.min}`;
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
      if (
        currentQuestion.max !== undefined &&
        numAnswer > currentQuestion.max
      ) {
        validationError = `Please enter a number of at most ${currentQuestion.max}`;
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
      const constraintError = validateNumberConstraints(
        String(answer),
        currentQuestion.constraints,
      );
      if (constraintError) {
        validationError = constraintError;
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
    } else if (
      (currentQuestion.type === "text" ||
        currentQuestion.type === "long-text") &&
      answer &&
      answer.trim().length > 0
    ) {
      const constraintError = validateTextConstraints(
        answer.trim(),
        currentQuestion.constraints,
      );
      if (constraintError) {
        validationError = constraintError;
        if (!hadError && validationElement) {
          tick().then(() => bounceError(validationElement));
        }
        return;
      }
    } else if (
      currentQuestion.type === "phone" &&
      answer &&
      answer.trim().length > 0
    ) {
      const constraintError = validatePhoneConstraints(
        answer.trim(),
        currentQuestion.id,
        currentQuestion.constraints,
      );
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
      validationError = "This question is required";
      if (!hadError && validationElement) {
        tick().then(() => bounceError(validationElement));
      }
      return;
    }
  }

  function validateEmailConstraints(
    email: string,
    constraints?: Constraint[],
  ): string | null {
    if (!constraints || constraints.length === 0) return null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }

    for (const constraint of constraints) {
      if (constraint.type === "email-type") {
        const emailType = constraint.value as string;
        const domain = email.split("@")[1].toLowerCase();

        if (emailType === "work") {
          const workDomains = constraint.value as any;
          if (Array.isArray(workDomains.domains)) {
            if (!workDomains.domains.some((d: string) => domain.includes(d))) {
              return `Please use a work email from approved domains`;
            }
          }
        } else if (emailType === "edu") {
          const eduPatterns = [
            ".edu",
            ".edu.in",
            ".ac.in",
            ".ac.uk",
            ".edu.au",
            ".edu.br",
          ];
          if (!eduPatterns.some((pattern) => domain.endsWith(pattern))) {
            return "Please use an educational email address (.edu, .edu.in, .ac.in, etc.)";
          }
        }
      } else if (constraint.type === "email-domain") {
        const allowedDomains = constraint.value as string[];
        const domain = email.split("@")[1].toLowerCase();
        if (!allowedDomains.some((d) => domain.includes(d))) {
          return `Email must be from one of: ${allowedDomains.join(", ")}`;
        }
      }
    }
    return null;
  }

  function validateNumberConstraints(
    value: string,
    constraints?: Constraint[],
  ): string | null {
    if (!constraints || constraints.length === 0) return null;

    for (const constraint of constraints) {
      if (constraint.type === "number-format") {
        const formatConfig = constraint.value as any;
        const digitsOnly = value.replace(/\D/g, "");
        const requiredLength = formatConfig.length || 10;
        const formatType = formatConfig.type || "phone";

        if (digitsOnly.length !== requiredLength) {
          const typeLabel =
            formatType.charAt(0).toUpperCase() + formatType.slice(1);
          return `${typeLabel} must have exactly ${requiredLength} digits`;
        }
      } else if (constraint.type === "custom-regex") {
        const regexConfig = constraint.value as any;
        if (regexConfig.pattern) {
          try {
            const regex = new RegExp(regexConfig.pattern);
            if (!regex.test(value)) {
              const description = regexConfig.description || "custom pattern";
              return `Please enter a value that matches the ${description}`;
            }
          } catch (e) {
            return "Invalid regex pattern configured";
          }
        }
      }
    }
    return null;
  }

  function validateTextConstraints(
    value: string,
    constraints?: Constraint[],
  ): string | null {
    if (!constraints || constraints.length === 0) return null;

    for (const constraint of constraints) {
      if (constraint.type === "custom-regex") {
        const regexConfig = constraint.value as any;
        if (regexConfig.pattern) {
          try {
            const regex = new RegExp(regexConfig.pattern);
            if (!regex.test(value)) {
              const description = regexConfig.description || "custom pattern";
              return `Please enter a value that matches the ${description}`;
            }
          } catch (e) {
            return "Invalid regex pattern configured";
          }
        }
      } else if (constraint.type === "text-length") {
        const { min, max } = constraint.value || { min: 0, max: 1000 };
        if (value.length < (min || 0)) {
          return `Text must be at least ${min} characters long`;
        }
        if (max && value.length > max) {
          return `Text must be at most ${max} characters long`;
        }
      }
    }
    return null;
  }

  function validateSelectionConstraints(
    selectedOptions: string[],
    constraints?: Constraint[],
  ): string | null {
    if (!constraints || constraints.length === 0) return null;

    for (const constraint of constraints) {
      if (constraint.type === "selection-count") {
        const { min, max } = constraint.value || { min: 0, max: 100 };
        if (selectedOptions.length < (min || 0)) {
          return `Please select at least ${min} items`;
        }
        if (max && selectedOptions.length > max) {
          return `Please select at most ${max} items`;
        }
      }
    }
    return null;
  }

  function validateDateConstraints(
    date: string,
    constraints?: Constraint[],
  ): string | null {
    if (!constraints || constraints.length === 0) return null;

    for (const constraint of constraints) {
      if (constraint.type === "date-range") {
        const { min, max } = constraint.value || { min: "", max: "" };
        if (min && date < min) {
          return `Date must be after ${min}`;
        }
        if (max && date > max) {
          return `Date must be before ${max}`;
        }
      }
    }
    return null;
  }

  function validatePhoneConstraints(
    value: string,
    questionId: string,
    constraints?: Constraint[],
  ): string | null {
    // Get the selected country for this phone question
    const selectedCountryCode = phoneCountries[questionId];
    if (!selectedCountryCode) {
      return "Please select a country";
    }

    // Always validate phone number format using libphonenumber-js with country code
    if (!isValidPhoneNumber(value, selectedCountryCode as any)) {
      return "Please enter a valid phone number for the selected country";
    }

    // If there are additional constraints, validate those too
    if (!constraints || constraints.length === 0) return null;

    for (const constraint of constraints) {
      if (constraint.type === "custom-regex") {
        const regexConfig = constraint.value as any;
        if (regexConfig.pattern) {
          try {
            const regex = new RegExp(regexConfig.pattern);
            if (!regex.test(value)) {
              return `Please enter a valid phone number (custom format validation)`;
            }
          } catch (e) {
            return "Invalid regex pattern configured";
          }
        }
      }
    }

    return null;
  }

  function isAnswered(question: Question): boolean {
    const answer = answers[question.id];
    if (
      question.type === "text" ||
      question.type === "long-text" ||
      question.type === "email" ||
      question.type === "phone"
    ) {
      return answer && answer.trim().length > 0;
    } else if (question.type === "number") {
      if (answer === undefined || answer === null || answer === "") {
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
    } else if (question.type === "date") {
      return answer && answer.trim().length > 0;
    } else if (
      question.type === "multiple-choice" ||
      question.type === "dropdown" ||
      question.type === "yes-no"
    ) {
      return answer !== undefined && answer !== null && answer !== "";
    } else if (question.type === "checkboxes") {
      return Array.isArray(answer) && answer.length > 0;
    } else if (question.type === "rating") {
      return answer !== undefined && answer !== null;
    }
    return false;
  }

  function getValidationError(question: Question): string {
    const answer = answers[question.id];

    if (question.type === "email") {
      if (!answer || answer.trim().length === 0) {
        return "This question is required";
      }
      const constraintError = validateEmailConstraints(
        answer.trim(),
        question.constraints,
      );
      if (constraintError) return constraintError;
    } else if (question.type === "number") {
      if (answer === undefined || answer === null || answer === "") {
        return "This question is required";
      }
      const numAnswer = Number(answer);
      if (question.min !== undefined && numAnswer < question.min) {
        return `Please enter a number of at least ${question.min}`;
      }
      if (question.max !== undefined && numAnswer > question.max) {
        return `Please enter a number of at most ${question.max}`;
      }
      const constraintError = validateNumberConstraints(
        String(answer),
        question.constraints,
      );
      if (constraintError) return constraintError;
    } else if (question.type === "text" || question.type === "long-text") {
      if (!answer || answer.trim().length === 0) {
        return "This question is required";
      }
      const constraintError = validateTextConstraints(
        answer.trim(),
        question.constraints,
      );
      if (constraintError) return constraintError;
    } else if (question.type === "date") {
      if (!answer || answer.trim().length === 0) {
        return "This question is required";
      }
      const constraintError = validateDateConstraints(
        answer.trim(),
        question.constraints,
      );
      if (constraintError) return constraintError;
    } else if (question.type === "checkboxes") {
      if (question.required && (!answer || answer.length === 0)) {
        return "This question is required";
      }
      const constraintError = validateSelectionConstraints(
        answer || [],
        question.constraints,
      );
      if (constraintError) return constraintError;
    } else if (question.type === "phone") {
      if (!answer || answer.trim().length === 0) {
        return "This question is required";
      }
      const constraintError = validatePhoneConstraints(
        answer.trim(),
        question.id,
        question.constraints,
      );
      if (constraintError) return constraintError;
    }

    if (!isAnswered(question)) {
      return "This question is required";
    }
    return "";
  }

  function getAnimationExitDuration(animationType: string): number {
    const durations: Record<string, number> = {
      fade: 0.6,
      slide: 0.7,
      pulse: 0.5,
      bounce: 0.5,
      zoom: 0.4,
      flip: 0.6,
      rotate: 0.6,
      slideLeft: 0.5,
      slideRight: 0.5,
      wobble: 0.5,
      heartbeat: 0.4,
      swing: 0.4,
      tada: 0.5,
      jello: 0.32,
      blink: 0.6,
    };
    return durations[animationType] || 0.5;
  }

  function applyAnimationExit() {
    if (!currentElement || !isBlockElement(currentElement)) return;

    const animationType = currentElement.exitAnimation;
    if (!animationType) {
      // No exit animation, just fade out
      gsap.to(container, { opacity: 0, duration: 0.3, ease: "power2.in" });
      return;
    }
    const duration = getAnimationExitDuration(animationType);

    // Apply exit animation based on type
    switch (animationType) {
      case "fade":
        gsap.to(container, { opacity: 0, duration, ease: "power2.in" });
        break;
      case "slide":
        gsap.to(container, { opacity: 0, y: -30, duration, ease: "power2.in" });
        break;
      case "pulse":
        gsap.to(container, {
          opacity: 0,
          scale: 0.5,
          duration,
          ease: "back.in(1.5)",
        });
        break;
      case "bounce":
        gsap.to(container, {
          opacity: 0,
          scale: 0.3,
          y: -50,
          duration,
          ease: "back.in(1.5)",
        });
        break;
      case "zoom":
        gsap.to(container, {
          opacity: 0,
          scale: 0.3,
          duration,
          ease: "back.in(1.5)",
        });
        break;
      case "flip":
        gsap.to(container, {
          opacity: 0,
          rotationY: -180,
          scale: 0.8,
          duration,
          ease: "cubic.in",
        });
        break;
      case "rotate":
        gsap.to(container, {
          opacity: 0,
          rotationZ: -180,
          scale: 0.8,
          duration,
          ease: "cubic.in",
        });
        break;
      case "slideLeft":
        gsap.to(container, {
          opacity: 0,
          x: -100,
          rotationY: 10,
          duration,
          ease: "power3.in",
        });
        break;
      case "slideRight":
        gsap.to(container, {
          opacity: 0,
          x: 100,
          rotationY: -10,
          duration,
          ease: "power3.in",
        });
        break;
      case "wobble":
        gsap.to(container, {
          opacity: 0,
          rotationZ: -5,
          duration,
          ease: "power2.in",
        });
        break;
      case "heartbeat":
        gsap.to(container, {
          opacity: 0,
          scale: 0.9,
          duration,
          ease: "power2.in",
        });
        break;
      case "swing":
        gsap.to(container, {
          opacity: 0,
          rotationZ: -5,
          duration,
          ease: "power2.in",
        });
        break;
      case "tada":
        gsap.to(container, {
          opacity: 0,
          rotationZ: 5,
          scale: 0.9,
          duration,
          ease: "power2.in",
        });
        break;
      case "jello":
        gsap.to(container, {
          opacity: 0,
          skewX: 12.5,
          duration,
          ease: "power2.in",
        });
        break;
      case "blink":
        gsap.to(container, { opacity: 0, duration, ease: "power2.in" });
        break;
      default:
        gsap.to(container, { opacity: 0, duration: 0.3, ease: "power2.in" });
    }
  }

  function applyQuestionExitAnimation(animationType?: AnimationType) {
    if (!animationType) {
      // No animation, just fade
      gsap.to(container, { opacity: 0, duration: 0.3, ease: "power2.in" });
      return;
    }

    const duration = getAnimationExitDuration(animationType);

    // Apply exit animation based on type
    switch (animationType) {
      case "fade":
        gsap.to(container, { opacity: 0, duration, ease: "power2.in" });
        break;
      case "slide":
        gsap.to(container, { opacity: 0, y: -30, duration, ease: "power2.in" });
        break;
      case "pulse":
        gsap.to(container, {
          opacity: 0,
          scale: 0.5,
          duration,
          ease: "back.in(1.5)",
        });
        break;
      case "bounce":
        gsap.to(container, {
          opacity: 0,
          scale: 0.3,
          y: -50,
          duration,
          ease: "back.in(1.5)",
        });
        break;
      case "zoom":
        gsap.to(container, {
          opacity: 0,
          scale: 0.3,
          duration,
          ease: "back.in(1.5)",
        });
        break;
      case "flip":
        gsap.to(container, {
          opacity: 0,
          rotationY: -180,
          scale: 0.8,
          duration,
          ease: "cubic.in",
        });
        break;
      case "rotate":
        gsap.to(container, {
          opacity: 0,
          rotationZ: -180,
          scale: 0.8,
          duration,
          ease: "cubic.in",
        });
        break;
      case "slideLeft":
        gsap.to(container, {
          opacity: 0,
          x: -100,
          rotationY: 10,
          duration,
          ease: "power3.in",
        });
        break;
      case "slideRight":
        gsap.to(container, {
          opacity: 0,
          x: 100,
          rotationY: -10,
          duration,
          ease: "power3.in",
        });
        break;
      case "wobble":
        gsap.to(container, {
          opacity: 0,
          rotationZ: -5,
          duration,
          ease: "power2.in",
        });
        break;
      case "heartbeat":
        gsap.to(container, {
          opacity: 0,
          scale: 0.9,
          duration,
          ease: "power2.in",
        });
        break;
      case "swing":
        gsap.to(container, {
          opacity: 0,
          rotationZ: -5,
          duration,
          ease: "power2.in",
        });
        break;
      case "tada":
        gsap.to(container, {
          opacity: 0,
          rotationZ: 5,
          scale: 0.9,
          duration,
          ease: "power2.in",
        });
        break;
      case "jello":
        gsap.to(container, {
          opacity: 0,
          skewX: 12.5,
          duration,
          ease: "power2.in",
        });
        break;
      case "blink":
        gsap.to(container, { opacity: 0, duration, ease: "power2.in" });
        break;
      default:
        gsap.to(container, { opacity: 0, duration: 0.3, ease: "power2.in" });
    }
  }

  function transitionStep(direction: "next" | "prev") {
    const delta = direction === "next" ? 1 : -1;
    const targetIndex = currentQuestionIndex + delta;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    // Kill draggable during transition
    // Check if next element is a block OR if current is a block

    // Check if next element is a block OR if current is a block
    const nextElement = questions[targetIndex];
    const isNextBlock = isBlockElement(nextElement);
    const isCurrentBlock = currentElement && isBlockElement(currentElement);

    if (isCurrentBlock) {
      // Exiting a block - use its exit animation type
      const exitAnimationType = (currentElement as any).exitAnimation;
      const exitDuration = exitAnimationType
        ? getAnimationExitDuration(exitAnimationType)
        : 0.3;

      // Apply exit animation and then fade in the next element
      let exitAnimation: any = {
        opacity: 0,
        duration: exitDuration,
        ease: "power2.in",
      };

      switch (exitAnimationType) {
        case "fade":
          exitAnimation = {
            opacity: 0,
            duration: exitDuration,
            ease: "power2.in",
          };
          break;
        case "slide":
          exitAnimation = {
            opacity: 0,
            y: -30,
            duration: exitDuration,
            ease: "power2.in",
          };
          break;
        case "pulse":
          exitAnimation = {
            opacity: 0,
            scale: 0.5,
            duration: exitDuration,
            ease: "back.in(1.5)",
          };
          break;
        case "bounce":
          exitAnimation = {
            opacity: 0,
            scale: 0.3,
            y: -50,
            duration: exitDuration,
            ease: "back.in(1.5)",
          };
          break;
        case "zoom":
          exitAnimation = {
            opacity: 0,
            scale: 0.3,
            duration: exitDuration,
            ease: "back.in(1.5)",
          };
          break;
        case "flip":
          exitAnimation = {
            opacity: 0,
            rotationY: -180,
            scale: 0.8,
            duration: exitDuration,
            ease: "cubic.in",
          };
          break;
        case "rotate":
          exitAnimation = {
            opacity: 0,
            rotationZ: -180,
            scale: 0.8,
            duration: exitDuration,
            ease: "cubic.in",
          };
          break;
        case "slideLeft":
          exitAnimation = {
            opacity: 0,
            x: -100,
            rotationY: 10,
            duration: exitDuration,
            ease: "power3.in",
          };
          break;
        case "slideRight":
          exitAnimation = {
            opacity: 0,
            x: 100,
            rotationY: -10,
            duration: exitDuration,
            ease: "power3.in",
          };
          break;
        case "wobble":
          exitAnimation = {
            opacity: 0,
            rotationZ: -5,
            duration: exitDuration,
            ease: "power2.in",
          };
          break;
        case "heartbeat":
          exitAnimation = {
            opacity: 0,
            scale: 0.8,
            duration: exitDuration,
            ease: "power2.in",
          };
          break;
        case "swing":
          exitAnimation = {
            opacity: 0,
            rotationZ: 20,
            duration: exitDuration,
            ease: "cubic.in",
          };
          break;
        case "tada":
          exitAnimation = {
            opacity: 0,
            scale: 0.6,
            duration: exitDuration,
            ease: "back.in(1.5)",
          };
          break;
        case "jello":
          exitAnimation = {
            opacity: 0,
            skewY: -10,
            duration: exitDuration,
            ease: "cubic.in",
          };
          break;
        case "blink":
          exitAnimation = {
            opacity: 0,
            duration: exitDuration,
            ease: "power2.in",
          };
          break;
      }

      gsap.to(container, {
        ...exitAnimation,
        onComplete: () => {
          // Reset all transforms
          gsap.set(container, {
            clearProps: "all",
          });
          currentQuestionIndex = targetIndex;
          gsap.fromTo(
            container,
            { opacity: 0, y: 20, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "cubic.out" },
          );
        },
      });
    } else if (isNextBlock) {
      // Entering a block - just fade out current and reset transforms
      gsap.to(container, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(container, {
            clearProps: "all",
          });
          currentQuestionIndex = targetIndex;
          gsap.fromTo(
            container,
            { opacity: 0, y: 20, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "cubic.out" },
          );
        },
      });
    } else {
      // Regular question to regular question
      const currentQuestion = currentElement as Question | undefined;
      const hasExitAnimation =
        currentQuestion && currentQuestion.exitAnimation !== undefined;

      if (hasExitAnimation && currentQuestion) {
        // Use the question's exit animation
        const exitDuration = getAnimationExitDuration(
          currentQuestion.exitAnimation as AnimationType,
        );
        applyQuestionExitAnimation(
          currentQuestion.exitAnimation as AnimationType,
        );

        gsap.to(container, {
          onComplete: () => {
            gsap.set(container, {
              clearProps: "all",
            });
            currentQuestionIndex = targetIndex;
            slideQuestion(container, direction, 0.4);
          },
          delay: exitDuration,
        });
      } else {
        // Use default slide transition
        const x = direction === "next" ? 50 : -50;
        gsap.to(container, {
          opacity: 0,
          x,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            gsap.set(container, {
              clearProps: "all",
            });
            currentQuestionIndex = targetIndex;
            slideQuestion(container, direction, 0.4);
          },
        });
      }
    }
  }

  function nextQuestion() {
    if (!currentElement) return;
    if (isBlockElement(currentElement)) {
      validationError = "";
      transitionStep("next");
      return;
    }

    // Validate required questions
    if (
      currentQuestion &&
      currentQuestion.required &&
      !isAnswered(currentQuestion)
    ) {
      validationError = getValidationError(currentQuestion);
      return;
    }

    // Validate email format if email field has a value (even if optional)
    if (currentQuestion && currentQuestion.type === "email") {
      const email = answers[currentQuestion.id];
      if (email && email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          validationError = "Please enter a valid email address";
          return;
        }
        const constraintError = validateEmailConstraints(
          email.trim(),
          currentQuestion.constraints,
        );
        if (constraintError) {
          validationError = constraintError;
          return;
        }
      }
    }

    // Validate number format constraints if number field has a value
    if (currentQuestion && currentQuestion.type === "number") {
      const numValue = answers[currentQuestion.id];
      if (numValue !== undefined && numValue !== null && numValue !== "") {
        const constraintError = validateNumberConstraints(
          String(numValue),
          currentQuestion.constraints,
        );
        if (constraintError) {
          validationError = constraintError;
          return;
        }
      }
    }

    // Validate text constraints if text field has a value
    if (
      currentQuestion &&
      (currentQuestion.type === "text" || currentQuestion.type === "long-text")
    ) {
      const textValue = answers[currentQuestion.id];
      if (textValue && textValue.trim().length > 0) {
        const constraintError = validateTextConstraints(
          textValue.trim(),
          currentQuestion.constraints,
        );
        if (constraintError) {
          validationError = constraintError;
          return;
        }
      }
    }

    // Validate phone constraints if phone field has a value
    if (currentQuestion && currentQuestion.type === "phone") {
      const phoneValue = answers[currentQuestion.id];
      if (phoneValue && phoneValue.trim().length > 0) {
        const constraintError = validatePhoneConstraints(
          phoneValue.trim(),
          currentQuestion.id,
          currentQuestion.constraints,
        );
        if (constraintError) {
          validationError = constraintError;
          return;
        }
      }
    }

    validationError = "";
    if (currentQuestionIndex < questions.length - 1) {
      transitionStep("next");
    }
  }

  function handleEnter(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      nextQuestion();
    }
  }

  function prevQuestion() {
    validationError = "";
    transitionStep("prev");
  }

  async function submitForm() {
    // Check if all required questions are answered
    for (const element of questions.filter((el) => !isBlockElement(el))) {
      const question = element as Question;
      if (question.required && !isAnswered(question)) {
        validationError = `Please answer: ${question.title}`;
        return;
      }

      // Validate email format for all email fields that have values
      if (question.type === "email") {
        const email = answers[question.id];
        if (email && email.trim().length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email.trim())) {
            validationError = `Invalid email in question: ${question.title}`;
            return;
          }
          const constraintError = validateEmailConstraints(
            email.trim(),
            question.constraints,
          );
          if (constraintError) {
            validationError = constraintError;
            return;
          }
        }
      }

      // Validate number format constraints for all number fields that have values
      if (question.type === "number") {
        const numValue = answers[question.id];
        if (numValue !== undefined && numValue !== null && numValue !== "") {
          const constraintError = validateNumberConstraints(
            String(numValue),
            question.constraints,
          );
          if (constraintError) {
            validationError = constraintError;
            return;
          }
        }
      }

      // Validate text constraints for all text fields that have values
      if (question.type === "text" || question.type === "long-text") {
        const textValue = answers[question.id];
        if (textValue && textValue.trim().length > 0) {
          const constraintError = validateTextConstraints(
            textValue.trim(),
            question.constraints,
          );
          if (constraintError) {
            validationError = constraintError;
            return;
          }
        }
      }

      // Validate phone constraints for all phone fields that have values
      if (question.type === "phone") {
        const phoneValue = answers[question.id];
        if (phoneValue && phoneValue.trim().length > 0) {
          const constraintError = validatePhoneConstraints(
            phoneValue.trim(),
            question.id,
            question.constraints,
          );
          if (constraintError) {
            validationError = constraintError;
            return;
          }
        }
      }
    }

    validationError = "";
    isSubmitting = true;

    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId, answers }),
      });

      if (response.ok) {
        gsap.to(container, {
          opacity: 0,
          y: -30,
          duration: 0.3,
          onComplete: () => {
            onSubmit(answers);
          },
        });
      } else {
        validationError = "Failed to submit form. Please try again.";
        isSubmitting = false;
      }
    } catch (error) {
      console.error("Submission error:", error);
      validationError = "Error submitting form. Please try again.";
      isSubmitting = false;
    }
  }

  $: if (questions.length === 0) {
    currentQuestionIndex = 0;
  } else if (currentQuestionIndex >= questions.length) {
    currentQuestionIndex = questions.length - 1;
  }
  $: currentElement = questions[currentQuestionIndex];
  $: currentQuestion =
    currentElement && !isBlockElement(currentElement)
      ? currentElement
      : undefined;

  // Calculate only actual questions for numbering (exclude blocks)
  $: questionList = questions.filter((q) => !isBlockElement(q));
  $: currentQuestionNumber =
    currentElement && !isBlockElement(currentElement)
      ? questionList.findIndex((q) => q.id === currentElement.id) + 1
      : 0;

  $: progress = questionList.length
    ? (currentQuestionNumber / questionList.length) * 100
    : 0;
  $: canAdvanceValue =
    currentElement && answers
      ? (isBlockElement(currentElement)
          ? true
          : currentQuestion?.required
            ? isAnswered(currentQuestion)
            : true) && !validationError
      : false;

  // Animate progress bar when progress changes
  $: if (progressBar) {
    animateProgress(progressBar, progress, 0.6);
  }
</script>

<div
  class="min-h-screen py-12 px-4 relative overflow-hidden"
  style="background-color: {backgroundType === 'color'
    ? backgroundColor
    : '#1e293b'};"
>
  {#if backgroundType === "image" && backgroundImage}
    <div
      class="absolute inset-0"
      style="background-image: url('{backgroundImage}'); background-size: cover; background-position: center; background-attachment: fixed; filter: blur(0px);"
    ></div>
  {/if}
  <div class="max-w-2xl mx-auto relative z-10">
    {#if isClosed}
      <div class="min-h-screen flex items-center justify-center">
        <div
          class="text-center space-y-6 px-6 bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
        >
          <div class="text-8xl mb-4">
            <i class="fas fa-lock text-red-400"></i>
          </div>
          <h2 class="text-4xl font-bold text-white">This form is closed</h2>
          <p class="text-lg text-slate-200">
            We are no longer accepting responses for this form. Thank you for
            your interest!
          </p>
          <p class="text-sm text-slate-400 mt-8">
            If you believe this is an error, please contact the form owner.
          </p>
        </div>
      </div>
    {:else if questions.length > 0}
      <!-- Progress Bar (fixed at top) -->
      <div class="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-50">
        <div
          bind:this={progressBar}
          class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
          style="width: {progress}%"
        ></div>
      </div>

      <!-- Question Container -->
      <div class="min-h-screen flex items-center justify-center px-6 py-20">
        <div
          bind:this={container}
          class="w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-12 border border-slate-100"
        >
          {#if currentElement}
            <div>
              <div class="mb-10">
                <!-- Question Label (e.g., "QUESTION 01 — 05") -->
                {#if currentQuestion && currentQuestion.questionLabel}
                  <div
                    class="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2"
                  >
                    {currentQuestion.questionLabel}
                  </div>
                {/if}

                <!-- Question Title with Formatting -->
                <h3
                  class="{currentQuestion
                    ? getTextSizeClass(currentQuestion.fontSize || '4xl')
                    : 'text-3xl md:text-4xl'} {currentQuestion
                    ? getFontFamilyClass(currentQuestion.fontFamily || 'serif')
                    : 'font-serif'} {currentQuestion
                    ? getTextAlignClass(currentQuestion.textAlign)
                    : 'text-left'} font-medium text-slate-800 leading-tight"
                >
                  {@html formatText(
                    currentElement.title,
                    currentQuestion?.accentColor || "indigo-600",
                  )}{#if currentQuestion?.required}<span
                      class="text-red-500 ml-1">*</span
                    >{/if}
                </h3>

                <!-- Helper Text -->
                {#if currentQuestion && currentQuestion.helperText}
                  <p class="text-base text-slate-600 mt-3">
                    {currentQuestion.helperText}
                  </p>
                {/if}
              </div>

              {#if isBlockElement(currentElement)}
                <!-- Block Rendering -->
                <div
                  class="rounded-2xl overflow-hidden"
                  style="background-color: {currentElement.backgroundColor ||
                    '#ffffff'};"
                >
                  <!-- Header -->
                  {#if currentElement.headerText}
                    <div class="p-4 border-b border-white/20">
                      <h4 class="text-lg font-semibold text-white">
                        {currentElement.headerText}
                      </h4>
                    </div>
                  {/if}

                  <!-- Content -->
                  <div class="p-6 space-y-4">
                    <!-- Image -->
                    {#if currentElement.imageUrl}
                      <img
                        src={currentElement.imageUrl}
                        alt={currentElement.title || "Block image"}
                        class="max-h-64 max-w-full object-contain rounded-lg"
                      />
                    {/if}

                    <!-- Text Content -->
                    {#if currentElement.text}
                      <p
                        class="text-base leading-relaxed {currentElement.backgroundColor ===
                          'transparent' ||
                        currentElement.backgroundColor === '#ffffff' ||
                        currentElement.backgroundColor === 'white'
                          ? 'text-gray-800'
                          : 'text-white'}"
                      >
                        {currentElement.text}
                      </p>
                    {/if}
                  </div>

                  <!-- Footer -->
                  {#if currentElement.footerText}
                    <div class="p-4 border-t border-white/20">
                      <p
                        class="text-sm {currentElement.backgroundColor ===
                          'transparent' ||
                        currentElement.backgroundColor === '#ffffff' ||
                        currentElement.backgroundColor === 'white'
                          ? 'text-gray-600'
                          : 'text-white/80'}"
                      >
                        {currentElement.footerText}
                      </p>
                    </div>
                  {/if}
                </div>
              {:else if currentQuestion}
                <div>
                  <div class="space-y-10">
                    {#if currentQuestion.type === "text"}
                      <div>
                        <input
                          bind:value={answers[currentQuestion.id]}
                          placeholder={currentQuestion.placeholder ||
                            "Type your answer here..."}
                          class="w-full text-lg text-white placeholder-slate-400 bg-white/10 border-2 {validationError
                            ? 'border-red-400/50 focus:border-red-400'
                            : 'border-white/20 focus:border-blue-400'} focus:outline-none py-4 px-4 rounded-2xl transition-all duration-200 backdrop-blur-sm"
                          on:keydown={handleEnter}
                          on:input={validateCurrentQuestion}
                        />
                        {#if validationError}
                          <p
                            bind:this={validationElement}
                            class="text-red-300 text-sm mt-3 flex items-center gap-2"
                          >
                            <i class="fas fa-exclamation-circle"></i>
                            {validationError}
                          </p>
                        {:else}
                          <p class="text-xs text-slate-400 mt-3">
                            <i class="fas fa-keyboard mr-1"></i>Press Enter to
                            continue
                          </p>
                        {/if}
                      </div>
                    {:else if currentQuestion.type === "long-text"}
                      <div>
                        <textarea
                          bind:value={answers[currentQuestion.id]}
                          placeholder={currentQuestion.placeholder ||
                            "Type your answer here..."}
                          rows="5"
                          class="w-full text-lg text-white placeholder-slate-400 bg-white/10 border-2 {validationError
                            ? 'border-red-400/50 focus:border-red-400'
                            : 'border-white/20 focus:border-blue-400'} focus:outline-none py-4 px-4 rounded-2xl transition-all duration-200 resize-none backdrop-blur-sm"
                          on:keydown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              nextQuestion();
                            }
                          }}
                          on:input={validateCurrentQuestion}
                        ></textarea>
                        {#if validationError}
                          <p
                            bind:this={validationElement}
                            class="text-red-300 text-sm mt-3 flex items-center gap-2"
                          >
                            <i class="fas fa-exclamation-circle"></i>
                            {validationError}
                          </p>
                        {:else}
                          <p class="text-xs text-slate-400 mt-3">
                            <i class="fas fa-keyboard mr-1"></i>Press Enter to
                            continue, Shift+Enter for new line
                          </p>
                        {/if}
                      </div>
                    {:else if currentQuestion.type === "number"}
                      <div>
                        <input
                          type="number"
                          bind:value={answers[currentQuestion.id]}
                          min={currentQuestion.min}
                          max={currentQuestion.max}
                          placeholder={currentQuestion.placeholder ||
                            "Enter a number..."}
                          class="w-full text-lg text-white placeholder-slate-400 bg-white/10 border-2 {validationError
                            ? 'border-red-400/50 focus:border-red-400'
                            : 'border-white/20 focus:border-blue-400'} focus:outline-none py-4 px-4 rounded-2xl transition-all duration-200 backdrop-blur-sm"
                          on:keydown={handleEnter}
                          on:input={validateCurrentQuestion}
                        />
                        {#if validationError}
                          <p
                            bind:this={validationElement}
                            class="text-red-300 text-sm mt-3 flex items-center gap-2"
                          >
                            <i class="fas fa-exclamation-circle"></i>
                            {validationError}
                          </p>
                        {:else}
                          <p class="text-xs text-slate-400 mt-3">
                            <i class="fas fa-keyboard mr-1"></i>Press Enter to
                            continue
                          </p>
                        {/if}
                      </div>
                    {:else if currentQuestion.type === "email"}
                      <div>
                        <input
                          type="email"
                          bind:value={answers[currentQuestion.id]}
                          placeholder={currentQuestion.placeholder ||
                            "Enter your email..."}
                          class="w-full text-lg text-white placeholder-slate-400 bg-white/10 border-2 {validationError
                            ? 'border-red-400/50 focus:border-red-400'
                            : 'border-white/20 focus:border-blue-400'} focus:outline-none py-4 px-4 rounded-2xl transition-all duration-200 backdrop-blur-sm"
                          on:keydown={handleEnter}
                          on:input={validateCurrentQuestion}
                        />
                        {#if validationError}
                          <p
                            bind:this={validationElement}
                            class="text-red-300 text-sm mt-3 flex items-center gap-2"
                          >
                            <i class="fas fa-exclamation-circle"></i>
                            {validationError}
                          </p>
                        {:else}
                          <p class="text-xs text-slate-400 mt-3">
                            <i class="fas fa-keyboard mr-1"></i>Press Enter to
                            continue
                          </p>
                        {/if}
                      </div>
                    {:else if currentQuestion.type === "phone"}
                      <div>
                        <div class="flex gap-3 items-end">
                          <!-- Country Selector Button -->
                          <div class="flex-shrink-0 relative">
                            <button
                              type="button"
                              on:click={() => {
                                openCountryDropdown =
                                  openCountryDropdown === currentQuestion.id
                                    ? null
                                    : currentQuestion.id;
                                countrySearchQuery = "";
                                highlightedCountryIndex = 0;
                              }}
                              class="text-lg text-white outline-none bg-white/10 border-2 border-white/20 focus:border-blue-400 focus:outline-none px-4 py-4 rounded-2xl transition-all duration-200 min-w-max hover:border-white/40 backdrop-blur-sm {validationError
                                ? 'border-red-400/50'
                                : ''}"
                            >
                              {#if phoneCountries[currentQuestion.id]}
                                {countryOptions.find(
                                  (c) =>
                                    c.code ===
                                    phoneCountries[currentQuestion.id],
                                )?.flag}
                                <span class="ml-2 font-medium"
                                  >{phoneCountries[currentQuestion.id]}</span
                                >
                              {:else}
                                <i class="fas fa-globe mr-2"></i>
                                <span class="ml-2 font-medium text-slate-300"
                                  >Select</span
                                >
                              {/if}
                            </button>

                            <!-- Dropdown Menu -->
                            {#if openCountryDropdown === currentQuestion.id}
                              <div
                                class="absolute bottom-full left-0 mb-2 bg-white/10 border border-white/20 rounded-2xl shadow-2xl z-50 w-72 max-h-72 overflow-y-auto backdrop-blur-xl"
                              >
                                <input
                                  type="text"
                                  placeholder="Search country..."
                                  bind:value={countrySearchQuery}
                                  on:keydown={(e) =>
                                    handleCountrySearch(e, currentQuestion.id)}
                                  class="w-full px-4 py-3 border-b border-white/10 text-sm outline-none focus:ring-0 sticky top-0 bg-white/5 rounded-t-2xl text-white placeholder-slate-400"
                                />
                                {#each getFilteredCountries(countrySearchQuery) as country, idx}
                                  <button
                                    type="button"
                                    on:click={() =>
                                      selectCountry(
                                        currentQuestion.id,
                                        country.code,
                                      )}
                                    class="w-full text-left px-4 py-3 text-sm hover:bg-blue-500/30 transition-colors {idx ===
                                    highlightedCountryIndex
                                      ? 'bg-blue-500/50'
                                      : ''} border-b border-white/5 last:border-b-0 text-white"
                                  >
                                    <span class="text-lg mr-2"
                                      >{country.flag}</span
                                    >
                                    <span class="font-medium"
                                      >{country.code}</span
                                    >
                                    <span class="text-slate-300 ml-2"
                                      >{country.name}</span
                                    >
                                    <span class="text-slate-400 ml-1"
                                      >{country.dialCode}</span
                                    >
                                  </button>
                                {/each}
                                {#if getFilteredCountries(countrySearchQuery).length === 0}
                                  <div
                                    class="px-4 py-6 text-sm text-slate-400 text-center"
                                  >
                                    <i class="fas fa-search mb-2"></i>
                                    <p>No countries found</p>
                                  </div>
                                {/if}
                              </div>
                            {/if}
                          </div>

                          <!-- Phone Number Input -->
                          <div class="flex-1">
                            <input
                              type="tel"
                              bind:value={answers[currentQuestion.id]}
                              placeholder={currentQuestion.placeholder ||
                                "Enter your phone number..."}
                              class="w-full text-lg text-white placeholder-slate-400 bg-white/10 border-2 {validationError
                                ? 'border-red-400/50 focus:border-red-400'
                                : 'border-white/20 focus:border-blue-400'} focus:outline-none py-4 px-4 rounded-2xl transition-all duration-200 backdrop-blur-sm"
                              on:keydown={handleEnter}
                              on:input={validateCurrentQuestion}
                            />
                          </div>
                        </div>
                        {#if validationError}
                          <p
                            bind:this={validationElement}
                            class="text-red-300 text-sm mt-3 flex items-center gap-2"
                          >
                            <i class="fas fa-exclamation-circle"></i>
                            {validationError}
                          </p>
                        {:else}
                          <p class="text-xs text-slate-400 mt-3">
                            <i class="fas fa-keyboard mr-1"></i>Press Enter to
                            continue
                          </p>
                        {/if}
                      </div>
                    {:else if currentQuestion.type === "date"}
                      <div>
                        <input
                          type="date"
                          bind:value={answers[currentQuestion.id]}
                          class="w-full text-lg text-white bg-white/10 border-2 {validationError
                            ? 'border-red-400/50 focus:border-red-400'
                            : 'border-white/20 focus:border-blue-400'} focus:outline-none py-4 px-4 rounded-2xl transition-all duration-200 backdrop-blur-sm"
                        />
                        {#if validationError}
                          <p
                            bind:this={validationElement}
                            class="text-red-300 text-sm mt-3 flex items-center gap-2"
                          >
                            <i class="fas fa-exclamation-circle"></i>
                            {validationError}
                          </p>
                        {/if}
                      </div>
                    {:else if currentQuestion.type === "multiple-choice"}
                      <div class="space-y-3">
                        {#each currentQuestion.options || [] as option}
                          <label
                            class="flex items-center p-4 border-2 border-white/20 rounded-2xl cursor-pointer hover:bg-blue-500/30 hover:border-blue-400/50 transition-all duration-200 group backdrop-blur-sm"
                          >
                            <div
                              class="relative flex items-center justify-center"
                            >
                              <input
                                type="radio"
                                bind:group={answers[currentQuestion.id]}
                                value={option}
                                class="w-5 h-5 cursor-pointer accent-blue-400 opacity-0 absolute"
                                on:change={validateCurrentQuestion}
                              />
                              <div
                                class="w-5 h-5 border-2 border-white/40 rounded-full group-hover:border-blue-400 transition-colors"
                              ></div>
                              {#if answers[currentQuestion.id] === option}
                                <div
                                  class="absolute w-2.5 h-2.5 bg-blue-400 rounded-full"
                                ></div>
                              {/if}
                            </div>
                            <span
                              class="ml-4 text-white font-medium group-hover:text-blue-200 transition-colors"
                              >{option}</span
                            >
                          </label>
                        {/each}
                      </div>
                    {:else if currentQuestion.type === "dropdown"}
                      <div>
                        <select
                          bind:value={answers[currentQuestion.id]}
                          class="w-full text-lg text-white bg-white/10 border-2 {validationError
                            ? 'border-red-400/50 focus:border-red-400'
                            : 'border-white/20 focus:border-blue-400'} focus:outline-none py-4 px-4 rounded-2xl transition-all duration-200 backdrop-blur-sm"
                          on:change={validateCurrentQuestion}
                        >
                          <option
                            value=""
                            disabled
                            selected
                            class="bg-slate-800">Select an option...</option
                          >
                          {#each currentQuestion.options || [] as option}
                            <option value={option} class="bg-slate-800"
                              >{option}</option
                            >
                          {/each}
                        </select>
                        {#if validationError}
                          <p
                            bind:this={validationElement}
                            class="text-red-300 text-sm mt-3 flex items-center gap-2"
                          >
                            <i class="fas fa-exclamation-circle"></i>
                            {validationError}
                          </p>
                        {/if}
                      </div>
                    {:else if currentQuestion.type === "checkboxes"}
                      <div class="space-y-3">
                        {#each currentQuestion.options || [] as option}
                          <label
                            class="flex items-center p-4 border-2 border-white/20 rounded-2xl cursor-pointer hover:bg-blue-500/30 hover:border-blue-400/50 transition-all duration-200 group backdrop-blur-sm"
                          >
                            <div
                              class="relative flex items-center justify-center"
                            >
                              <input
                                type="checkbox"
                                bind:group={answers[currentQuestion.id]}
                                value={option}
                                class="w-5 h-5 cursor-pointer accent-blue-400 opacity-0 absolute"
                                on:change={validateCurrentQuestion}
                              />
                              <div
                                class="w-5 h-5 border-2 border-white/40 rounded-lg group-hover:border-blue-400 transition-colors flex items-center justify-center"
                              >
                                {#if answers[currentQuestion.id]?.includes(option)}
                                  <i class="fas fa-check text-blue-400 text-xs"
                                  ></i>
                                {/if}
                              </div>
                            </div>
                            <span
                              class="ml-4 text-white font-medium group-hover:text-blue-200 transition-colors"
                              >{option}</span
                            >
                          </label>
                        {/each}
                      </div>
                    {:else if currentQuestion.type === "yes-no"}
                      <div class="grid grid-cols-2 gap-4">
                        {#each ["Yes", "No"] as option}
                          <label
                            class="flex items-center justify-center p-4 border-2 {answers[
                              currentQuestion.id
                            ] === option
                              ? 'border-blue-400 bg-blue-500/30'
                              : 'border-white/20 hover:border-blue-400/50'} rounded-2xl cursor-pointer transition-all duration-200 group backdrop-blur-sm"
                          >
                            <input
                              type="radio"
                              bind:group={answers[currentQuestion.id]}
                              value={option}
                              class="w-5 h-5 cursor-pointer accent-blue-400 opacity-0 absolute"
                              on:change={validateCurrentQuestion}
                            />
                            <span
                              class="text-lg font-bold {answers[
                                currentQuestion.id
                              ] === option
                                ? 'text-blue-200'
                                : 'text-white group-hover:text-blue-200'} transition-colors"
                              >{option}</span
                            >
                          </label>
                        {/each}
                      </div>
                    {:else if currentQuestion.type === "rating"}
                      <div class="flex gap-6 justify-center py-6">
                        {#each [1, 2, 3, 4, 5] as rating}
                          <button
                            on:click={() => {
                              answers[currentQuestion.id] = rating;
                              validateCurrentQuestion();
                            }}
                            class="transition-all duration-200 cursor-pointer text-5xl {answers[
                              currentQuestion.id
                            ] >= rating
                              ? 'text-yellow-300 scale-125 drop-shadow-lg'
                              : 'text-slate-400 hover:text-yellow-200 scale-100 hover:scale-110'}"
                          >
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
      </div>

      <!-- Navigation - Premium Style -->
      <div class="fixed bottom-8 right-8 flex items-center gap-4 z-40">
        <!-- Up/Down Navigation Arrows -->
        <div class="flex flex-col gap-2">
          <button
            on:click={prevQuestion}
            disabled={currentQuestionIndex === 0}
            aria-label="Previous question"
            class="w-12 h-12 rounded-full border-2 border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-slate-700 hover:border-slate-400 disabled:hover:border-slate-300 disabled:hover:bg-white shadow-lg"
          >
            <i class="fas fa-chevron-up"></i>
          </button>
          {#if currentQuestionIndex < questions.length - 1}
            <button
              on:click={nextQuestion}
              disabled={!canAdvanceValue}
              aria-label="Next question"
              class="w-12 h-12 rounded-full border-2 border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-slate-700 hover:border-slate-400 disabled:hover:border-slate-300 disabled:hover:bg-white shadow-lg"
            >
              <i class="fas fa-chevron-down"></i>
            </button>
          {/if}
        </div>

        <!-- NEXT / Submit Button -->
        {#if currentQuestionIndex < questions.length - 1}
          <button
            on:click={nextQuestion}
            disabled={!canAdvanceValue}
            class="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-indigo-500/50 flex items-center gap-3 disabled:shadow-none"
          >
            NEXT <i class="fas fa-arrow-right"></i>
          </button>
        {:else}
          <button
            on:click={submitForm}
            disabled={!canAdvanceValue || isSubmitting}
            class="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-indigo-500/50 flex items-center gap-3 disabled:shadow-none"
          >
            {#if isSubmitting}
              <i class="fas fa-spinner fa-spin"></i> SUBMITTING...
            {:else}
              SUBMIT <i class="fas fa-check"></i>
            {/if}
          </button>
        {/if}
      </div>
    {:else}
      <div class="text-center py-12">
        <p class="text-slate-400">Add questions to preview your form</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .animation-stage {
    min-height: 280px;
    border-radius: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 2rem;
    position: relative;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }

  .animation-stage--fade {
    animation: previewFade 3s ease-in-out forwards;
  }

  .animation-stage--slide {
    animation: previewSlide 2.8s ease-in-out forwards;
  }

  .animation-stage--pulse {
    animation: previewPulse 2.4s ease-in-out forwards;
  }

  .animation-stage--bounce {
    animation: previewBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)
      forwards;
  }

  .animation-stage--zoom {
    animation: previewZoom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animation-stage--flip {
    animation: previewFlip 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  }

  .animation-stage--rotate {
    animation: previewRotate 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animation-stage--slideLeft {
    animation: previewSlideLeft 0.5s cubic-bezier(0.6, 0.04, 0.98, 0.34)
      forwards;
  }

  .animation-stage--slideRight {
    animation: previewSlideRight 0.5s cubic-bezier(0.6, 0.04, 0.98, 0.34)
      forwards;
  }

  .animation-stage--wobble {
    animation: previewWobble 0.5s ease-in-out forwards;
  }

  .animation-stage--heartbeat {
    animation: previewHeartbeat 0.4s ease-in-out forwards;
  }

  .animation-stage--swing {
    animation: previewSwing 0.4s ease-in-out forwards;
  }

  .animation-stage--tada {
    animation: previewTada 0.5s ease-in-out forwards;
  }

  .animation-stage--jello {
    animation: previewJello 0.32s ease-in-out forwards;
  }

  .animation-stage--blink {
    animation: previewBlink 0.6s ease-in-out forwards;
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
    100% {
      opacity: 1;
    }
  }

  @keyframes previewSlide {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes previewPulse {
    0% {
      opacity: 0;
      transform: scale(0.85);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes previewBounce {
    0% {
      opacity: 0;
      transform: scale(0.3) translateY(50px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes previewZoom {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes previewFlip {
    0% {
      opacity: 0;
      transform: rotateY(-180deg) scale(0.9);
    }
    100% {
      opacity: 1;
      transform: rotateY(0deg) scale(1);
    }
  }

  @keyframes previewRotate {
    0% {
      opacity: 0;
      transform: rotateZ(-180deg) scale(0.8);
    }
    100% {
      opacity: 1;
      transform: rotateZ(0deg) scale(1);
    }
  }

  @keyframes previewSlideLeft {
    0% {
      opacity: 0;
      transform: translateX(-100px) rotateY(10deg);
    }
    100% {
      opacity: 1;
      transform: translateX(0) rotateY(0deg);
    }
  }

  @keyframes previewSlideRight {
    0% {
      opacity: 0;
      transform: translateX(100px) rotateY(-10deg);
    }
    100% {
      opacity: 1;
      transform: translateX(0) rotateY(0deg);
    }
  }

  @keyframes previewWobble {
    0% {
      transform: rotateZ(3deg);
    }
    25% {
      transform: rotateZ(-3deg);
    }
    50% {
      transform: rotateZ(3deg);
    }
    75% {
      transform: rotateZ(-3deg);
    }
    100% {
      transform: rotateZ(0deg);
    }
  }

  @keyframes previewHeartbeat {
    0% {
      transform: scale(1);
    }
    25% {
      transform: scale(1.1);
    }
    50% {
      transform: scale(1);
    }
    75% {
      transform: scale(1.1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes previewSwing {
    0% {
      transform: rotateZ(5deg);
    }
    50% {
      transform: rotateZ(-5deg);
    }
    100% {
      opacity: 1;
      transform: rotateZ(0deg);
    }
  }

  @keyframes previewTada {
    0% {
      opacity: 0;
      transform: rotateZ(-3deg) scale(0.9);
    }
    25% {
      transform: rotateZ(3deg) scale(1.1);
    }
    50% {
      transform: rotateZ(-3deg) scale(0.9);
    }
    75% {
      transform: rotateZ(3deg) scale(1.1);
    }
    100% {
      opacity: 1;
      transform: rotateZ(0deg) scale(1);
    }
  }

  @keyframes previewJello {
    0% {
      transform: skewX(12.5deg);
    }
    25% {
      transform: skewX(-12.5deg);
    }
    50% {
      transform: skewX(12.5deg);
    }
    75% {
      transform: skewX(-12.5deg);
    }
    100% {
      opacity: 1;
      transform: skewX(0deg);
    }
  }

  @keyframes previewBlink {
    0% {
      opacity: 1;
    }
    20% {
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
    60% {
      opacity: 0;
    }
    80% {
      opacity: 1;
    }
    100% {
      opacity: 1;
    }
  }
</style>
