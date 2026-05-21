import { wipeSandboxBoard, openkbRoot } from "./helpers/e2eSandbox";

export default async function globalTeardown() {
  wipeSandboxBoard(openkbRoot());
}
