<script lang="ts">
  import { page } from "$app/stores";
  import FormErrorScreen from "../../../../lib/components/FormErrorScreen.svelte";

  let errorCode = 404;
  let errorMessage = "Form not found";

  $effect.pre(() => {
    if ($page.status) {
      errorCode = $page.status;
    }

    if ($page.error?.message) {
      const msg = $page.error.message;
      
      // Handle specific error messages
      switch(msg) {
        case "User not found":
          errorMessage = "The user who created this form no longer exists.";
          break;
        case "Form not found":
          errorMessage = "This form doesn't exist or may have been removed.";
          break;
        case "Form is closed":
          errorCode = 410;
          errorMessage = "This form is no longer accepting responses.";
          break;
        case "Error loading questions":
          errorCode = 500;
          errorMessage = "We encountered an error while loading the form. Please try again later.";
          break;
        default:
          errorMessage = msg || "The form you're looking for couldn't be found.";
      }
    }
  });
</script>

<FormErrorScreen {errorCode} {errorMessage} />
