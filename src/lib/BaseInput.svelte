<script lang="ts">
  import type { FormContext, InputError } from "src/api/types";
  import { getContext } from "svelte";

  export let identfier: string;
  export let name: string;
  export let inputId: string | null = null;
  export let className: string = "";

  let inputValue: unknown = "test";
  let inputError: unknown = "";

  const formContext: FormContext = getContext("formContext");
  formContext.inputValuesStore.subscribe((values) => {
    inputValue = values[identfier] || "";
  });
  formContext.inputErrorsStore.subscribe((errors) => {
    inputError = errors[identfier] || "";
  });

  function onChange(
    e: Event & { currentTarget: EventTarget & HTMLInputElement }
  ): void {
    formContext.setInputValue(
      //(e.target as HTMLInputElement).name,
      identfier,
      (e.target as HTMLInputElement).value
    );
  }
  function updateError(errorObject: InputError) {
    formContext.setInputError(identfier, errorObject);
  }
</script>

<div class={`input-base ${className}`}>
  <slot {formContext} {inputValue} {inputError} {onChange} {updateError}>
    <input
      type="text"
      {name}
      id={inputId}
      value={inputValue}
      on:change={onChange}
    />
  </slot>
</div>
