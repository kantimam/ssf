<script lang="ts">
  import type { ElementDefinition } from "src/api/types";
  import { getContext } from "svelte";
  import useInputControls from "../useInputControls";

  export let elementDefinition: ElementDefinition;
  let identifier = elementDefinition.identifier;

  let { inputValue, inputError, onChange, updateValue, updateError } =
    useInputControls(getContext("formContext"), identifier);

  //$: val = inputValue;
  //$: error = inputError;
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
  <div>value: {inputValue}</div>
</div>
