"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type Lead = {
  id: string;
  full_name: string;
  email: string;
  company_name?: string | null;
  journey: "launch" | "dispatch" | "fleet";
  stage: "new" | "qualified" | "opportunity" | "won" | "lost" | "nurture";
  equipment_type?: string | null;
  truck_count: number;
  top_challenge: string;
  qualification_score: number;
  recommended_offer: string;
  owner: string;
  onboarding_status: string;
  created_at: string;
  updated_at: string;
};

type FollowUp = {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_email: string;
  sequence_step: string;
  channel: string;
  status: "ready" | "held" | "sent" | "cancelled" | "failed" | "suppressed";
  subject?: string | null;
  body: string;
  scheduled_at?: string | null;
  sent_at?: string | null;
  suppression_reason?: string | null;
  created_at: string;
};

type Appointment = {
  id: string;
  lead_id: string;
  lead_name: string;
  status: "requested" | "scheduled" | "completed" | "cancelled" | "no_show";
  booking_url?: string | null;
  host_name?: string | null;
  scheduled_for?: string | null;
  completed_at?: string | null;
  notes?: string | null;
  created_at: string;
};

type Dashboard = {
  revenue_target_mrr: number;
  verified_mrr: number;
  remaining_mrr: number;
  stage_counts: Record<string, number>;
  qualified_leads: number;
  active_followups: number;
  held_followups: number;
  appointment_counts: Record<string, number>;
  source_counts: Record<string, number>;
  conversion_notes: string[];
};

const columns: Array<{ key: Lead["stage"]; label: string; copy: string }> = [
  { key: "new", label: "New signal", copy: "Assessment received" },
  { key: "qualified", label: "Qualified", copy: "Plan is prepared" },
  { key: "opportunity", label: "Opportunity", copy: "Commercial review" },
  { key: "won", label: "Activated", copy: "Onboarding may start" },
];

const labelize = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function PHIOperationsWorkspace() {
  const [accessKey, setAccessKey] = useState("");
  const [workingKey, setWorkingKey] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [activeTab, setActiveTab] = useState<"pipeline" | "queue" | "appointments">("pipeline");

  const loadWorkspace = async (key = accessKey) => {
    if (!key.trim()) {
      setMessage("Enter the PHI operations access key to open the private workspace.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const request = (path: string) =>
        fetch(`/api/operations/${path}`, { headers: { "X-PHI-Operations-Key": key }, cache: "no-store" })
          .then(async (response) => {
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.detail || "The PHI operations workspace could not load.");
            return payload;
          });
      const [nextDashboard, nextLeads, nextFollowups, nextAppointments] = await Promise.all([
        request("operations/dashboard"),
        request("leads?limit=100"),
        request("followups?limit=100"),
        request("appointments?limit=100"),
      ]);
      setAccessKey(key);
      setDashboard(nextDashboard);
      setLeads(nextLeads);
      setFollowups(nextFollowups);
      setAppointments(nextAppointments);
    } catch (error) {
      setDashboard(null);
      setMessage(error instanceof Error ? error.message : "The PHI operations workspace could not load.");
    } finally {
      setLoading(false);
    }
  };

  const submitAccess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadWorkspace(workingKey);
  };

  const performAction = async (path: string, method: "POST" | "PATCH", body: Record<string, unknown>, success: string) => {
    if (!accessKey) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/operations/${path}`, {
        method,
        headers: { "Content-Type": "application/json", "X-PHI-Operations-Key": accessKey },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || "PHI could not complete that operating action.");
      setMessage(success);
      setSelectedFollowUp(null);
      await loadWorkspace(accessKey);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PHI could not complete that operating action.");
      setLoading(false);
    }
  };

  const leadColumns = useMemo(
    () => Object.fromEntries(columns.map((column) => [column.key, leads.filter((lead) => lead.stage === column.key)])),
    [leads],
  );
  const mrrProgress = dashboard ? Math.min((dashboard.verified_mrr / dashboard.revenue_target_mrr) * 100, 100) : 0;

  if (!dashboard) {
    return (
      <main className="phi-ops-shell">
        <section className="phi-ops-gate">
          <Link className="phi-ops-brand" href="/">PHI <span>Operations</span></Link>
          <p className="phi-eyebrow">PRIVATE CEO COMMAND CENTER</p>
          <h1>Turn every consented signal into a visible next step.</h1>
          <p>The free PHI sales workspace keeps assessment leads, follow-up drafts, consultation handoffs, and verified revenue in one controlled place.</p>
          <form onSubmit={submitAccess} className="phi-ops-access-form">
            <label>PHI operations access key<input type="password" value={workingKey} onChange={(event) => setWorkingKey(event.target.value)} autoComplete="current-password" placeholder="Enter the private key" required /></label>
            <button className="phi-button phi-button-primary" disabled={loading} type="submit">{loading ? "Opening workspace…" : "Open PHI command center"}</button>
          </form>
          {message && <p className="phi-ops-message is-error" role="alert">{message}</p>}
          <div className="phi-ops-gate-notes"><span>Consent-first</span><span>No paid CRM</span><span>Audited actions</span><span>Verified revenue only</span></div>
        </section>
      </main>
    );
  }

  return (
    <main className="phi-ops-shell">
      <header className="phi-ops-header">
        <Link className="phi-ops-brand" href="/">PHI <span>Operations</span></Link>
        <div><span className="phi-ops-live"><i /> Free lead engine online</span><button onClick={() => void loadWorkspace()} className="phi-ops-refresh" disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button></div>
      </header>

      <section className="phi-ops-hero">
        <div><p className="phi-eyebrow">CEO GROWTH COMMAND</p><h1>Build the signal.<br /><em>Run the follow-through.</em></h1><p>Every number below is pulled from PHI’s consented customer record—not a forecast, duplicate spreadsheet, or a paid CRM trial.</p></div>
        <article className="phi-ops-revenue-card"><span>VERIFIED MONTHLY RECURRING REVENUE</span><strong>{money.format(dashboard.verified_mrr)}</strong><div className="phi-ops-progress"><i style={{ width: `${mrrProgress}%` }} /></div><p><b>{mrrProgress.toFixed(1)}%</b> of the {money.format(dashboard.revenue_target_mrr)} operating target</p><small>{money.format(dashboard.remaining_mrr)} remains; only verified active revenue is counted.</small></article>
      </section>

      <section className="phi-ops-metric-grid" aria-label="Lead engine metrics">
        <article><span>INBOUND ASSESSMENTS</span><strong>{leads.length}</strong><small>Consented records in PHI</small></article>
        <article><span>QUALIFIED NOW</span><strong>{dashboard.qualified_leads}</strong><small>Ready for a relevant next step</small></article>
        <article><span>FOLLOW-UPS READY</span><strong>{dashboard.active_followups}</strong><small>Prepared, not represented as sent</small></article>
        <article><span>CONSULTATION HANDOFFS</span><strong>{dashboard.appointment_counts.requested + dashboard.appointment_counts.scheduled}</strong><small>Requests plus scheduled conversations</small></article>
      </section>

      <section className="phi-ops-control-strip"><div><b>Engine controls</b><span>Capture is live. Messages and calendar bookings stay held until a free business sender and calendar are authorized.</span></div><div><span className="is-on">Lead capture</span><span className="is-ready">Follow-up queue</span><span className="is-hold">Email &amp; calendar awaiting connection</span></div></section>

      <nav className="phi-ops-tabs" aria-label="Sales workspace views">
        {(["pipeline", "queue", "appointments"] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "is-active" : ""}>{tab === "pipeline" ? "Lead pipeline" : tab === "queue" ? "Follow-up queue" : "Consultation handoffs"}</button>)}
      </nav>

      {activeTab === "pipeline" && <section className="phi-ops-pipeline">
        {columns.map((column) => <article className="phi-ops-column" key={column.key}><header><div><span>{column.label}</span><small>{column.copy}</small></div><b>{dashboard.stage_counts[column.key] || 0}</b></header><div className="phi-ops-cards">{leadColumns[column.key].length ? leadColumns[column.key].map((lead) => <div className="phi-ops-lead-card" key={lead.id}><div className="phi-ops-avatar">{lead.full_name.slice(0, 1)}</div><div><h2>{lead.full_name}</h2><p>{lead.company_name || (lead.journey === "fleet" ? "Fleet operator" : "Owner-operator pathway")}</p></div><span className="phi-ops-score">{lead.qualification_score}</span><small>{lead.recommended_offer}</small><p className="phi-ops-challenge">{lead.top_challenge}</p>{lead.stage === "qualified" && <button onClick={() => void performAction(`leads/${lead.id}/appointments`, "POST", { host_name: "PHI Planning Pod", notes: "Created from the PHI free lead engine." }, "Consultation handoff created. It is ready for a free calendar connection or direct scheduling.")}>Create consultation handoff</button>}</div>) : <p className="phi-ops-empty">PHI will place the next verified record here.</p>}</div></article>)}
      </section>}

      {activeTab === "queue" && <section className="phi-ops-workspace-grid"><article className="phi-ops-panel"><header><div><p className="phi-eyebrow">CONSENT-AWARE FOLLOW-UP</p><h2>Prepared before it is sent.</h2></div><b>{followups.length} records</b></header><p className="phi-ops-panel-copy">The free engine creates a tailored response for an opted-in assessment. It cannot mark delivery as complete without a real sender-provided identifier.</p><div className="phi-ops-queue-list">{followups.length ? followups.map((followup) => <button key={followup.id} onClick={() => setSelectedFollowUp(followup)} className={selectedFollowUp?.id === followup.id ? "is-selected" : ""}><span className={`phi-ops-status is-${followup.status}`}>{labelize(followup.status)}</span><strong>{followup.lead_name}</strong><small>{labelize(followup.sequence_step)} · {followup.channel}</small></button>) : <p className="phi-ops-empty">No follow-ups are waiting yet.</p>}</div></article><article className="phi-ops-panel phi-ops-draft-panel"><p className="phi-eyebrow">DRAFT REVIEW</p>{selectedFollowUp ? <><span className={`phi-ops-status is-${selectedFollowUp.status}`}>{labelize(selectedFollowUp.status)}</span><h2>{selectedFollowUp.subject || "PHI follow-up"}</h2><p className="phi-ops-recipient">To: {selectedFollowUp.lead_name} · {selectedFollowUp.lead_email}</p><pre>{selectedFollowUp.body}</pre>{selectedFollowUp.status === "ready" && <button className="phi-button phi-button-ghost" onClick={() => void performAction(`followups/${selectedFollowUp.id}`, "PATCH", { status: "held", reason: "Held for PHI operations review before any external channel is activated." }, "Follow-up held. No message was sent.")}>Hold for review</button>}<p className="phi-ops-policy">No external delivery is available until PHI authorizes a free sender. Do not treat this draft as a sent message.</p></> : <div className="phi-ops-draft-empty"><span>01</span><h2>Select a prepared follow-up.</h2><p>PHI will show the planned customer message, status, and control options here.</p></div>}</article></section>}

      {activeTab === "appointments" && <section className="phi-ops-workspace-grid"><article className="phi-ops-panel phi-ops-appointments"><header><div><p className="phi-eyebrow">BOOKING HANDOFF</p><h2>Interest becomes a scheduled next step.</h2></div><b>{appointments.length} records</b></header><div className="phi-ops-appointment-list">{appointments.length ? appointments.map((appointment) => <article key={appointment.id}><span className={`phi-ops-status is-${appointment.status}`}>{labelize(appointment.status)}</span><h3>{appointment.lead_name}</h3><p>{appointment.host_name || "PHI Planning Pod"}</p><small>{appointment.scheduled_for ? date.format(new Date(appointment.scheduled_for)) : "Awaiting calendar connection"}</small></article>) : <p className="phi-ops-empty">Create a consultation handoff from a qualified lead to start this queue.</p>}</div></article><article className="phi-ops-panel"><p className="phi-eyebrow">SOURCE SIGNALS</p><h2>See where consented leads arrive.</h2><div className="phi-ops-source-list">{Object.entries(dashboard.source_counts).length ? Object.entries(dashboard.source_counts).map(([source, count]) => <div key={source}><span>{labelize(source)}</span><b>{count}</b></div>) : <p className="phi-ops-empty">Campaign and referral sources will appear after the first live assessment.</p>}</div><p className="phi-ops-policy">PHI records source information when a visitor submits a consented assessment. It does not create leads from anonymous traffic alone.</p></article></section>}

      <section className="phi-ops-governance"><div><p className="phi-eyebrow">AUTONOMY WITH RECEIPTS</p><h2>Every customer action has a boundary.</h2></div><ul>{dashboard.conversion_notes.map((note) => <li key={note}><i />{note}</li>)}</ul></section>
      {message && <p className="phi-ops-toast" role="status">{message}</p>}
    </main>
  );
}
