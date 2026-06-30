"""
Workflow tasks — defines what each agent executes and in what order.
Each Crew maps to one of the mobile app's primary user flows:

  find_freight_crew   → "Find Freight" button
  start_trip_crew     → "Start Trip" mode
  payday_crew         → "One-Tap Payday"
  compliance_crew     → Compliance screen
  dashboard_crew      → Dashboard daily summary
"""

from crewai import Crew, Task, Process
from agents import (
    dispatch_coordinator, freight_negotiator, route_optimizer,
    fuel_optimizer, track_trace_agent, invoice_specialist,
    compliance_officer, fleet_maintenance_monitor, risk_assessment_agent,
    load_scoring_agent, driver_liaison, business_intelligence_exec,
    revenue_analyst, cpm_calculator, market_intelligence_agent,
)


# ─── FIND FREIGHT CREW ───────────────────────────────────────────────────────
# Triggered when driver taps "Find Freight" on the dashboard

def build_find_freight_crew(driver_prefs: dict) -> Crew:
    scan_task = Task(
        description=(
            f"Scan available loads matching these driver preferences: {driver_prefs}. "
            "Focus on lanes within preferred states, equipment type match, and RPM above minimum. "
            "Return the top 10 loads with origin, destination, rate, miles, RPM, and broker name."
        ),
        expected_output="JSON list of top 10 loads with full details and RPM calculations.",
        agent=freight_negotiator,
    )
    score_task = Task(
        description=(
            "Score each load from the previous list on a 0-100 composite index. "
            "Factors: RPM (40%), broker rating (20%), deadhead miles (20%), load age (10%), lane history (10%). "
            "Label each: Diamond (80+), Gold (60-79), Standard (<60)."
        ),
        expected_output="JSON list of loads with score, tier label, and ranking.",
        agent=load_scoring_agent,
        context=[scan_task],
    )
    risk_task = Task(
        description=(
            "Vet the top 5 scored loads for risk. Check broker MC authority status, "
            "payment history signals, double-brokering red flags, and route theft corridors. "
            "Flag any load with risk score above 3/10."
        ),
        expected_output="Risk assessment report for top 5 loads with go/no-go recommendation.",
        agent=risk_assessment_agent,
        context=[score_task],
    )
    return Crew(
        agents=[freight_negotiator, load_scoring_agent, risk_assessment_agent],
        tasks=[scan_task, score_task, risk_task],
        process=Process.sequential,
        verbose=True,
    )


# ─── START TRIP CREW ─────────────────────────────────────────────────────────
# Triggered when driver taps "Start Trip" after accepting a load

def build_start_trip_crew(load: dict, driver_location: dict) -> Crew:
    route_task = Task(
        description=(
            f"Calculate the optimal truck-legal route from {driver_location} to "
            f"pickup at {load.get('origin')} then to delivery at {load.get('destination')}. "
            "Account for bridge weights, HazMat restrictions, current traffic, and weather. "
            "Return turn-by-turn waypoints and estimated arrival times."
        ),
        expected_output="Route JSON with waypoints, ETAs, distance, and any restriction alerts.",
        agent=route_optimizer,
    )
    fuel_task = Task(
        description=(
            "Using the approved route, identify the 3 optimal fuel stops. "
            "Pull current diesel prices at truck stops along the corridor. "
            "Calculate how many gallons to take at each stop to minimize total fuel cost "
            "while avoiding running low. Include the truck stop name, address, and price."
        ),
        expected_output="Fuel stop plan: 3 stops with location, price, and recommended gallons.",
        agent=fuel_optimizer,
        context=[route_task],
    )
    dispatch_task = Task(
        description=(
            f"Coordinate the full load lifecycle for load ID {load.get('id')}. "
            "Notify the broker of acceptance and ETA. Set up check-call schedule. "
            "Prepare pickup instructions for the driver."
        ),
        expected_output="Dispatch confirmation with broker notification sent and check-call schedule.",
        agent=dispatch_coordinator,
        context=[route_task],
    )
    hos_task = Task(
        description=(
            "Review the planned route duration against current HOS status. "
            "Confirm the driver can complete the trip legally. "
            "If a 30-minute break or 10-hour reset is needed mid-trip, insert it into the schedule. "
            "Alert if the trip cannot be completed within current HOS cycle."
        ),
        expected_output="HOS compliance check with rest stop schedule if required.",
        agent=driver_liaison,
        context=[route_task],
    )
    return Crew(
        agents=[route_optimizer, fuel_optimizer, dispatch_coordinator, driver_liaison],
        tasks=[route_task, fuel_task, dispatch_task, hos_task],
        process=Process.sequential,
        verbose=True,
    )


# ─── PAYDAY CREW ─────────────────────────────────────────────────────────────
# Triggered when driver taps "One-Tap Payday" and snaps BOL photo

def build_payday_crew(bol_text: str, load: dict) -> Crew:
    invoice_task = Task(
        description=(
            f"A signed Bill of Lading has been received. BOL content: {bol_text}. "
            f"Load details: {load}. "
            "Generate a professional freight invoice including: carrier name, load number, "
            "origin/destination, delivery date, agreed rate, fuel surcharge if applicable, "
            "and total amount due. Format for factoring company submission."
        ),
        expected_output="Complete invoice in JSON format ready for factoring submission.",
        agent=invoice_specialist,
    )
    cpm_update_task = Task(
        description=(
            "Update CPM calculations with this completed load. "
            "Calculate net profit after fuel cost, estimated toll cost, and maintenance reserve ($0.08/mile). "
            "Compare actual RPM vs projected RPM. Flag any variance above 10%."
        ),
        expected_output="CPM update report with net profit and RPM variance analysis.",
        agent=cpm_calculator,
        context=[invoice_task],
    )
    notify_task = Task(
        description=(
            "Send delivery confirmation to the shipper and receiver. "
            "Notify the broker that the load has been delivered and POD is available. "
            "Confirm invoice submission to factoring company with expected payment date."
        ),
        expected_output="Confirmation that all parties notified and factoring submission acknowledged.",
        agent=track_trace_agent,
        context=[invoice_task],
    )
    return Crew(
        agents=[invoice_specialist, cpm_calculator, track_trace_agent],
        tasks=[invoice_task, cpm_update_task, notify_task],
        process=Process.sequential,
        verbose=True,
    )


# ─── COMPLIANCE CREW ─────────────────────────────────────────────────────────
# Runs on demand from Compliance screen or on a daily schedule

def build_compliance_crew(driver_id: str, hos_data: dict, vehicle_data: dict) -> Crew:
    hos_audit_task = Task(
        description=(
            f"Audit HOS compliance for driver {driver_id}. "
            f"Current HOS data: {hos_data}. "
            "Check: remaining drive hours, 30-minute break compliance, 70-hour/8-day cycle. "
            "Flag any violations or upcoming limits. Generate DOT-format log summary."
        ),
        expected_output="HOS audit report with compliance status and any violation flags.",
        agent=compliance_officer,
    )
    maintenance_task = Task(
        description=(
            f"Review vehicle maintenance status: {vehicle_data}. "
            "Check mileage against service intervals for: oil change, tire rotation, "
            "brake inspection, DPF cleaning, and DOT annual inspection due date. "
            "Flag anything overdue or due within 500 miles."
        ),
        expected_output="Maintenance status report with any overdue items and scheduling recommendations.",
        agent=fleet_maintenance_monitor,
    )
    ifta_task = Task(
        description=(
            "Generate IFTA fuel tax report summary for the current quarter. "
            "Calculate miles driven per state and fuel purchased per state. "
            "Flag any states with missing fuel receipts or mileage gaps."
        ),
        expected_output="IFTA quarterly summary with miles-by-state and fuel-by-state breakdown.",
        agent=compliance_officer,
        context=[hos_audit_task],
    )
    return Crew(
        agents=[compliance_officer, fleet_maintenance_monitor],
        tasks=[hos_audit_task, maintenance_task, ifta_task],
        process=Process.sequential,
        verbose=True,
    )


# ─── DAILY DASHBOARD CREW ────────────────────────────────────────────────────
# Runs every morning to power the Command Dashboard

def build_dashboard_crew(driver_id: str, period: str = "today") -> Crew:
    revenue_task = Task(
        description=(
            f"Pull all revenue data for driver {driver_id} for {period}. "
            "Calculate: total gross revenue, total miles, average RPM, number of loads completed. "
            "Compare vs daily target and vs same period last week."
        ),
        expected_output="Revenue summary JSON with totals, averages, and week-over-week comparison.",
        agent=revenue_analyst,
    )
    cpm_task = Task(
        description=(
            f"Calculate current Cost Per Mile for driver {driver_id} for {period}. "
            "Break down by category: fuel, tolls, maintenance reserve, insurance proration. "
            "Calculate net profit margin percentage."
        ),
        expected_output="CPM breakdown by category with total CPM and net margin.",
        agent=cpm_calculator,
        context=[revenue_task],
    )
    market_task = Task(
        description=(
            "Analyze current freight market conditions on the driver's preferred lanes. "
            "Are rates rising or falling vs last week? Any seasonal demand spikes incoming? "
            "What is the #1 lane to focus on tomorrow for maximum revenue?"
        ),
        expected_output="Market brief: rate trend, demand outlook, and top lane recommendation.",
        agent=market_intelligence_agent,
    )
    exec_summary_task = Task(
        description=(
            "Synthesize all data from today's analysis into a single executive summary. "
            "Format: 3 bullet KPIs (revenue, CPM, net profit), 1 market insight, "
            "1 recommended action for tomorrow. Keep it under 150 words. "
            "This is what the driver reads on their dashboard every morning."
        ),
        expected_output="Daily executive summary: 3 KPIs + 1 insight + 1 action. Under 150 words.",
        agent=business_intelligence_exec,
        context=[revenue_task, cpm_task, market_task],
    )
    return Crew(
        agents=[revenue_analyst, cpm_calculator, market_intelligence_agent, business_intelligence_exec],
        tasks=[revenue_task, cpm_task, market_task, exec_summary_task],
        process=Process.sequential,
        verbose=True,
    )
