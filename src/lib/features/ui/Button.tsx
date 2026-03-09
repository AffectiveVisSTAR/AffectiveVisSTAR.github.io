import { Button as HeadlessButton } from "@headlessui/react";

interface ButtonProps {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
    className?: string | null;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}

export default function Button(props: ButtonProps) {
    const {
        label,
        onClick,
        variant = "primary",
        className = "",
        disabled = false,
        type = "button",
    } = props;

    const baseStyles =
        "rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
        primary: "bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-900",
        secondary:
            "border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 focus:ring-zinc-300",
        danger:
            "border border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 focus:ring-red-300",
    };

    return (
        <HeadlessButton
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        >
            {label}
        </HeadlessButton>
    );
}
