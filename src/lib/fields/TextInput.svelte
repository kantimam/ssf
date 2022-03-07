<script lang="ts">
  import type { ElementDefinition } from "src/api/types";
  export let elementDefinition: ElementDefinition;
  import type { FormContext, InputError } from "src/api/types";
  import { getContext } from "svelte";

  let identifier = elementDefinition.identifier;

  let inputValue: unknown = "test";
  let inputError: InputError;

  const formContext: FormContext = getContext("formContext");
  formContext.inputValuesStore.subscribe((values) => {
    inputValue = values[identifier] || "";
  });
  formContext.inputErrorsStore.subscribe((errors) => {
    inputError = errors[identifier];
  });

  function onChange(
    e: Event & { currentTarget: EventTarget & HTMLInputElement }
  ): void {
    formContext.setInputValue(identifier, (e.target as HTMLInputElement).value);
  }
  function updateError(errorObject: InputError) {
    formContext.setInputError(identifier, errorObject);
  }
</script>

<div class="text-input">
  {#if elementDefinition.label}
    <label for={elementDefinition.identifier}>
      {elementDefinition.label}
    </label>
  {/if}
  <div class="info-top">info top</div>
  <input
    type="text"
    name={elementDefinition.name}
    id={elementDefinition.identifier}
    value={inputValue}
    on:change={onChange}
  />
  {#if inputError?.message}
    <div class="info-bottom">{inputError.message}</div>
  {/if}
</div>
