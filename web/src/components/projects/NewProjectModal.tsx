import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import { slugify } from "../../utils/format";
import { useEscapeKey } from "../../hooks/useEscapeKey";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { slug: string; name: string; repo_path: string; description: string }) => void;
  isPending: boolean;
};

export function NewProjectModal({ open, onClose, onSubmit, isPending }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [repoPath, setRepoPath] = useState("");
  const [description, setDescription] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ slug: slug.trim(), name: name.trim(), repo_path: repoPath.trim(), description: description.trim() });
  }

  function resetAndClose() {
    setName("");
    setSlug("");
    setRepoPath("");
    setDescription("");
    setSlugTouched(false);
    onClose();
  }

  useEscapeKey(resetAndClose, open);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[var(--backdrop-blur)]"
            aria-label={t("common.close")}
            onClick={resetAndClose}
          />
          <motion.form
            onSubmit={handleSubmit}
            className="surface-panel relative z-10 w-full max-w-md p-6"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <h2 className="font-display m-0 mb-1 text-2xl">{t("modal.newProject")}</h2>
            <p className="mt-0 mb-6 text-sm text-[var(--text-muted)]">{t("modal.newProjectDesc")}</p>

            <label className="mb-4 block text-sm">
              <span className="mb-1.5 block text-[var(--text-muted)]">{t("modal.name")}</span>
              <input
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="focus-ring w-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2.5 text-[var(--text-primary)]"
              />
            </label>

            <label className="mb-4 block text-sm">
              <span className="mb-1.5 block text-[var(--text-muted)]">{t("modal.slug")}</span>
              <input
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="focus-ring w-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)]"
              />
            </label>

            <label className="mb-4 block text-sm">
              <span className="mb-1.5 block text-[var(--text-muted)]">{t("modal.repoPath")}</span>
              <input
                required
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                placeholder="E:/path/to/your-repo"
                className="focus-ring w-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2.5 font-mono text-sm text-[var(--text-primary)]"
              />
            </label>

            <label className="mb-6 block text-sm">
              <span className="mb-1.5 block text-[var(--text-muted)]">{t("modal.description")}</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="focus-ring w-full resize-none rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2.5 text-[var(--text-primary)]"
              />
            </label>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetAndClose}
                className="focus-ring rounded-[var(--radius-card)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="focus-ring rounded-[var(--radius-card)] bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[var(--bg-base)] transition hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? t("common.creating") : t("common.create")}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
