import { Field, Input as HeadlessInput, Label } from '@headlessui/react';

interface InputProps {
    type?: string | null;
    label?: string | null;
    description?: string | null;
    value: string | number | null;
    setValue: (value: string | number) => void;
}
export default function Input(props: InputProps) {
    const { label = null, value, setValue, description, type } = props;
    return (
        <Field className="flex items-center gap-2 cursor-pointer">
            {label && <Label>{label}</Label>}
            <HeadlessInput className="border rounded-lg p-0.5 px-1.5" type={type ?? "text"} name="full_name" defaultValue={value ?? ""} placeholder={description ?? ""} onChange={(e) => {
                if (setValue)
                    setValue(e.target.value);
            }} />
        </Field>
    )
}