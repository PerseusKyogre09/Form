<!-- src/lib/components/QuestionEditor.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Question, Constraint, AnimationType } from "../types";

  export let question: Question;
  export let questionNumber: number;

  const dispatch = createEventDispatcher();
  let showConstraintDropdown = false;
  let showStylingPanel = false; // Styling panel collapsed by default

  const animationOptions: { value: AnimationType; label: string }[] = [
    { value: "fade", label: "Fade" },
    { value: "slide", label: "Slide Up" },
    { value: "pulse", label: "Pulse" },
    { value: "bounce", label: "Bounce" },
    { value: "zoom", label: "Zoom" },
    { value: "flip", label: "Flip" },
    { value: "rotate", label: "Rotate" },
    { value: "slideLeft", label: "Slide Left" },
    { value: "slideRight", label: "Slide Right" },
    { value: "wobble", label: "Wobble" },
    { value: "heartbeat", label: "Heartbeat" },
    { value: "swing", label: "Swing" },
    { value: "tada", label: "Tada" },
    { value: "jello", label: "Jello" },
    { value: "blink", label: "Blink" },
  ];

  function updateQuestion() {
    dispatch("update");
  }

  function addOption() {
    if (question.options) {
      question.options = [...question.options, ""];
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
      value:
        type === "email-type"
          ? "edu"
          : type === "custom-regex"
            ? { pattern: "", description: "" }
            : [],
    };

    question.constraints = [...question.constraints, newConstraint];
    showConstraintDropdown = false;
    updateQuestion();
  }

  function removeConstraint(id: string) {
    if (question.constraints) {
      question.constraints = question.constraints.filter((c) => c.id !== id);
      updateQuestion();
    }
  }

  function updateConstraintValue(constraint: Constraint, newValue: any) {
    constraint.value = newValue;
    updateQuestion();
  }

  const typeLabels = {
    text: "Short Text",
    "long-text": "Long Text",
    number: "Number",
    email: "Email",
    phone: "Phone Number",
    date: "Date",
    "multiple-choice": "Multiple Choice",
    dropdown: "Dropdown",
    checkboxes: "Checkboxes",
    "yes-no": "Yes/No",
    rating: "Rating",
  };

  const constraintLabels = {
    "email-type": "Email Type (edu/work)",
    "email-domain": "Email Domain Whitelist",
    "number-format": "Number Format (Phone, PIN, Aadhar, etc.)",
    "custom-regex": "Custom Pattern (Regex)",
  };

  function getAvailableConstraints() {
    if (question.type === "email") {
      return [
        { value: "email-type", label: "Email Type (edu/work)" },
        { value: "email-domain", label: "Email Domain Whitelist" },
      ];
    } else if (question.type === "number") {
      return [
        {
          value: "number-format",
          label: "Number Format (Phone, PIN, Aadhar, etc.)",
        },
      ];
    } else if (question.type === "text" || question.type === "long-text") {
      return [{ value: "custom-regex", label: "Custom Pattern (Regex)" }];
    }
    return [];
  }
</script>

<div
  class="bg-surface-light bg-surface p-8 rounded-xl border border-slate-200 custom-shadow group transition-all duration-200"
>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <div
        class="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400"
        draggable="true"
        on:dragstart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          dispatch("dragstart", e);
        }}
        on:dragend={(e) => dispatch("dragend", e)}
      >
        <span class="fas fa-grip-vertical"></span>
      </div>
      <span
        class="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg font-bold text-sm"
        >Q{questionNumber}</span
      >
      <div class="relative">
        <select
          bind:value={question.type}
          on:change={updateQuestion}
          class="appearance-none bg-slate-50 bg-slate-50 border-none rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium focus:ring-0 cursor-pointer text-slate-700"
        >
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
        <span
          class="fas fa-chevron-down absolute right-2 top-2.5 text-slate-400 pointer-events-none text-xs leading-none"
        ></span>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={question.required}
          on:change={updateQuestion}
          class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
        />
        <span class="text-sm font-medium text-slate-600">Required</span>
      </label>
      <button
        on:click={() => dispatch("delete")}
        class="text-slate-400 hover:text-red-500 transition-colors"
      >
        <span class="fas fa-trash text-lg"></span>
      </button>
    </div>
  </div>

  <div class="space-y-4">
    <input
      bind:value={question.title}
      on:input={updateQuestion}
      class="w-full bg-transparent border-none p-0 text-xl font-semibold focus:ring-0 placeholder:text-slate-300 text-slate-900"
      placeholder="Question Title (use _italic_, *bold*, __underline__, ~strikethrough~)"
      type="text"
    />

    <!-- Formatting Tip & Toggle -->
    <div class="flex items-center justify-between gap-4">
      <div class="text-xs text-slate-500 italic flex-1">
        💡 Use <code class="bg-slate-100 px-1 rounded">_text_</code> italic,
        <code class="bg-slate-100 px-1 rounded">*text*</code> bold
      </div>
      <button
        type="button"
        on:click={() => (showStylingPanel = !showStylingPanel)}
        class="text-xs font-semibold text-primary hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        <span class="fas fa-{showStylingPanel ? 'chevron-up' : 'palette'}"
        ></span>
        {showStylingPanel ? "Hide" : "Customize"}
      </button>
    </div>

    <!-- Styling Controls (Collapsible) -->
    {#if showStylingPanel}
      <div class="bg-slate-50 rounded-lg p-4 space-y-4 border border-slate-200">
        <div
          class="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3"
        >
          📝 Text Styling
        </div>

        <div class="grid grid-cols-3 gap-3">
          <!-- Font Family -->
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5"
              >Font</label
            >
            <select
              bind:value={question.fontFamily}
              on:change={updateQuestion}
              class="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value={undefined}>Default</option>
              <option value="serif">Serif (Elegant)</option>
              <option value="sans">Sans (Modern)</option>
              <option value="mono">Mono (Code)</option>
            </select>
          </div>

          <!-- Font Size -->
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5"
              >Size</label
            >
            <select
              bind:value={question.fontSize}
              on:change={updateQuestion}
              class="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value={undefined}>Default (XL)</option>
              <option value="sm">Small</option>
              <option value="base">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">XL</option>
              <option value="2xl">2XL</option>
              <option value="3xl">3XL</option>
              <option value="4xl">4XL</option>
            </select>
          </div>

          <!-- Text Alignment -->
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5"
              >Align</label
            >
            <div class="flex gap-1">
              <button
                type="button"
                on:click={() => {
                  question.textAlign = "left";
                  updateQuestion();
                }}
                class="flex-1 py-1.5 px-2 text-xs border border-slate-300 rounded-lg transition-colors {question.textAlign ===
                  'left' || !question.textAlign
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white hover:bg-slate-50'}"
              >
                <span class="fas fa-align-left"></span>
              </button>
              <button
                type="button"
                on:click={() => {
                  question.textAlign = "center";
                  updateQuestion();
                }}
                class="flex-1 py-1.5 px-2 text-xs border border-slate-300 rounded-lg transition-colors {question.textAlign ===
                'center'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white hover:bg-slate-50'}"
              >
                <span class="fas fa-align-center"></span>
              </button>
              <button
                type="button"
                on:click={() => {
                  question.textAlign = "right";
                  updateQuestion();
                }}
                class="flex-1 py-1.5 px-2 text-xs border border-slate-300 rounded-lg transition-colors {question.textAlign ===
                'right'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white hover:bg-slate-50'}"
              >
                <span class="fas fa-align-right"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Question Label (e.g. "QUESTION 01 — 05") -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">
            Question Label <span class="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            bind:value={question.questionLabel}
            on:input={updateQuestion}
            placeholder="e.g., QUESTION 01 — 05"
            class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400"
          />
        </div>

        <!-- Helper Text -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">
            Helper Text <span class="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            bind:value={question.helperText}
            on:input={updateQuestion}
            placeholder="Subtitle or description below the question"
            class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400"
          />
        </div>

        <!-- Accent Color -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">
            Accent Color <span class="text-slate-400">(for italic text)</span>
          </label>
          <select
            bind:value={question.accentColor}
            on:change={updateQuestion}
            class="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value={undefined}>Default (Indigo)</option>
            <option value="blue-600">Blue</option>
            <option value="purple-600">Purple</option>
            <option value="pink-600">Pink</option>
            <option value="red-600">Red</option>
            <option value="orange-600">Orange</option>
            <option value="green-600">Green</option>
            <option value="teal-600">Teal</option>
          </select>
        </div>
      </div>
    {/if}

    {#if question.type === "multiple-choice" || question.type === "dropdown" || question.type === "checkboxes"}
      <div class="bg-slate-50 bg-slate-50 rounded-lg p-4 space-y-3">
        {#each question.options || [] as option, i}
          <div class="flex items-center gap-2">
            <span
              class="fas {question.type === 'multiple-choice'
                ? 'fa-circle'
                : question.type === 'checkboxes'
                  ? 'fa-square'
                  : 'fa-caret-right'} text-slate-300 text-sm"
            ></span>
            <input
              bind:value={option}
              on:input={updateQuestion}
              class="flex-1 bg-transparent border-none text-sm text-slate-700 focus:ring-0 p-0"
              placeholder="Option {i + 1}"
            />
            <button
              on:click={() => removeOption(i)}
              class="text-slate-400 hover:text-red-500"
            >
              <span class="fas fa-times text-sm"></span>
            </button>
          </div>
        {/each}
        <button
          on:click={addOption}
          class="flex items-center gap-2 text-primary font-medium text-sm mt-2 hover:underline"
        >
          <span class="fas fa-plus text-sm"></span>
          Add Option
        </button>
      </div>
    {:else if question.type === "number"}
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-slate-50 bg-slate-50 rounded-lg p-3">
          <label
            class="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1"
            >Min Value</label
          >
          <input
            type="number"
            bind:value={question.min}
            on:input={updateQuestion}
            class="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-slate-700"
            placeholder="No Min"
          />
        </div>
        <div class="bg-slate-50 bg-slate-50 rounded-lg p-3">
          <label
            class="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1"
            >Max Value</label
          >
          <input
            type="number"
            bind:value={question.max}
            on:input={updateQuestion}
            class="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-slate-700"
            placeholder="No Max"
          />
        </div>
      </div>
    {:else}
      <div class="relative group/placeholder">
        <input
          disabled
          class="w-full bg-slate-50 bg-slate-50 border-slate-200 focus:border-primary focus:ring-0 rounded-lg p-4 transition-all text-slate-500 cursor-not-allowed disabled:bg-slate-100 placeholder:text-slate-400"
          placeholder={question.placeholder || "Answer will appear here..."}
          type="text"
        />
        <!-- Helper text to indicate this is a preview -->
        <div
          class="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 italic pointer-events-none opacity-50"
        >
          Preview
        </div>
      </div>
      <div class="mt-2">
        <label for="placeholder-{question.id}" class="sr-only"
          >Edit Placeholder</label
        >
        <input
          id="placeholder-{question.id}"
          bind:value={question.placeholder}
          on:input={updateQuestion}
          class="w-full bg-transparent border-none p-0 text-sm text-slate-500 focus:ring-0 placeholder:text-slate-400"
          placeholder="Edit placeholder text (optional)..."
          type="text"
        />
      </div>
    {/if}

    <!-- Constraints Area -->
    {#if getAvailableConstraints().length > 0}
      {#each question.constraints || [] as constraint (constraint.id)}
        <div class="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
          <div class="flex items-center justify-between mb-2">
            <span
              class="text-xs font-bold text-indigo-400 uppercase tracking-wide"
            >
              {constraintLabels[
                constraint.type as keyof typeof constraintLabels
              ] || constraint.type}
            </span>
            <button
              on:click={() => removeConstraint(constraint.id)}
              class="text-indigo-300 hover:text-indigo-500"
            >
              <span class="fas fa-times text-sm"></span>
            </button>
          </div>
          {#if constraint.type === "email-type"}
            <select
              value={constraint.value}
              on:change={(e) =>
                updateConstraintValue(
                  constraint,
                  (e.target as HTMLSelectElement).value,
                )}
              class="w-full bg-slate-50 bg-slate-50 border-indigo-200 rounded-lg text-sm focus:ring-primary text-slate-900"
            >
              <option value="edu">Educational (.edu, .edu.in, .ac.in)</option>
              <option value="work">Work/Corporate</option>
            </select>
          {:else if constraint.type === "email-domain"}
            <input
              type="text"
              placeholder="Comma-separated domains"
              value={Array.isArray(constraint.value)
                ? constraint.value.join(", ")
                : ""}
              on:blur={(e) => {
                const domains = (e.target as HTMLInputElement).value
                  .split(",")
                  .map((d) => d.trim())
                  .filter((d) => d);
                updateConstraintValue(constraint, domains);
              }}
              class="w-full bg-slate-50 bg-slate-50 border-indigo-200 rounded-lg text-sm focus:ring-primary text-slate-900 p-2 placeholder:text-slate-400"
            />
          {:else if constraint.type === "number-format"}
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  for="format-type"
                  class="block text-xs font-medium text-slate-600 mb-2"
                  >Format Type</label
                >
                <select
                  id="format-type"
                  value={typeof constraint.value === "string"
                    ? constraint.value
                    : (constraint.value as any)?.type || "pin"}
                  on:change={(e) => {
                    const target = e.target as HTMLSelectElement;
                    const type = target.value;
                    let defaultLength = 4;
                    if (type === "pin") defaultLength = 4;
                    else if (type === "aadhar") defaultLength = 12;
                    else if (type === "custom") defaultLength = 10;
                    updateConstraintValue(constraint, {
                      type,
                      length: defaultLength,
                    });
                  }}
                  class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 bg-slate-50 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-slate-900"
                >
                  <option value="pin">PIN Code (4 digits)</option>
                  <option value="aadhar">Aadhar (12 digits)</option>
                  <option value="custom">Custom Length</option>
                </select>
              </div>
              <div>
                <label
                  for="required-digits"
                  class="block text-xs font-medium text-slate-600 mb-2"
                  >Required Digits</label
                >
                <input
                  id="required-digits"
                  type="number"
                  min="1"
                  value={typeof constraint.value === "object" &&
                  constraint.value !== null &&
                  "length" in constraint.value
                    ? constraint.value.length
                    : 10}
                  on:blur={(e) => {
                    const target = e.target as HTMLInputElement;
                    const length = parseInt(target.value) || 10;
                    const type =
                      typeof constraint.value === "object" &&
                      constraint.value !== null &&
                      "type" in constraint.value
                        ? constraint.value.type
                        : "phone";
                    updateConstraintValue(constraint, { type, length });
                  }}
                  placeholder="Number of digits"
                  class="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-slate-50 bg-slate-50 text-slate-900"
                />
              </div>
            </div>
          {:else if constraint.type === "custom-regex"}
            <div class="space-y-2">
              <input
                type="text"
                placeholder="Description (e.g. Roll Number)"
                value={(constraint.value as any)?.description || ""}
                on:input={(e) => {
                  const currentValue = constraint.value as any;
                  updateConstraintValue(constraint, {
                    pattern: currentValue?.pattern || "",
                    description: (e.target as HTMLInputElement).value,
                  });
                }}
                class="w-full bg-slate-50 bg-slate-50 border-indigo-200 rounded-lg text-sm focus:ring-primary text-slate-900 p-2 placeholder:text-slate-400"
              />
              <input
                type="text"
                placeholder="Regex Pattern"
                value={(constraint.value as any)?.pattern || ""}
                on:input={(e) => {
                  const currentValue = constraint.value as any;
                  updateConstraintValue(constraint, {
                    pattern: (e.target as HTMLInputElement).value,
                    description: currentValue?.description || "",
                  });
                }}
                class="w-full bg-slate-50 bg-slate-50 border-indigo-200 rounded-lg text-sm focus:ring-primary text-slate-900 p-2 font-mono placeholder:text-slate-400"
              />
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  <div
    class="mt-6 flex items-center justify-between border-t border-slate-100 pt-6"
  >
    <div class="relative">
      <button
        on:click={() => (showConstraintDropdown = !showConstraintDropdown)}
        class="flex items-center gap-1.5 text-primary font-semibold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors text-sm"
      >
        <span class="fas fa-plus-circle text-base"></span>
        Add constraint
      </button>
      {#if showConstraintDropdown}
        <div
          class="absolute top-full left-0 mt-2 w-56 bg-white bg-surface border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden"
        >
          {#each getAvailableConstraints() as constraint}
            <button
              on:click={() => addConstraint(constraint.value)}
              class="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 transition-colors border-b border-slate-100 last:border-0"
            >
              {constraint.label}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold text-slate-400 uppercase mr-2"
        >Exit Animation</span
      >
      <select
        bind:value={question.exitAnimation}
        on:change={updateQuestion}
        class="bg-slate-50 bg-slate-50 border-none rounded-lg text-xs font-medium focus:ring-0 cursor-pointer text-slate-600 dark:text-slate-300"
      >
        <option value={undefined}>None</option>
        {#each animationOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>
  </div>
</div>
