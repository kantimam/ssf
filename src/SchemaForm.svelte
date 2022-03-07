<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  import type {
    ElementsMap,
    FormContext,
    FormDefinitionTypo3,
  } from "./api/types";
  import DynamicField from "./lib/DynamicField.svelte";

  export let formSchema: FormDefinitionTypo3;
  export let elementsMap: ElementsMap;
  setContext("elementsMapContext", elementsMap);
  setContext("formSchemaContext", formSchema);

  const inputValuesStore = writable({});
  const inputErrorsStore = writable({});
  function setInputValue(key: string, value: unknown) {
    inputValuesStore.update((state) => ({ ...state, [key]: value }));
  }
  function setInputError(key: string, value: unknown) {
    inputErrorsStore.update((state) => ({ ...state, [key]: value }));
  }
  function submitForm() {}
  const formContext: FormContext = {
    inputValuesStore: inputValuesStore,
    inputErrorsStore: inputErrorsStore,
    setInputValue,
    setInputError,
  };
  setContext("formContext", formContext);
</script>

<div class="sf-wrapper">
  <slot name="prepend-outer">
    <h1>Svelte Schema Form</h1>
  </slot>
  <form on:submit|preventDefault={submitForm} class="sf-form">
    {#each formSchema.elements as formElement}
      <DynamicField elementDefinition={formElement} {elementsMap} />
    {/each}
    <slot name="form-controls" {submitForm} {formSchema}>
      <button type="submit"> submit </button>
    </slot>
  </form>
</div>
