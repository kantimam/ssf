<script lang="ts">
  import type { ElementDefinition } from "../../../api/types";
  import BaseInput from "../../BaseInput.svelte";
  import TextField from "./TextField.svelte";
  export let elementDefinition: ElementDefinition;
</script>

<BaseInput
  name={elementDefinition.name}
  identfier={elementDefinition.identifier}
  let:inputValue
  let:onChange
  let:inputError
>
  <TextField
    {onChange}
    value={inputValue}
    name={elementDefinition.name}
    {inputError}
  />
</BaseInput>
