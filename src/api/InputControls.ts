import type { FormContext, InputError } from "./types";


export function useInputControls(formContext: FormContext, inputId: string){
  let inputValue: unknown = "";
  let inputError: InputError;

  formContext.inputValuesStore.subscribe((values) => {
    inputValue = values[inputId] || "";
  });
  formContext.inputErrorsStore.subscribe((errors) => {
    inputError = errors[inputId];
  });

  function onChange(
    e: Event & { currentTarget: EventTarget & HTMLInputElement }
  ): void {
    updateValue((e.target as HTMLInputElement).value)
  }
  function updateValue(value: unknown){
    formContext.setInputValue(inputId, value);
  }
  function updateError(errorObject: InputError) {
    formContext.setInputError(inputId, errorObject);
  }

  return {inputValue, inputError, onChange, updateValue, updateError}
}