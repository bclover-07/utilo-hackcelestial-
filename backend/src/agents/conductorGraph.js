import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { solvePackages } from "../services/packageSolver.js";
import { measureStep } from "../services/agentRuntime.js";



export async function runConductorGraph(input, loadCandidates, { stress = true, onProgress } = {}) {
  const state = Annotation.Root({ pools: Annotation(), result: Annotation(), scenarios: Annotation(), trace: Annotation({ reducer: (a, b) => a.concat(b), default: () => [] }) });
  const node = (name, work) => async s => {
    onProgress?.({ step: name, status: "running" });
    const start = performance.now();
    let update;
    try { update = await measureStep(name, () => work(s)); }
    catch (error) { onProgress?.({ step: name, status: "failed" }); throw error; }
    const elapsedMs = Math.round(performance.now() - start);
    onProgress?.({ step: name, status: "complete", elapsedMs });
    return { ...update, trace: [{ step: name, detail: update.detail, elapsedMs }] };
  };
  const graph = new StateGraph(state)
    .addNode("Retrieve inventory", node("Retrieve inventory", async () => {
      const pools = await loadCandidates();
      return { pools, detail: `${new Set(pools.flat().map(l => l.listingId)).size} distinct candidates retrieved` };
    }))
    .addNode("Allocate packages", node("Allocate packages", async s => {
      const result = solvePackages(input.items, s.pools, input.filters, input.excludedProviders);
      return { result, detail: `${result.search.explored} allocation candidates explored` };
    }))
    .addNode("Verify constraints", node("Verify constraints", async s => {
      
      for (const option of s.result.alternatives)
        if (option.feasible && option.evidence.some(e => !e.passed)) throw new Error("Package verification failed");
      return { detail: `${s.result.alternatives.filter(p => p.feasible).length} packages pass every recorded check` };
    }))
    .addNode("Simulate recovery", node("Simulate recovery", async s => {
      const baseline = s.result.alternatives.find(p => p.feasible), scenarios = [];
      if (stress && baseline) {
        const uniqueSuppliers = [...new Set(baseline.allocations.map(a => a.providerId))].slice(0, 6);
        for (const providerId of uniqueSuppliers) {
          const recovery = solvePackages(input.items, s.pools, input.filters, [...input.excludedProviders, providerId]);
          const replacement = recovery.alternatives.find(p => p.feasible);
          scenarios.push({
            providerId,
            type: "single_dropout",
            affected: baseline.allocations.filter(a => a.providerId === providerId).map(a => a.title),
            recoverable: !!replacement,
            costChange: replacement ? Math.round((replacement.total - baseline.total) * 100) / 100 : null,
            replacementSuppliers: replacement?.supplierCount ?? null,
          });
        }
        if (uniqueSuppliers.length >= 2) {
          const pair = [uniqueSuppliers[0], uniqueSuppliers[1]];
          const recovery = solvePackages(input.items, s.pools, input.filters, [...input.excludedProviders, ...pair]);
          const replacement = recovery.alternatives.find(p => p.feasible);
          scenarios.push({
            providerId: pair.join("+"),
            type: "simultaneous_pair_shock",
            affected: baseline.allocations.filter(a => pair.includes(a.providerId)).map(a => a.title),
            recoverable: !!replacement,
            costChange: replacement ? Math.round((replacement.total - baseline.total) * 100) / 100 : null,
            replacementSuppliers: replacement?.supplierCount ?? null,
          });
        }
      }
      return { scenarios, detail: `${scenarios.filter(s => s.recoverable).length} of ${scenarios.length} tested stress scenarios have a feasible recovery` };
    }))
    .addEdge(START, "Retrieve inventory").addEdge("Retrieve inventory", "Allocate packages")
    .addEdge("Allocate packages", "Verify constraints").addEdge("Verify constraints", "Simulate recovery").addEdge("Simulate recovery", END).compile();
  return graph.invoke({});
}
