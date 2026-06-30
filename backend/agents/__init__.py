from .dispatch_agents import dispatch_coordinator, route_optimizer, fuel_optimizer, track_trace_agent
from .financial_agents import freight_negotiator, invoice_specialist, revenue_analyst, cpm_calculator
from .legal_safety_agents import compliance_officer, fleet_maintenance_monitor, risk_assessment_agent
from .operational_agents import load_scoring_agent, driver_liaison, business_intelligence_exec, market_intelligence_agent

ALL_AGENTS = [
    dispatch_coordinator,     # 1
    freight_negotiator,       # 2
    route_optimizer,          # 3
    compliance_officer,       # 4
    invoice_specialist,       # 5
    fuel_optimizer,           # 6
    load_scoring_agent,       # 7
    track_trace_agent,        # 8
    driver_liaison,           # 9
    business_intelligence_exec,  # 10
    fleet_maintenance_monitor,   # 11
    revenue_analyst,             # 12
    cpm_calculator,              # 13
    risk_assessment_agent,       # 14
    market_intelligence_agent,   # 15
]
