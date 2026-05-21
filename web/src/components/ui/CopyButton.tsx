import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";

type Props = {
  text: string;
  label?: string;
  className?: string;
};

export function CopyButton({ text, label, className = "" }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={`focus-ring rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] ${className}`}
    >
      <motion.span key={copied ? "copied" : "copy"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
        {copied ? t("common.copied") : label ?? t("common.copy")}
      </motion.span>
    </button>
  );
}

type CodeProps = {
  code: string;
  className?: string;
};

export function CopyCodeBlock({ code, className = "" }: CodeProps) {
  return (
    <div className={`relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] ${className}`}>
      <CopyButton text={code} className="absolute right-2 top-2 z-10" />
      <pre className="m-0 overflow-x-auto p-3 pr-20 font-mono text-xs leading-relaxed text-[var(--accent)]">{code}</pre>
    </div>
  );
}
