<script lang="ts">
  // might use this for abstraction later...
  export let onSubmit;
  export let onInvalid = null;
  export let formElements = [];

  function submitForm(submitEvent: SubmitEvent) {
    // validate form
    if (false) {
      if (onInvalid) onInvalid();
    }
    if (onSubmit) onSubmit();
  }

  let formValuesModel = {};
  let formErrorsModel = {};
</script>

<form on:submit|preventDefault={submitForm} class="sf-form">
  <slot name="form_controlls">
    {#each formElements as formElement}
      <input type="text" name={formElement.name} placeholder="test input" />
    {/each}
    <button type="submit" />
  </slot>
</form>
