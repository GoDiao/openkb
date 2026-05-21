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
            className="absolute inset-0 bg-black/45 backdrop-blur-[var(--backdrop-blur)]"
            aria-label={t("common.close")}
            onClick={resetAndClose}
          />
          <motion.form
            onSubmit={handleSubmit}
            className="surface-panel relative z-10 w-full max-w-md overflow-hidden p-0 ring-1 ring-[var(--border-subtle)]"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div className="border-b border-[var(--border-subtle)] bg-[var(--accent-soft)]/20 px-6 py-5">
              <h2 className="font-display m-0 text-2xl">{t("modal.newProject")}</h2>
              <p className="m-0 mt-1 text-sm text-[var(--text-muted)]">{t("modal.newProjectDesc")}</p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <label className="block">
                <span className="field-label">{t("modal.name")}</span>
                <input
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="field-input focus-ring"
                />
              </label>

              <label className="block">
                <span className="field-label">{t("modal.slug")}</span>
                <input
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  className="field-input focus-ring font-mono text-sm"
                />
              </label>

              <label className="block">
                <span className="field-label">{t("modal.repoPath")}</span>
                <input
                  required
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  placeholder="E:/path/to/your-repo"
                  className="field-input focus-ring font-mono text-sm"
                />
              </label>

              <label className="block">
                <span className="field-label">{t("modal.description")}</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="field-input focus-ring resize-none"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--border-subtle)] px-6 py-4">
              <button type="button" onClick={resetAndClose} className="btn-ghost focus-ring px-4 py-2">
                {t("common.cancel")}
              </button>
              <button type="submit" disabled={isPending} className="btn-primary focus-ring">
                {isPending ? t("common.creating") : t("common.create")}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
