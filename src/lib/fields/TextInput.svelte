<script lang="ts">
  import type {
    ElementDefinition,
    FormContext,
    InputError,
  } from "../../api/types";
  import { getContext } from "svelte";

  export let elementDefinition: ElementDefinition;

  const formContext: FormContext = getContext("formContext");
  let identifier = elementDefinition.identifier;

  let inputValue: unknown = "";
  let inputError: InputError;

  formContext.inputValuesStore.subscribe((values) => {
    inputValue = values[identifier] || "";
  });
  formContext.inputErrorsStore.subscribe((errors) => {
    inputError = errors[identifier];
  });

  function onChange(
    e: Event & { currentTarget: EventTarget & HTMLInputElement }
  ): void {
    updateValue((e.target as HTMLInputElement).value);
  }
  function updateValue(value: unknown) {
    formContext.setInputValue(identifier, value);
  }
  function updateError(errorObject: InputError) {
    formContext.setInputError(identifier, errorObject);
  }
</script>

<div class="text-input">
  <div class="input-wrapper">
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
      on:invalid={(e) => console.log(e)}
    />
  </div>
  {#if inputError?.message}
    <div class="info-bottom">{inputError.message}</div>
  {/if}
  <div>value: {inputValue}</div>
</div>

<style lang="scss">
  .text-input {
    * {
      box-sizing: border-box;
      background: unset;
    }
    .input-wrapper {
      border: 1px solid red;
      border-radius: 4px;
      padding: 0 12px;
      height: 32px;
      position: relative;
    }
    label {
      position: absolute;
      top: 2px;
      left: 12px;
      font-size: 10px;
      z-index: 2;
    }
    .info-top {
      position: absolute;
      display: none;
    }
    input {
      border: none;
      outline: none;
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      padding: 0;
      &:focus,
      &:focus-visible {
        border: none;
        outline: none;
      }
    }
  }
</style>
