"""
agent_graph.py — PHI Agent Orchestration DAG

Defines the directed acyclic graph (DAG) of all 15 CrewAI agents and the
work that flows between them.  This module is the authoritative source of
truth for:

  1. Which agents run in parallel vs. sequentially.
  2. What data each edge carries between agents.
  3. The retry policy for each agent node.

The graph is exposed via the ``GET /api/v1/agent-map`` endpoint so the
mobile Mission Control screen can render it live.

Workflow structure
──────────────────
  Workflow 1 — Load Acquisition (parallel entry, sequential close)
    [freight_negotiator, insurance_assessor] → legal_auditor
      → freight_negotiator (negotiate) → compliance_officer

  Workflow 2 — Active Transit (fully parallel start, converge at driver_liaison)
    route_optimizer ──┐
    fuel_optimizer   ─┤→ dispatcher → track_trace_agent → driver_liaison
    dispatcher       ─┘

  Workflow 3 — Post-Delivery Close (parallel, converge at bi_executive)
    finance_specialist ──┐
    tax_auditor          ─┤→ bi_executive
    maintenance_monitor ─┘
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

AgentRole = str
EdgeLabel = str

# Retry policy constants
MAX_RETRIES = 3
BACKOFF_BASE_SECONDS = 2  # exponential: 2s, 4s, 8s


@dataclass
class AgentNode:
    """A node in the agent orchestration graph."""
    role: AgentRole
    group: str
    can_delegate: bool = False
    max_retries: int = MAX_RETRIES
    # Runtime state (updated by task callbacks, NOT persisted between runs)
    status: Literal["idle", "running", "done", "error"] = "idle"
    tasks_completed: int = 0
    last_output_preview: str = ""


@dataclass
class AgentEdge:
    """A directed edge: work flowing from one agent to another."""
    source: AgentRole
    target: AgentRole
    label: EdgeLabel
    parallel: bool = False  # True if both ends may run at the same time


@dataclass
class AgentGraph:
    """The full PHI agent orchestration DAG."""
    nodes: list[AgentNode] = field(default_factory=list)
    edges: list[AgentEdge] = field(default_factory=list)

    def get_node(self, role: AgentRole) -> AgentNode | None:
        return next((n for n in self.nodes if n.role == role), None)

    def get_outgoing_edges(self, role: AgentRole) -> list[AgentEdge]:
        return [e for e in self.edges if e.source == role]

    def get_incoming_edges(self, role: AgentRole) -> list[AgentEdge]:
        return [e for e in self.edges if e.target == role]

    def mark_running(self, role: AgentRole) -> None:
        node = self.get_node(role)
        if node:
            node.status = "running"

    def mark_done(self, role: AgentRole, output_preview: str = "") -> None:
        node = self.get_node(role)
        if node:
            node.status = "done"
            node.tasks_completed += 1
            node.last_output_preview = output_preview[:200]

    def mark_error(self, role: AgentRole) -> None:
        node = self.get_node(role)
        if node:
            node.status = "error"

    def reset(self) -> None:
        """Reset all nodes to idle before a new workflow run."""
        for node in self.nodes:
            node.status = "idle"
            node.last_output_preview = ""

    def to_dict(self) -> dict:
        return {
            "nodes": [
                {
                    "role": n.role,
                    "group": n.group,
                    "status": n.status,
                    "tasks_completed": n.tasks_completed,
                    "can_delegate": n.can_delegate,
                }
                for n in self.nodes
            ],
            "edges": [
                {
                    "source": e.source,
                    "target": e.target,
                    "label": e.label,
                    "parallel": e.parallel,
                }
                for e in self.edges
            ],
        }


# ── Build the singleton graph ─────────────────────────────────────────────────

PHI_AGENT_GRAPH = AgentGraph(
    nodes=[
        AgentNode("Dispatcher", group="dispatch"),
        AgentNode("Route Optimizer", group="logistics"),
        AgentNode("Fuel Optimizer", group="logistics"),
        AgentNode("Track & Trace Agent", group="logistics"),
        AgentNode("Freight Negotiator", group="commercial", can_delegate=True),
        AgentNode("Finance Specialist", group="finance"),
        AgentNode("Tax Auditor", group="finance"),
        AgentNode("Direct Shipper Marketer", group="commercial"),
        AgentNode("Compliance Officer", group="compliance"),
        AgentNode("Legal Auditor", group="compliance"),
        AgentNode("Insurance Assessor", group="compliance"),
        AgentNode("Maintenance Monitor", group="operations"),
        AgentNode("Driver Liaison", group="driver-support"),
        AgentNode("Emergency Controller", group="driver-support"),
        AgentNode("BI Executive", group="analytics", can_delegate=True),
    ],
    edges=[
        # ── Workflow 1: Load Acquisition ──────────────────────────────────────
        AgentEdge("Freight Negotiator", "Insurance Assessor", "top load candidates", parallel=True),
        AgentEdge("Insurance Assessor", "Legal Auditor", "risk-vetted loads"),
        AgentEdge("Legal Auditor", "Freight Negotiator", "contract-cleared loads"),
        AgentEdge("Freight Negotiator", "Compliance Officer", "negotiated booking"),

        # ── Workflow 2: Active Transit ────────────────────────────────────────
        AgentEdge("Route Optimizer", "Fuel Optimizer", "planned route", parallel=True),
        AgentEdge("Fuel Optimizer", "Dispatcher", "stop-optimized route"),
        AgentEdge("Dispatcher", "Track & Trace Agent", "confirmed dispatch"),
        AgentEdge("Track & Trace Agent", "Driver Liaison", "live ETA + location"),

        # ── Workflow 3: Post-Delivery Close ───────────────────────────────────
        AgentEdge("Driver Liaison", "Finance Specialist", "delivery confirmed", parallel=True),
        AgentEdge("Finance Specialist", "Tax Auditor", "invoice generated"),
        AgentEdge("Tax Auditor", "BI Executive", "deductions filed"),
        AgentEdge("Maintenance Monitor", "BI Executive", "service log update", parallel=True),

        # ── Cross-workflow edges ──────────────────────────────────────────────
        AgentEdge("Compliance Officer", "Driver Liaison", "HOS clearance"),
        AgentEdge("Emergency Controller", "Dispatcher", "emergency reroute"),
        AgentEdge("Direct Shipper Marketer", "Freight Negotiator", "direct shipper leads"),
    ],
)
