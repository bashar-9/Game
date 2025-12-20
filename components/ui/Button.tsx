import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'danger' | 'outline';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'primary', ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn(
                "px-8 py-3 rounded text-lg font-bold uppercase tracking-wider transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                variant === 'primary' && "bg-[#00ffcc] text-black shadow-[0_0_15px_#00ffcc]",
                variant === 'danger' && "bg-[#ff0055] text-white shadow-[0_0_15px_#ff0055]",
                variant === 'outline' && "border-2 border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc]/10",
                className
            )}
            {...props}
        />
    );
});

Button.displayName = "Button";
export { Button };
