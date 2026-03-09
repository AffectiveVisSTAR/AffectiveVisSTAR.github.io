import { Field, Checkbox as HeadlessCheckbox, Label } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/16/solid";

interface CheckboxParams {
  checked: boolean;
  setChecked: (c: boolean) => void;
  className?: string | null;
  label?: string | null;
}

export default function Checkbox(props: CheckboxParams) {
  const { checked = false, setChecked, className = "", label = null } = props;

  return (
    <Field className="flex items-center gap-2 cursor-pointer">
      <HeadlessCheckbox
        checked={checked}
        onChange={setChecked}
        className={`select-none group size-6 rounded-md bg-white p-[2px] ring-1 ring-gray-600 ring-inset focus:not-data-focus:outline-none data-checked:bg-black data-focus:outline data-focus:outline-offset-2 data-focus:outline-white hover:cursor-pointer transition ${className}`}
      >
        <CheckIcon className="hidden size-5 fill-black group-data-checked:block group-data-checked:fill-white" />
      </HeadlessCheckbox>
      {label && <Label>{label}</Label>}
    </Field>

  );
}
