import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";

const SHOW_AFTER = 480;

export function ScrollToTop() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          className="focus-ring fixed bottom-6 left-6 z-[90] flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90 text-sm text-[var(--text-muted)] shadow-[var(--shadow-card)] backdrop-blur-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          aria-label={t("common.scrollTop")}
          title={t("common.scrollTop")}
        >
          ↑
        </motion.button>
      )}
    </AnimatePresence>
  );
}
