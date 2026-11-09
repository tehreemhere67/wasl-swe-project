import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { CheckIcon } from "./icons";

/** ------------------------------------------------------------------------ */
/** Buttons                                                                   */
/** ------------------------------------------------------------------------ */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function buttonClass(
  variant: ButtonVariant = "primary",
  options: { size?: "md" | "sm"; block?: boolean; className?: string } = {},
): string {
  const classes = ["btn", `btn-${variant}`];
  if (options.size === "sm") classes.push("btn-sm");
  if (options.block) classes.push("btn-block");
  if (options.className) classes.push(options.className);
  return classes.join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  block?: boolean;
}) {
  return <button {...props} className={buttonClass(variant, { size, block, className })} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  block = false,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  block?: boolean;
}) {
  return <a {...props} className={buttonClass(variant, { size, block, className })} />;
}

/** ------------------------------------------------------------------------ */
/** Status and verification badges - IR-02: the same label and appearance     */
/** everywhere.                                                              */
/** ------------------------------------------------------------------------ */

export type VerificationStatus = "pending" | "verified" | "rejected" | "suspended";

const STATUS_CLASS: Record<VerificationStatus, string> = {
  verified: "badge badge-verified",
  pending: "badge badge-pending",
  rejected: "badge badge-rejected",
  suspended: "badge badge-suspended",
};

export function StatusBadge({
  status,
  label,
  withIcon = true,
}: {
  status: VerificationStatus;
  label: string;
  withIcon?: boolean;
}) {
  return (
    <span className={STATUS_CLASS[status]}>
      {status === "verified" && withIcon ? <CheckIcon className="h-3.5 w-3.5" /> : null}
      <span>{label}</span>
    </span>
  );
}

/** The compact "Bank A ✓" treatment used all over the wireframes. */
export function VerifiedMark({ label, status }: { label: string; status: VerificationStatus }) {
  return (
    <span className={STATUS_CLASS[status]}>
      <span>{label}</span>
      {status === "verified" ? <CheckIcon className="h-3.5 w-3.5" /> : null}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "verified" | "pending" | "rejected" | "suspended";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

/** ------------------------------------------------------------------------ */
/** Form fields                                                               */
/** ------------------------------------------------------------------------ */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  optionalLabel,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optionalLabel?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-wasl-600"> *</span> : null}
        {!required && optionalLabel ? (
          <span className="ms-1 text-xs font-normal text-ink-400">({optionalLabel})</span>
        ) : null}
      </label>
      {children}
      {hint && !error ? <p className="hint">{hint}</p> : null}
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  invalid,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...props} className={`input ${invalid ? "input-error" : ""} ${className}`.trim()} />;
}

export function SelectInput({
  invalid,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select {...props} className={`input ${invalid ? "input-error" : ""} ${className}`.trim()}>
      {children}
    </select>
  );
}

export function TextArea({
  invalid,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea {...props} className={`input min-h-[6rem] ${invalid ? "input-error" : ""} ${className}`.trim()} />
  );
}

export function Checkbox({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 text-sm text-ink-800 ${className}`.trim()}>
      <input
        type="checkbox"
        {...props}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-ink-400 text-wasl-600 focus:ring-wasl-500"
      />
      <span>{label}</span>
    </label>
  );
}

/** ------------------------------------------------------------------------ */
/** Layout and feedback                                                       */
/** ------------------------------------------------------------------------ */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
      <div>
        <h2 className="text-base font-bold text-ink-950">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export type AlertTone = "info" | "success" | "warning" | "error";

const ALERT_CLASS: Record<AlertTone, string> = {
  info: "border-ink-200 bg-ink-50 text-ink-800",
  success: "border-ok-200 bg-ok-50 text-ok-900",
  warning: "border-warn-200 bg-warn-50 text-warn-900",
  error: "border-wasl-200 bg-wasl-50 text-wasl-900",
};

export function Alert({
  tone = "info",
  title,
  children,
  role,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  role?: "alert" | "status";
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${ALERT_CLASS[tone]}`} role={role}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? "mt-1" : ""}>{children}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-300 bg-white px-6 py-10 text-center">
      {icon ? <div className="text-ink-400">{icon}</div> : null}
      <p className="text-base font-semibold text-ink-900">{title}</p>
      {description ? <p className="max-w-sm text-sm text-ink-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  backLink,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backLink?: { href: string; label: string };
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {backLink ? (
          <a
            href={backLink.href}
            className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-800"
          >
            <span aria-hidden="true" className="rtl-flip">←</span> {backLink.label}
          </a>
        ) : null}
        <h1 className="screen-title">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-ink-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">{children}</h2>
      {action}
    </div>
  );
}

/** A key/value line used in detail panels. */
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}
