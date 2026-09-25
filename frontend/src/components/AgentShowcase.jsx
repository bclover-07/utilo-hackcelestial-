"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { animate, createScope, stagger } from "animejs";
import { ArrowRight, ArrowUpRight, AudioLines, Bot, ChartNoAxesCombined, CheckCheck, FileSearch, GitBranch, Layers, MessagesSquare, ScanSearch, ShieldCheck, SlidersHorizontal, Sparkles, Timer, Wallet } from "lucide-react";

const journeys = [
  { label: "For seekers", title: "One brief. A connected plan.", description: "Find the resources that fit together, see the trade-offs, and test a backup before you need one.", color: "var(--teal)", steps: [
    { icon: FileSearch, title: "Understand", input: "Your event brief", output: "Editable resource requirements", detail: "The interpreter separates resources, quantities and specifications, and surfaces missing information for you to confirm." },
    { icon: Layers, title: "Assemble", input: "Reviewed needs + inventory", output: "Packages with constraint checks", detail: "The Conductor allocates quantities across suppliers, accounts for shared stock and compares rental and delivery costs." },
    { icon: GitBranch, title: "Stress-test", input: "A package + supplier exclusion", output: "Recovery options and cost changes", detail: "Simulate a supplier removal against the current snapshot. Replan against fresh inventory when you change the plan." },
    { icon: ShieldCheck, title: "Review", input: "Your selected package", output: "A request you approve", detail: "Review the evidence before inviting suppliers. Providers negotiate actual terms; a package recommendation does not reserve inventory." },
  ] },
  { label: "For providers", title: "Put idle capacity to work.", description: "Understand the market around your resources and arrive at the next conversation better prepared.", color: "var(--yellow)", steps: [
    { icon: ScanSearch, title: "Discover", input: "Your indexed listings", output: "Semantic resource discovery", detail: "Real embeddings help seekers retrieve relevant resources alongside keyword search. Index again after changing listing content." },
    { icon: Wallet, title: "Price", input: "Comparable rental rates", output: "Advice with sample sizes", detail: "See observed rates grouped by rental unit. Sparse evidence stays visible, and AI suggestions never change your listed price." },
    { icon: ChartNoAxesCombined, title: "Understand", input: "Requests + utilization", output: "Observed demand opportunities", detail: "Turn recorded activity into practical questions to explore. A current demand snapshot is clearly distinguished from a forecast." },
    { icon: MessagesSquare, title: "Negotiate", input: "Your quote + private history", output: "Trade-offs for your review", detail: "Explore price, delivery and terms with a private advisor. Your counteroffer stays yours to write and submit." },
  ] },
  { label: "For operations", title: "Keep the exchange accountable.", description: "Give every AI-assisted decision a visible process, and keep marketplace governance in human hands.", color: "var(--lavender)", steps: [
    { icon: FileSearch, title: "Observe", input: "Operational queue counts", output: "A current workload snapshot", detail: "See pending verification, open disputes, reports and held listings without sending private identity documents to a model." },
    { icon: Bot, title: "Prepare", input: "Aggregated workload", output: "Suggested review priorities", detail: "The operations copilot proposes what to inspect next. Counts alone do not establish severity, fraud or wrongdoing." },
    { icon: Timer, title: "Inspect", input: "Actual agent executions", output: "Timing and outcome history", detail: "Inspect complete, partial and failed runs, model steps and token usage where the provider supplies it." },
    { icon: CheckCheck, title: "Decide", input: "Case evidence + your judgment", output: "An audited admin action", detail: "Verification, moderation and dispute decisions remain explicit administrator actions in the existing operations workspace." },
  ] },
];
const features = [
  [ScanSearch, "Answers with receipts", "Hybrid retrieval connects each generated claim to its source listings.", "var(--sky)"],
  [GitBranch, "A plan for the what-ifs", "Check supplier-removal scenarios and inspect the cost of a replacement.", "var(--lavender)"],
  [Wallet, "Prices with context", "Observed rental rates, comparable sample sizes and specific next steps.", "var(--yellow)"],
  [MessagesSquare, "Better conversations", "Private negotiation memory and constructive communication coaching.", "var(--pink)"],
  [AudioLines, "Listen to the plan", "Play a spoken summary from the planner when voice synthesis is configured.", "var(--teal)"],
  [SlidersHorizontal, "Every decision stays yours", "Edit requirements, inspect evidence, and approve requests yourself.", "var(--peach)"],
];

export default function AgentShowcase({ destination }) {
  const [persona, setPersona] = useState(0), [active, setActive] = useState(0);
  const root = useRef(null);
  const reduced = useReducedMotion();
  const journey = journeys[persona], step = journey.steps[active], Icon = step.icon;
  useEffect(() => {
    if (reduced || !root.current) return;
    const scope = createScope({ root }).add(() => {
      animate(".agent-pipeline-wire", { strokeDashoffset: [1, 0], duration: 850, ease: "out(3)" });
      animate(".agent-pipeline-icon", { scale: [.9, 1], rotate: [-5, 0], duration: 450, delay: stagger(65), ease: "out(3)" });
    });
    return () => scope.revert();
  }, [persona, reduced]);
  return <section className="landing-section agent-showcase" ref={root} id="agent-workflows">
    <div className="landing-section-heading"><div><span className="eyebrow"><Bot size={17} /> SMALL SPECIALISTS. BIG PICTURE.</span><h2>Your team behind<br />every good exchange.</h2></div><p>Explore how the tools work together.<br />Choose a workspace, then a step.</p></div>
    <div className="agent-personas" role="group" aria-label="Explore a workspace">{journeys.map((item, index) => <button key={item.label} aria-pressed={persona === index} className={persona === index ? "is-selected" : "quiet"} onClick={() => { setPersona(index); setActive(0); }}>{item.label}{persona === index && <Sparkles size={15} />}</button>)}</div>
    <div className="agent-journey" style={{ "--journey-color": journey.color }}>
      <div className="journey-heading"><span className="journey-stamp"><Bot size={30} /></span><div><h3>{journey.title}</h3><p>{journey.description}</p></div><span className="journey-index">0{persona + 1} / 03</span></div>
      <div className="agent-pipeline"><svg viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path className="agent-pipeline-wire" pathLength="1" d="M 100 20 H 900" strokeDasharray="1" /></svg>{journey.steps.map((item, index) => { const StepIcon = item.icon; return <button key={item.title} className={`agent-pipeline-step ${index === active ? "is-active" : ""}`} aria-pressed={index === active} onClick={() => setActive(index)}><span className="agent-pipeline-icon"><StepIcon size={26} /></span><small>0{index + 1}</small><strong>{item.title}</strong></button>; })}</div>
      <AnimatePresence mode="wait" initial={false}><motion.div key={`${persona}:${active}`} className="agent-step-detail" initial={{ opacity: 0, y: reduced ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .16 }}><div className="agent-io"><div><span>INPUT</span><strong>{step.input}</strong></div><ArrowRight size={24} aria-hidden="true" /><div><span>OUTPUT</span><strong>{step.output}</strong></div></div><p><Icon size={22} />{step.detail}</p></motion.div></AnimatePresence>
    </div>
    <div className="agent-feature-grid">{features.map(([FeatureIcon, title, text, color]) => <motion.article className="agent-feature-card" key={title} style={{ "--feature-color": color }} whileHover={reduced ? undefined : { y: -5 }} transition={{ duration: .2 }}><span className="feature-icon"><FeatureIcon size={25} /></span><h3>{title}</h3><p>{text}</p></motion.article>)}</div>
    <div className="agent-showcase-cta"><p><ShieldCheck size={21} /> Real inventory. Visible gaps. Human decisions.</p><Link className="button" href={destination}>Explore your workspace <ArrowUpRight size={18} /></Link></div>
  </section>;
}
