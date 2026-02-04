import React, { type ReactNode } from "react";
import clsx from "clsx";

type Props = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

const DashboardCard: React.FC<Props> = ({
  title,
  subtitle,
  actions,
  footer,
  className,
  children,
}) => (
  <section
    className={clsx(
      "border border-gray-200 rounded-xl bg-white shadow-sm",
      "dark:border-gray-700 dark:bg-gray-900",
      "overflow-hidden",
      "w-full",
      "h-full",
      className
    )}
  >
    {(title || actions || subtitle) && (
      <div className="flex items-start justify-between gap-3 px-4 py-3 md:px-5 md:py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="min-w-0">
          {title && (
            <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-0.5 text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    )}

    {/* Give the content a minimum height to make cards visually consistent */}
    <div className="p-4 md:p-5 min-h-[320px]">{children}</div>

    {footer ? (
      <div className="px-4 py-3 md:px-5 md:py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        {footer}
      </div>
    ) : null}
  </section>
);

export default DashboardCard;
