"use client";

import { useMemo, useState } from "react";

type Track = "launch" | "dispatch";
type Autonomy = "assist" | "supervised" | "policy";

const launchSteps = [
  {
    number: "01",
    title: "Choose your route",
    copy: "Compare rent, lease, and buy paths before you take on a truck payment.",
  },
  {
    number: "02",
    title: "Build your readiness plan",
    copy: "Organize the business, registration, insurance, and operating milestones in one clear checklist.",
  },
  {
    number: "03",
    title: "Connect your tools",
    copy: "Bring your approved load board, ELD, accounting, and communication accounts into one operating view.",
  },
  {
    number: "04",
    title: "Run with a co-pilot",
    copy: "Score freight, plan the trip, capture documents, close the load, and review the numbers.",
  },
];

const operations = [
  ["Freight intelligence", "Find, filter, rank, and explain the next best load."],
  ["Dispatch execution", "Build dispatch plans, appointment tasks, and status updates."],
  ["Trip optimization", "Coordinate route, fuel, parking, weather, and dwell signals."],
  ["Documents & cash flow", "Prepare the POD-to-invoice workflow and maintain the glovebox."],
  ["Safety & compliance", "Surface deadlines, HOS signals, equipment issues, and exceptions."],
  ["Growth & executive", "Monitor outcomes, support customers, and strengthen the business."],
];

const equipmentPaths = [
  {
    name: "Rent while you validate",
    label: "Rent",
    copy: "Best for testing lanes, establishing a routine, or taking a short-term opportunity without committing to ownership.",
    link: "https://www.ryder.com/en-us/commercial-truck-rental",
    source: "Explore commercial rental",
  },
  {
    name: "Lease with a plan",
    label: "Lease",
    copy: "Best when you want predictable access to equipment and a clear runway to learn your operating costs.",
    link: "https://www.pensketruckrental.com/truck-rental/commercial-truck-rental.aspx",
    source: "Explore commercial leasing",
  },
  {
    name: "Buy when your math is ready",
    label: "Buy",
    copy: "Best when you have a documented budget, maintenance reserve, insurance plan, and sustainable freight strategy.",
    link: "https://www.truckpaper.com/",
    source: "Browse commercial inventory",
  },
];

const autonomyDetails: Record<Autonomy, { title: string; description: string; bullets: string[] }> = {
  assist: {
    title: "Assist mode",
    description: "PHI analyzes, organizes, and drafts. You remain the decision-maker for every external action.",
    bullets: ["Load and route explanations", "Draft broker and customer updates", "Readiness and document checklists"],
  },
  supervised: {
    title: "Supervised mode",
    description: "PHI keeps the operation moving and asks you only when a decision, detail, or approval is required.",
    bullets: ["Queued booking recommendations", "Prepared dispatch plans", "Approval-based customer updates"],
  },
  policy: {
    title: "Policy-controlled mode",
    description: "PHI follows the operating boundaries you configure and records every action in an auditable activity trail.",
    bullets: ["Rate, lane, equipment, and broker rules", "Automatic non-binding workflow steps", "Mandatory exception escalation"],
  },
};

export default function UnifiedPHIExperience() {
  const [track, setTrack] = useState<Track>("launch");
  const [autonomy, setAutonomy] = useState<Autonomy>("supervised");
  const [equipment, setEquipment] = useState("Dry Van");
  const [planReady, setPlanReady] = useState(false);
  const [showAllPods, setShowAllPods] = useState(false);

  const plan = useMemo(() => {
    if (track === "launch") {
      return {
        eyebrow: "Your first 30 days",
        title: "A clean route from CDL to operating business.",
        items: [
          ["Week 1", "Business identity, authority path, insurance questions, and equipment plan."],
          ["Week 2", "Truck decision, operating-cost budget, banking and tool connections."],
          ["Week 3", "Dispatch policies, freight preferences, document workflow, and safety calendar."],
          ["Week 4", "First-load readiness review, daily operating rhythm, and profit baseline."],
        ],
      };
    }

    return {
      eyebrow: "Your operations plan",
      title: "Turn your existing operation into a calmer, more visible dispatch system.",
      items: [
        ["Connect", "Connect approved freight, ELD, accounting, and communications tools."],
        ["Configure", "Set equipment, minimum rate, deadhead, lanes, broker, and escalation policies."],
        ["Operate", "Review load recommendations, dispatch tasks, trip milestones, and document closeout."],
        ["Improve", "Use agent activity, profit, service, and exception trends to strengthen the system."],
      ],
    };
  }, [track]);

  function selectTrack(next: Track) {
    setTrack(next);
    document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="phi-site">
      <div className="phi-topline">
        <p>One platform for the business you are building and the freight you are moving.</p>
        <a href="#assessment">Build your PHI plan</a>
      </div>

      <nav className="phi-nav" aria-label="Main navigation">
        <a className="phi-brand" href="#top" aria-label="Prince Haul Intelligence home">
          <span className="phi-crown" aria-hidden="true">PHI</span>
          <span>
            <strong>Prince Haul</strong>
            <small>Intelligence</small>
          </span>
        </a>
        <div className="phi-nav-links">
          <a href="#journey">How it works</a>
          <a href="#equipment">Equipment</a>
          <a href="#operations">Operations</a>
          <a href="#agents">AI workforce</a>
        </div>
        <a className="phi-nav-cta" href="#assessment">Start free</a>
      </nav>

      <section id="top" className="phi-hero">
        <div className="phi-hero-copy">
          <p className="phi-eyebrow"><span className="phi-dot" /> THE NEW OPERATOR OPERATING SYSTEM</p>
          <h1>Build the business.<br /><em>Run the freight.</em></h1>
          <p className="phi-hero-text">
            PHI brings your equipment path, operating readiness, freight intelligence, dispatch, documents, and profit signals into one calm command center.
          </p>
          <div className="phi-hero-actions">
            <button className="phi-button phi-button-primary" onClick={() => selectTrack("launch")}>
              I&apos;m starting a trucking business
            </button>
            <button className="phi-button phi-button-ghost" onClick={() => selectTrack("dispatch")}>
              I&apos;m already running trucks
            </button>
          </div>
          <div className="phi-proof-row" aria-label="PHI feature highlights">
            <span>Equipment paths</span><span>Explainable AI</span><span>Policy controls</span>
          </div>
        </div>

        <div className="phi-hero-visual" aria-label="PHI command center preview">
          <div className="phi-visual-grid" />
          <div className="phi-route-line phi-route-one" />
          <div className="phi-route-line phi-route-two" />
          <div className="phi-command-card phi-command-card-main">
            <div className="phi-card-label">TODAY&apos;S COMMAND CENTER</div>
            <div className="phi-command-topline">
              <div>
                <span className="phi-live"><i /> Operations active</span>
                <h2>Good morning, Marcus.</h2>
              </div>
              <div className="phi-score-ring"><b>86</b><small>readiness</small></div>
            </div>
            <div className="phi-mini-stats">
              <div><span>Next focus</span><strong>Equipment path</strong></div>
              <div><span>Autonomy</span><strong>{autonomyDetails[autonomy].title.replace(" mode", "")}</strong></div>
              <div><span>Equipment</span><strong>{equipment}</strong></div>
            </div>
            <div className="phi-load-preview">
              <div className="phi-load-icon">01</div>
              <div><small>Next guided milestone</small><strong>Connect your operating tools</strong></div>
              <span>Open</span>
            </div>
          </div>
          <div className="phi-floating-card phi-floating-card-left">
            <small>LOAD INTELLIGENCE</small><strong>Profit explained</strong><span>Rate · deadhead · fuel · risk</span>
          </div>
          <div className="phi-floating-card phi-floating-card-right">
            <small>VIRTUAL GLOVEBOX</small><strong>Documents ready</strong><span>POD → invoice packet</span>
          </div>
        </div>
      </section>

      <section className="phi-trust-strip" aria-label="What PHI coordinates">
        <span>Load boards</span><i />
        <span>ELD &amp; telematics</span><i />
        <span>Documents</span><i />
        <span>Billing workflow</span><i />
        <span>Customer updates</span>
      </section>

      <section id="journey" className="phi-section phi-journey">
        <div className="phi-section-heading">
          <p className="phi-eyebrow">ONE JOURNEY, NOT A STACK OF APPS</p>
          <h2>From your first decision<br />to your next delivery.</h2>
          <p>PHI makes the next move clear whether you are buying your first truck or coordinating a growing fleet.</p>
        </div>
        <div className="phi-journey-grid">
          {launchSteps.map((step) => (
            <article className="phi-journey-card" key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
              <div className="phi-arrow">Explore</div>
            </article>
          ))}
        </div>
      </section>

      <section id="assessment" className="phi-section phi-plan-builder">
        <div className="phi-plan-intro">
          <p className="phi-eyebrow">YOUR FIRST PHI PLAN</p>
          <h2>Start where you are.<br /><em>PHI will shape the next steps.</em></h2>
          <p>Choose your path and operating preferences. This is a planning tool, not a credit, insurance, legal, tax, or safety decision.</p>
          <div className="phi-track-toggle" role="group" aria-label="Choose your PHI path">
            <button className={track === "launch" ? "is-active" : ""} onClick={() => setTrack("launch")}>Launch my business</button>
            <button className={track === "dispatch" ? "is-active" : ""} onClick={() => setTrack("dispatch")}>Automate dispatch</button>
          </div>
        </div>
        <div className="phi-builder-card">
          <div className="phi-builder-field">
            <span>What are you operating?</span>
            <div className="phi-select-row" role="group" aria-label="Choose equipment">
              {["Dry Van", "Reefer", "Flatbed", "Local / last mile"].map((option) => (
                <button key={option} className={equipment === option ? "is-selected" : ""} onClick={() => setEquipment(option)}>{option}</button>
              ))}
            </div>
          </div>
          <div className="phi-builder-field">
            <span>How much control do you want?</span>
            <div className="phi-autonomy-options" role="group" aria-label="Choose autonomy level">
              {(Object.keys(autonomyDetails) as Autonomy[]).map((option) => (
                <button key={option} className={autonomy === option ? "is-selected" : ""} onClick={() => setAutonomy(option)}>
                  <b>{autonomyDetails[option].title}</b>
                  <small>{option === "assist" ? "You decide" : option === "supervised" ? "Approve key moves" : "Run within rules"}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="phi-builder-summary">
            <div>
              <span className="phi-summary-kicker">RECOMMENDED START</span>
              <h3>{track === "launch" ? "Business Launch Command Center" : "Autonomous Dispatch Command Center"}</h3>
              <p>{autonomyDetails[autonomy].description}</p>
            </div>
            <button className="phi-button phi-button-primary" onClick={() => setPlanReady(true)}>Build my plan</button>
          </div>
        </div>
        {planReady && (
          <div className="phi-plan-result" aria-live="polite">
            <div><p className="phi-eyebrow">{plan.eyebrow}</p><h3>{plan.title}</h3></div>
            <div className="phi-plan-steps">
              {plan.items.map(([period, content]) => <div key={period}><span>{period}</span><p>{content}</p></div>)}
            </div>
          </div>
        )}
      </section>

      <section id="equipment" className="phi-section phi-equipment-section">
        <div className="phi-equipment-copy">
          <p className="phi-eyebrow">EQUIPMENT PATHWAY HUB</p>
          <h2>Don&apos;t start with a truck.<br />Start with a plan.</h2>
          <p>Choose the equipment path that fits your readiness, operating model, and cash-flow plan. PHI keeps the decision connected to what comes next: policies, freight, documents, and daily operations.</p>
          <a className="phi-text-link" href="#assessment">Add equipment to your plan <span>→</span></a>
        </div>
        <div className="phi-equipment-grid">
          {equipmentPaths.map((path) => (
            <article className="phi-equipment-card" key={path.label}>
              <span className="phi-pill">{path.label}</span>
              <h3>{path.name}</h3>
              <p>{path.copy}</p>
              <a href={path.link} target="_blank" rel="noreferrer">{path.source} <span>↗</span></a>
            </article>
          ))}
        </div>
      </section>

      <section id="operations" className="phi-section phi-operations-section">
        <div className="phi-operations-grid">
          <div>
            <p className="phi-eyebrow">THE DISPATCH GENIE, MADE PRACTICAL</p>
            <h2>Every move has context.<br /><em>Every exception has a route.</em></h2>
            <p>PHI turns a complex load into a visible operating plan. It brings together profitability, feasibility, documents, live milestones, and the customer&apos;s own working policies.</p>
            <div className="phi-control-note">
              <span>CONTROL MODEL</span>
              <strong>{autonomyDetails[autonomy].title}</strong>
              <p>{autonomyDetails[autonomy].bullets.join(" · ")}</p>
            </div>
          </div>
          <div className="phi-ops-console">
            <div className="phi-console-header"><span>PHI LOAD COMMAND</span><i>policy checked</i></div>
            <div className="phi-console-route"><b>Dallas, TX</b><span className="phi-route-dashes" /><b>Atlanta, GA</b></div>
            <div className="phi-console-metrics">
              <div><small>Profit signal</small><strong>Strong</strong></div>
              <div><small>Deadhead</small><strong>42 mi</strong></div>
              <div><small>Risk review</small><strong>Needs check</strong></div>
            </div>
            <div className="phi-console-checks">
              <span><i /> Fits {equipment} preferences</span>
              <span><i /> Rate and lane policy checked</span>
              <span><i /> Booking requires configured approval</span>
            </div>
            <button onClick={() => document.getElementById("agents")?.scrollIntoView({ behavior: "smooth" })}>See the workforce behind the workflow <span>→</span></button>
          </div>
        </div>
      </section>

      <section id="agents" className="phi-section phi-agents-section">
        <div className="phi-agent-heading">
          <div><p className="phi-eyebrow">PHI AGENT OPERATIONS</p><h2>A workforce with<br />boundaries built in.</h2></div>
          <div><p>PHI is designed as 10 focused pods of 10 agents. Each has defined tool permissions, operating policies, audit events, quality checks, and exception escalation.</p><button className="phi-text-button" onClick={() => setShowAllPods(!showAllPods)}>{showAllPods ? "Show summary" : "See all operating pods"} <span>→</span></button></div>
        </div>
        <div className={showAllPods ? "phi-agent-pods is-expanded" : "phi-agent-pods"}>
          {(showAllPods ? operations : operations.slice(0, 4)).map(([name, copy], index) => (
            <article key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{name}</h3><p>{copy}</p></div>
              <b>10 agents</b>
            </article>
          ))}
        </div>
        <div className="phi-governance-note">
          <strong>Automation is accountable.</strong>
          <span>Every policy-controlled workflow should record a customer scope, data source, decision rule, action, outcome, and escalation path.</span>
        </div>
      </section>

      <section className="phi-section phi-glovebox">
        <div className="phi-glovebox-card">
          <div className="phi-document-stack" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <p className="phi-eyebrow">ONE-TAP PAYDAY WORKFLOW</p>
            <h2>Your signed POD should not be the start of another manual process.</h2>
            <p>Capture the paperwork, keep it organized in the Virtual Glovebox, prepare the closeout packet, and keep the earnings story visible after delivery.</p>
          </div>
          <a className="phi-button phi-button-light" href="#assessment">See your operating plan</a>
        </div>
      </section>

      <section className="phi-final-cta">
        <p className="phi-eyebrow">YOUR BUSINESS. YOUR RULES. BETTER SIGNALS.</p>
        <h2>Start with the next right move.</h2>
        <p>Whether you need your first truck, a smarter dispatch workflow, or a clearer operating picture, PHI puts the work in one place.</p>
        <div><button className="phi-button phi-button-primary" onClick={() => selectTrack("launch")}>Build my business plan</button><button className="phi-button phi-button-ghost" onClick={() => selectTrack("dispatch")}>Build my dispatch plan</button></div>
      </section>

      <footer className="phi-footer">
        <a className="phi-brand" href="#top"><span className="phi-crown">PHI</span><span><strong>Prince Haul</strong><small>Intelligence</small></span></a>
        <p>AI-powered trucking operations for owner-operators and fleets.</p>
        <span>© {new Date().getFullYear()} Prince Haul Intelligence</span>
      </footer>
    </main>
  );
}
