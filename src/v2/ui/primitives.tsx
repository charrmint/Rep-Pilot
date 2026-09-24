import Link from "next/link";
import type {
  ButtonLinkProps,
  ButtonProps,
  CardProps,
  InputProps,
  PageHeaderProps,
} from "../types";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`v2-button v2-button--${variant} ${className}`}
    />
  );
}
export function ButtonLink({
  href,
  children,
  variant = "primary",
}: ButtonLinkProps) {
  return (
    <Link href={href} className={`v2-button v2-button--${variant}`}>
      {children}
    </Link>
  );
}
export function Card({ children, className = "" }: CardProps) {
  return <section className={`v2-card ${className}`}>{children}</section>;
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <header className="v2-page-header">
      <div>
        <p className="v2-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="v2-description">{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <label className="v2-field" htmlFor={id}>
      <span>{label}</span>
      <input {...props} id={id} className={`v2-input ${className}`} />
    </label>
  );
}
