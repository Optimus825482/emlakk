import { Icon } from "@/components/ui/icon";
import { forwardRef, memo } from "react";
import { cn } from "@/lib/utils";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const InputField = memo(
  forwardRef<HTMLInputElement, InputFieldProps>(
    ({ label, error, className, required, id, name, ...props }, ref) => {
      const inputId = id || name || label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return (
        <div className="space-y-1.5">
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-300">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <input
            ref={ref}
            id={inputId}
            name={name}
            aria-required={required || undefined}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
            className={cn(
              "w-full bg-slate-900 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all",
              error
                ? "border-red-500 focus:ring-red-500/20"
                : "border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500",
              className
            )}
          />
          {error && (
            <p id={`${inputId}-error`} className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1" role="alert">
              {error}
            </p>
          )}
        </div>
      );
    }
  )
);

InputField.displayName = "InputField";

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: string[] | { value: string; label: string }[];
}

export const SelectField = memo(
  forwardRef<HTMLSelectElement, SelectFieldProps>(
    ({ label, error, options, className, id, name, ...props }, ref) => {
      const selectId = id || name || label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return (
        <div className="space-y-1.5">
          <label htmlFor={selectId} className="block text-sm font-medium text-slate-300">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <select
              ref={ref}
              id={selectId}
              name={name}
              aria-required={props.required || undefined}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? `${selectId}-error` : undefined}
              {...props}
              className={cn(
                "w-full bg-slate-900 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all appearance-none",
                error
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500",
                className
              )}
            >
              <option value="">Seçiniz</option>
              {options.map((opt) => {
                const value = typeof opt === "string" ? opt : opt.value;
                const label = typeof opt === "string" ? opt : opt.label;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
            <Icon
              name="expand_more"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
          </div>
          {error && (
            <p id={`${selectId}-error`} className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1" role="alert">
              {error}
            </p>
          )}
        </div>
      );
    }
  )
);

SelectField.displayName = "SelectField";

interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: string;
}

export const CheckboxField = memo(
  forwardRef<HTMLInputElement, CheckboxFieldProps>(
    ({ label, icon, className, id, name, ...props }, ref) => {
      const checkboxId = id || name || label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return (
        <label htmlFor={checkboxId} className="flex items-center gap-2 cursor-pointer p-3 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-all group">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            name={name}
            aria-label={label}
            {...props}
            className={cn(
              "w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer",
              className
            )}
          />
          <Icon name={icon} className="text-slate-500 text-sm group-hover:text-emerald-400 transition-colors" />
          <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
        </label>
      );
    }
  )
);

CheckboxField.displayName = "CheckboxField";
