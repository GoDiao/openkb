import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ProjectLayout } from "./components/project/ProjectLayout";
import { ProjectListPage } from "./pages/ProjectListPage";
import { OverviewPage } from "./pages/project/OverviewPage";
import { KanbanPage } from "./pages/project/KanbanPage";
import { SpecPage } from "./pages/project/SpecPage";
import { PlanPage } from "./pages/project/PlanPage";
import { GraphPage } from "./pages/project/GraphPage";
import { DecisionsPage } from "./pages/project/DecisionsPage";
import { HelpPage } from "./pages/HelpPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/projects/:slug" element={<ProjectLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="spec" element={<SpecPage />} />
          <Route path="plan" element={<PlanPage />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="decisions" element={<DecisionsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
