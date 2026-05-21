import { cleanupLegacyOpenkbProbes, ensureE2eSandbox, wipeSandboxBoard, openkbRoot } from "./helpers/e2eSandbox";

export default async function globalSetup() {
  const root = openkbRoot();
  cleanupLegacyOpenkbProbes(root);
  ensureE2eSandbox(root);
}
