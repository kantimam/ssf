<script lang="ts">
  import { nanoid } from "nanoid";
  import type { InputError } from "../../../api/types";

  export let label = "";
  export let name: string;
  export let id: string = `text-field-${nanoid}`;
  export let value: any = "";
  export let onChange;
  export let inputError: InputError | null = null;

  let floatingLabelContent: string | null = label;
</script>

<div class="text-input">
  <div class="input-wrapper">
    {#if floatingLabelContent !== ""}
      <label for={id}>
        {floatingLabelContent}
      </label>
    {/if}
    <div class="info-top">info top</div>
    <input
      type="text"
      {name}
      {id}
      {value}
      on:change={onChange}
      on:invalid={(e) => console.log(e)}
    />
  </div>
  {#if inputError?.message}
    <div class="info-bottom">{inputError.message}</div>
  {/if}
</div>

<style lang="scss">
  .text-input {
    * {
      box-sizing: border-box;
      background: unset;
    }
    .input-wrapper {
      border: 1px solid rgb(0, 0, 0);
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
