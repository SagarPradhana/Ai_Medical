import { useEffect } from "react";
import { FaXmark } from "react-icons/fa6";

function FuturisticModal({
  open,
  title,
  subtitle,
  icon: Icon,
  size = "lg",
  onClose,
  children,
  footer
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const widthClass =
    size === "sm"
      ? "max-w-lg"
      : size === "xl"
        ? "max-w-5xl"
        : "max-w-3xl";

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-3 sm:p-5">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[3px]"
        onClick={onClose}
        aria-label="Close modal"
      />

      <section
        className={`relative w-full ${widthClass} overflow-hidden rounded-[12px] border border-cyan-200/70 bg-white shadow-[0_24px_60px_rgba(4,34,56,0.28)]`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_42%)]" />

        <header className="relative flex items-start justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              {Icon ? (
                <span className="grid h-8 w-8 place-items-center rounded-[12px] bg-cyan-50 text-cyan-700">
                  <Icon />
                </span>
              ) : null}
              <span className="truncate">{title}</span>
            </h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[12px] border border-slate-200 bg-white px-2.5 py-2 text-slate-500 transition hover:bg-slate-50"
          >
            <FaXmark />
          </button>
        </header>

        <div className="relative max-h-[68vh] overflow-y-auto p-4 sm:p-5">{children}</div>

        {footer ? (
          <footer className="relative border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  );
}

export default FuturisticModal;
