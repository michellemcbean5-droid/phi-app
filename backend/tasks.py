"""
tasks.py — Prince Haul Intelligence (PHI)
Three CrewAI workflow builders mapping directly to the mobile app's core user flows.

  Workflow 1 · build_load_acquisition_crew()
    → Triggered by "Find Freight" button
    → freight_negotiator scans boards → insurance_assessor vets risk
    → legal_auditor audits contract → freight_negotiator negotiates & books
    → compliance_officer confirms HOS clearance

  Workflow 2 · build_dispatch_transit_crew()
    → Triggered by "Start Trip" button
    → route_optimizer plots route → fuel_optimizer engineers stops
    → dispatcher executes broker handoff → track_trace_agent arms monitoring
    → driver_liaison prepares in-cab briefing

  Workflow 3 · build_post_delivery_crew()
    → Triggered by BOL photo upload / delivery confirmation
    → finance_specialist generates invoice → tax_auditor logs deductions
    → maintenance_monitor updates service records → bi_executive delivers P&L brief

All Crews use Process.sequential so each Task's output feeds the next Task as context.
For hierarchical delegation, set process=Process.hierarchical and manager_agent=bi_executive.
"""

from crewai import Crew, Task, Process
from app.agent_events import make_task_callback, make_post_delivery_callback
from agents import (
    dispatcher,
    route_optimizer,
    fuel_optimizer,
    track_trace_agent,
    freight_negotiator,
    finance_specialist,
    tax_auditor,
    direct_shipper_marketer,
    compliance_officer,
    legal_auditor,
    insurance_assessor,
    maintenance_monitor,
    driver_liaison,
    emergency_controller,
    bi_executive,
)


# ═══════════════════════════════════════════════════════════════════════════════
# WORKFLOW 1 — AUTOMATED LOAD ACQUISITION
#
# Five-stage pipeline: scan → risk-vet → contract-audit → negotiate → HOS-check.
# This workflow replaces the driver spending hours on load boards and eliminates
# the risk of booking a bad broker or signing a predatory rate confirmation.
#
# Average time from trigger to booked load: 4-8 minutes (vs 45-90 min manually).
# ═══════════════════════════════════════════════════════════════════════════════

def build_load_acquisition_crew(driver_prefs: dict) -> Crew:
    """
    Build and return the Automated Load Acquisition Crew.

    Args:
        driver_prefs: dict with keys:
            driver_id        (str)   — unique driver identifier
            equipment_type   (str)   — "Dry Van" | "Reefer" | "Flatbed" | "Step Deck"
            min_rpm          (float) — minimum acceptable revenue per mile (e.g., 3.00)
            preferred_states (list)  — 2-letter state codes to prioritize
            avoid_states     (list)  — 2-letter state codes to exclude
            home_city        (str)   — driver's home base city
            home_state       (str)   — driver's home base state
            available_date   (str)   — ISO date string of first available pickup day
            max_deadhead_miles (int) — maximum miles willing to drive to pickup

    Returns:
        crewai.Crew ready for .kickoff()
    """

    # ── Stage 1: Market Scan & Load Sourcing ──────────────────────────────────
    scan_task = Task(
        description=(
            f"Scan DAT Load Board, Truckstop.com, and available direct broker channels "
            f"for freight matching these driver preferences: {driver_prefs}. "
            "Compile the top 15 candidate loads ranked by revenue per mile (RPM). "
            "For each load record: broker_name, broker_mc_number, broker_phone, "
            "origin_city, origin_state, destination_city, destination_state, "
            "rate_usd, total_miles, rpm, deadhead_miles_to_pickup, "
            "equipment_type, pickup_date, delivery_date, commodity, "
            "and any special requirements (team, tarped, temp-controlled, etc.). "
            f"Filter out any loads requiring equipment type other than "
            f"{driver_prefs.get('equipment_type', 'Dry Van')} or pickup states listed "
            f"in avoid_states: {driver_prefs.get('avoid_states', [])}. "
            f"Prioritize loads originating in or near "
            f"{driver_prefs.get('home_city', '')}, {driver_prefs.get('home_state', '')}."
        ),
        expected_output=(
            "JSON array of exactly 15 candidate loads, each object containing: "
            "broker_name, broker_mc_number, broker_phone, origin, destination, "
            "rate_usd, total_miles, rpm, deadhead_miles, equipment_type, "
            "pickup_date, delivery_date, commodity, special_requirements. "
            "Array sorted descending by rpm."
        ),
        agent=freight_negotiator,
    )

    # ── Stage 2: Risk Assessment & Broker Vetting ─────────────────────────────
    risk_task = Task(
        description=(
            "Perform a 5-dimension risk assessment on all loads from the candidate list. "
            "For each load evaluate:\n"
            "  1. Broker Risk (0-2): MC authority age (<1yr=2, 1-3yr=1, >3yr=0), "
            "bond status (BMC-84 current=0, BMC-85=0.5, not found=2), "
            "payment reputation (check carrier411, truckerreport data).\n"
            "  2. Cargo Theft Risk (0-2): electronics/pharma/food-grade=2, "
            "general freight=0, high-value consumer goods=1.\n"
            "  3. Route Risk (0-2): I-10 corridor Phoenix-El Paso=1, "
            "I-95 NJ-NYC metro=1, known cargo theft hot zones=2.\n"
            "  4. Equipment Risk (0-2): HazMat placards required=2, "
            "oversize/overweight permits=1, standard freight=0.\n"
            "  5. Timeline Risk (0-2): transit time less than 80% of legal drive hours=2, "
            "weekend/holiday delivery=1, realistic timeline=0.\n"
            "Sum the five dimensions into a composite risk score (0-10). "
            "Flag: Low Risk (0-3) = Go | Medium Risk (4-5) = Conditional Go | "
            "High Risk (6+) = No-Go. Eliminate all No-Go loads."
        ),
        expected_output=(
            "Risk-assessed load list: original 15 loads annotated with "
            "risk_score (0-10), risk_tier (Low/Medium/High), risk_flag (Go/Conditional Go/No-Go), "
            "and brief risk_justification (1 sentence per dimension with score). "
            "No-Go loads clearly marked for exclusion. "
            "Remaining Go and Conditional-Go loads passed forward."
        ),
        agent=insurance_assessor,
        context=[scan_task],
    )

    # ── Stage 3: Contract & Rate Confirmation Audit ───────────────────────────
    contract_task = Task(
        description=(
            "Audit the rate confirmation terms for the top 5 loads remaining after risk filtering. "
            "Review each broker-carrier agreement for the following red-flag clauses:\n"
            "  • Unlimited or uncapped cargo liability shifted to carrier\n"
            "  • Quick-pay fee / factoring deduction above 3% of load rate\n"
            "  • Non-compete or exclusivity language restricting future loads\n"
            "  • Dispute jurisdiction set to a state unfavorable to the carrier\n"
            "  • Unilateral rate adjustment or 'performance deduction' clauses\n"
            "  • Waiver of the carrier's right to file a freight claim\n"
            "  • Cargo claim statute of limitations shorter than 9 months\n"
            "For each flagged clause, draft a specific counter-clause recommendation. "
            "Assign each load a contract safety rating: Safe | Caution | Reject. "
            "Provide the final ranked list of loads recommended for negotiation."
        ),
        expected_output=(
            "Contract audit report for top 5 loads: per load — broker_name, load_id, "
            "flagged_clauses (list of: clause_text, risk_type, counter_clause_recommendation), "
            "contract_safety_rating (Safe/Caution/Reject), overall_recommendation. "
            "Final prioritized list of 1-3 Safe/Caution loads cleared for rate negotiation."
        ),
        agent=legal_auditor,
        context=[risk_task],
    )

    # ── Stage 4: Rate Negotiation & Load Booking ──────────────────────────────
    negotiate_task = Task(
        description=(
            "Negotiate the rate on the top 3 Safe or Caution-rated loads from the contract audit. "
            f"Reference DAT RateView 30-day average for each specific lane (O&D pair). "
            f"Counter any initial offer below the 75th percentile rate for that lane. "
            f"The operator's minimum acceptable RPM is ${driver_prefs.get('min_rpm', 3.00)}/mile. "
            "Negotiation strategy:\n"
            "  Step 1: Anchor at the 90th percentile rate for the lane.\n"
            "  Step 2: If broker counters below 75th percentile, cite specific market data.\n"
            "  Step 3: If broker will not reach the minimum RPM floor, politely decline "
            "and move to the next candidate load.\n"
            "Book the load with the highest negotiated net RPM that meets or exceeds the minimum. "
            "If no load meets the minimum RPM after negotiation, return a market context report "
            "explaining current lane conditions and recommended wait time before re-scanning."
        ),
        expected_output=(
            "Negotiation outcome: EITHER a booked_load object containing — "
            "broker_name, broker_contact, rate_confirmation_number, origin, destination, "
            "final_negotiated_rate, total_miles, final_rpm, pickup_appointment, delivery_appointment, "
            "special_instructions; "
            "OR a no_qualifying_load_report containing — "
            "lanes_attempted (list), market_rate_context (per lane), recommended_rescan_in_hours."
        ),
        agent=freight_negotiator,
        context=[contract_task],
    )

    # ── Stage 5: HOS & Driver Qualification Clearance ────────────────────────
    compliance_clearance_task = Task(
        description=(
            f"Perform pre-trip compliance clearance for driver {driver_prefs.get('driver_id', 'driver')} "
            "before the booked load is confirmed to the broker. "
            "Verify:\n"
            "  1. HOS Feasibility: Can the driver legally complete this load "
            "without violating the 11-hour drive limit, 14-hour duty window, "
            "or 70-hour/8-day cycle? If not, calculate when the driver will have "
            "sufficient reset hours and provide the earliest legal start date.\n"
            "  2. CDL Status: Is the CDL current and does the endorsement match "
            "the load's equipment and commodity requirements?\n"
            "  3. Medical Certificate: Is the DOT medical certificate current (not expired)?\n"
            "  4. Drug Test: Is the most recent drug test within the required 12-month window?\n"
            "  5. Vehicle Inspection: Is the truck's last pre-trip inspection current?\n"
            "Output a Go / Hold recommendation. If Hold, specify exact condition and resolution steps."
        ),
        expected_output=(
            "Compliance clearance report: driver_id, clearance_status (Go/Hold), "
            "hos_check (pass/fail + hours_remaining), cdl_check (pass/fail + endorsements), "
            "medical_cert_check (pass/fail + expiration_date), drug_test_check (pass/fail), "
            "inspection_check (pass/fail), overall_recommendation, "
            "hold_reason (if applicable), resolution_steps (if Hold)."
        ),
        agent=compliance_officer,
        context=[negotiate_task],
    )

    return Crew(
        agents=[
            freight_negotiator,
            insurance_assessor,
            legal_auditor,
            compliance_officer,
        ],
        tasks=[
            scan_task,
            risk_task,
            contract_task,
            negotiate_task,
            compliance_clearance_task,
        ],
        process=Process.sequential,
        verbose=True,
        task_callback=make_task_callback(driver_prefs.get("driver_id")),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# WORKFLOW 2 — ACTIVE DISPATCH & TRANSIT
#
# Five-stage pipeline: route → fuel → dispatch → monitor → in-cab briefing.
# This workflow activates the moment a load is booked and runs continuously
# through delivery. Every party is informed. Every mile is optimized.
# ═══════════════════════════════════════════════════════════════════════════════

def build_dispatch_transit_crew(load: dict, driver: dict) -> Crew:
    """
    Build and return the Active Dispatch & Transit Crew.

    Args:
        load: dict with keys:
            id               (str)   — load/rate confirmation number
            origin           (str)   — "City, ST" format
            destination      (str)   — "City, ST" format
            rate             (float) — agreed freight rate in USD
            miles            (int)   — total loaded miles
            pickup_date      (str)   — ISO date string
            delivery_date    (str)   — ISO date string
            broker_name      (str)
            broker_contact   (str)   — phone or email
            equipment_type   (str)
            special_requirements (str)

        driver: dict with keys:
            id               (str)   — driver identifier
            current_location (str)   — "City, ST" format
            current_lat      (float)
            current_lng      (float)
            hos_remaining_drive  (float) — hours of drive time remaining today
            hos_remaining_duty   (float) — hours of on-duty time remaining today
            odometer         (int)   — current truck odometer reading

    Returns:
        crewai.Crew ready for .kickoff()
    """

    # ── Stage 1: Optimal Route Calculation ───────────────────────────────────
    route_task = Task(
        description=(
            f"Calculate the optimal truck-legal route for load {load.get('id')}. "
            f"Driver current location: {driver.get('current_location')}. "
            f"Pickup at: {load.get('origin')}. "
            f"Delivery at: {load.get('destination')}. "
            f"Equipment type: {load.get('equipment_type', 'Dry Van')}. "
            f"Special requirements: {load.get('special_requirements', 'None')}. "
            f"Driver has {driver.get('hos_remaining_drive', 11.0)} hours of drive time "
            f"and {driver.get('hos_remaining_duty', 14.0)} hours of on-duty time remaining. "
            "Apply all truck-legal routing filters:\n"
            "  • Bridge weight limits (post road weight restrictions)\n"
            "  • Tunnel height/width clearances for trailer dimensions\n"
            "  • HazMat restricted corridors (if applicable)\n"
            "  • Active road closures and construction zones\n"
            "  • Real-time traffic congestion avoidance\n"
            "  • Weather event routing around severe conditions\n"
            "Insert a mandatory 30-minute break if total drive time exceeds 8 continuous hours. "
            "Insert a 10-hour rest break if total trip drive time exceeds driver's current HOS. "
            "Provide a complete waypoint sequence with individual segment ETAs."
        ),
        expected_output=(
            "Route plan JSON: total_miles, estimated_drive_hours, "
            "waypoints (ordered list of: location, segment_miles, cumulative_eta, notes), "
            "deadhead_miles_to_pickup, loaded_miles, "
            "pickup_eta, delivery_eta, "
            "hos_break_required (bool), hos_break_location (if required), "
            "hos_reset_required (bool), hos_reset_location (if required), "
            "restriction_alerts (list of any weight/height/hazmat warnings), "
            "weather_alerts (list of any active weather advisories on route)."
        ),
        agent=route_optimizer,
    )

    # ── Stage 2: Fuel Stop Engineering ───────────────────────────────────────
    fuel_task = Task(
        description=(
            "Using the approved route waypoints, engineer the complete fuel stop plan. "
            "Identify 2-5 commercial truck stop fuel locations along the corridor "
            "with current diesel prices. Sources: Pilot Flying J, Love's Travel Stops, "
            "TA/Petro, Ambest, and independent truck stops. "
            "For each stop calculate:\n"
            "  • Current diesel price per gallon at that location\n"
            "  • Gallons to purchase (calculated to arrive at next stop with 1/4 tank reserve)\n"
            "  • Estimated total cost at that stop\n"
            "  • DEF availability if required\n"
            "  • Truck parking availability at planned stop time\n"
            "Optimize stop selection to minimize total fuel expenditure on the run. "
            "Calculate total fuel cost and compare vs unplanned ad-hoc fueling estimate. "
            "Note the IFTA state mileage breakdown for fuel tax reporting at each state line."
        ),
        expected_output=(
            "Fuel plan: total_estimated_fuel_cost_usd, unplanned_fueling_estimate_usd, "
            "planned_savings_usd, savings_percentage, "
            "stops (list of: truck_stop_name, address, state, price_per_gallon, "
            "gallons_to_purchase, stop_cost_usd, def_available, parking_available, planned_arrival_time), "
            "total_gallons, ifta_miles_by_state (dict of state_code: miles)."
        ),
        agent=fuel_optimizer,
        context=[route_task],
    )

    # ── Stage 3: Broker Dispatch Execution ────────────────────────────────────
    dispatch_task = Task(
        description=(
            f"Execute full dispatch protocol for load {load.get('id')}.\n"
            "Actions to complete:\n"
            f"  1. Contact broker {load.get('broker_name')} at {load.get('broker_contact')} "
            "to confirm load acceptance and provide driver ETA to pickup location.\n"
            f"  2. Send pickup appointment confirmation to shipper at {load.get('origin')} "
            "with driver name, truck unit number, and ETA.\n"
            "  3. Set up automated check-call schedule:\n"
            f"     • Immediately upon pickup departure from {load.get('origin')}\n"
            "     • Every 4 hours during transit\n"
            f"     • 2 hours before arrival at {load.get('destination')}\n"
            "     • Immediately upon delivery completion\n"
            "  4. Prepare the driver dispatch packet:\n"
            "     • Pickup dock number and contact name (if available)\n"
            "     • Receiver contact name and phone at destination\n"
            "     • Lumper service requirement and authorization amount (if needed)\n"
            "     • Any special loading/unloading instructions\n"
            "     • Emergency contact at broker's dispatch desk"
        ),
        expected_output=(
            "Dispatch confirmation: broker_notified (bool), broker_confirmation_time, "
            "shipper_notified (bool), shipper_confirmation_time, "
            "check_call_schedule (list of datetime strings in ISO format), "
            "driver_packet (pickup_dock, pickup_contact, receiver_name, receiver_phone, "
            "lumper_required, lumper_auth_amount, special_instructions, broker_emergency_contact)."
        ),
        agent=dispatcher,
        context=[route_task],
    )

    # ── Stage 4: Continuous Transit Monitoring ────────────────────────────────
    monitoring_task = Task(
        description=(
            "Activate continuous load monitoring from pickup through delivery confirmation. "
            "Immediate actions on activation:\n"
            f"  1. Send departure notification to {load.get('broker_name')} and receiver "
            f"at {load.get('destination')} with confirmed pickup time and delivery ETA.\n"
            "  2. Schedule and arm all automated check-call communications.\n"
            "  3. Configure delay threshold alerts: if any GPS or ELD data indicates "
            "the truck will arrive more than 30 minutes outside the delivery appointment window, "
            "immediately notify the broker with revised ETA and delay reason.\n"
            "  4. Monitor for route disruptions: accidents, road closures, or weather events "
            "along the active route — trigger rerouting advisory to route_optimizer if needed.\n"
            "  5. Log every communication event with timestamp for freight claim defense "
            "documentation if needed.\n"
            "Remain armed until delivery POD is captured and confirmed."
        ),
        expected_output=(
            "Monitoring protocol status: initial_notifications_sent (bool), "
            "parties_notified (list of: party_name, contact, notification_time), "
            "check_call_schedule_armed (bool), delay_alert_threshold_minutes (int), "
            "monitoring_status (active), "
            "contingency_protocols_armed (bool), "
            "all_communications_logged (bool)."
        ),
        agent=track_trace_agent,
        context=[dispatch_task],
    )

    # ── Stage 5: In-Cab Driver Briefing ──────────────────────────────────────
    in_cab_task = Task(
        description=(
            f"Prepare the complete in-cab operational briefing for driver {driver.get('id')} "
            "for this load. The briefing must be concise, accurate, and formatted for "
            "hands-free audio delivery while driving. Include:\n"
            "  1. Route Summary: total miles, key waypoints, estimated drive time, "
            "and pickup and delivery ETAs.\n"
            "  2. Fuel Stop Brief: each stop's truck stop name, mile marker, price, "
            "and gallons to purchase — in order of appearance on route.\n"
            "  3. HOS Checkpoints: drive time countdown alerts and rest stop locations.\n"
            "  4. Weigh Stations: all fixed and portable weigh station locations on route "
            "with bypass certificate validity reminder if PrePass enrolled.\n"
            "  5. Contacts: pickup dock contact, receiver contact, broker dispatch number, "
            "and 24/7 PHI crisis line.\n"
            "  6. Estimated Earnings: net revenue after estimated fuel cost for this load.\n"
            "  7. Any special cargo handling instructions or delivery appointment requirements."
        ),
        expected_output=(
            "Driver briefing packet: route_summary (natural language, 3-4 sentences), "
            "fuel_stops_summary (ordered list: name, location, price, gallons), "
            "hos_checkpoints (list: hours_remaining_alert, location_at_that_time), "
            "weigh_stations_on_route (list: state, approximate_mile_marker, notes), "
            "key_contacts (dict: pickup_contact, receiver_contact, broker_dispatch, phi_crisis_line), "
            "estimated_net_earnings_usd, special_instructions."
        ),
        agent=driver_liaison,
        context=[route_task, fuel_task, dispatch_task],
    )

    return Crew(
        agents=[
            route_optimizer,
            fuel_optimizer,
            dispatcher,
            track_trace_agent,
            driver_liaison,
        ],
        tasks=[
            route_task,
            fuel_task,
            dispatch_task,
            monitoring_task,
            in_cab_task,
        ],
        process=Process.sequential,
        verbose=True,
        task_callback=make_task_callback(driver.get("id"), load.get("id"), load_info=load),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# WORKFLOW 3 — POST-DELIVERY FINANCIAL CLOSE
#
# Four-stage pipeline: invoice → tax log → maintenance update → exec P&L brief.
# This workflow runs the moment the driver submits the signed BOL photo.
# Target: delivery to funded factoring advance in under 24 hours.
# ═══════════════════════════════════════════════════════════════════════════════

def build_post_delivery_crew(delivery: dict) -> Crew:
    """
    Build and return the Post-Delivery Financial Close Crew.

    Args:
        delivery: dict with keys:
            load_id          (str)   — rate confirmation / load number
            driver_id        (str)   — driver identifier
            bol_text         (str)   — OCR-extracted text from signed Bill of Lading
            agreed_rate      (float) — total freight charge in USD
            miles            (int)   — total loaded miles on this run
            fuel_cost        (float) — actual fuel spend on this load
            toll_cost        (float) — actual toll charges on this load
            origin           (str)   — "City, ST" pickup location
            destination      (str)   — "City, ST" delivery location
            delivery_date    (str)   — ISO date string of actual delivery
            broker_name      (str)
            factoring_company (str)  — e.g., "OTR Capital", "RTS Financial", "Triumph"
            days_on_road     (int)   — number of nights away from home (for per diem)
            states_driven    (list)  — list of state codes driven through (for IFTA)

    Returns:
        crewai.Crew ready for .kickoff()
    """

    # ── Stage 1: Invoice Generation & Factoring Submission ───────────────────
    invoice_task = Task(
        description=(
            f"Generate and submit a complete freight invoice for load {delivery.get('load_id')}.\n"
            f"Bill of Lading content: {delivery.get('bol_text', 'See attached POD document')}.\n"
            "Invoice must include all required elements:\n"
            "  • Carrier legal name, MC number, and USDOT number\n"
            "  • Load/rate confirmation number\n"
            f"  • Shipper: {delivery.get('origin')} | Consignee: {delivery.get('destination')}\n"
            f"  • Delivery date: {delivery.get('delivery_date')}\n"
            f"  • Agreed freight charge: ${delivery.get('agreed_rate', 0):.2f}\n"
            "  • Fuel surcharge (if in rate confirmation — separate line item)\n"
            "  • Any earned accessorial charges: detention (if >2hrs free time exceeded), "
            "layover, TONU, lumper reimbursement, or stop-off charges\n"
            "  • Total amount due\n"
            "Pre-validate the invoice packet for factoring submission: "
            "confirm POD signature is present, load numbers match, and all required "
            "carrier authority information is complete. "
            f"Submit the complete packet to {delivery.get('factoring_company', 'factoring company')} "
            "immediately for same-day or next-business-day advance funding."
        ),
        expected_output=(
            "Invoice submission record: invoice_number, carrier_mc_number, load_id, "
            "freight_charge_usd, fuel_surcharge_usd, accessorial_charges_usd, "
            "total_invoice_amount_usd, factoring_company, submission_timestamp, "
            "factoring_confirmation_number, expected_advance_date, "
            "advance_amount_usd (typically 95-97% of invoice), "
            "remaining_reserve_usd, validation_status (passed/failed), "
            "validation_issues (list, empty if passed)."
        ),
        agent=finance_specialist,
    )

    # ── Stage 2: Tax Deduction Logging & IFTA Update ─────────────────────────
    tax_task = Task(
        description=(
            f"Log all tax-deductible expenses for load {delivery.get('load_id')} "
            f"and update the quarterly tax model for driver {delivery.get('driver_id')}.\n"
            "Expense categories to record and deduct:\n"
            f"  • Diesel fuel cost: ${delivery.get('fuel_cost', 0):.2f} (100% deductible)\n"
            f"  • Toll charges: ${delivery.get('toll_cost', 0):.2f} (100% deductible)\n"
            f"  • Maintenance reserve: ${delivery.get('miles', 0) * 0.08:.2f} "
            f"($0.08/mile × {delivery.get('miles', 0)} miles)\n"
            f"  • Per diem allowance: ${delivery.get('days_on_road', 0) * 69:.2f} "
            f"($69/day × {delivery.get('days_on_road', 0)} days per IRS Publication 463)\n"
            "Calculate gross revenue, total deductions, and net taxable income for this load. "
            "Update IFTA mileage log:\n"
            f"  States driven: {delivery.get('states_driven', [])}. "
            "Record miles per state for quarterly IFTA fuel tax calculation. "
            "Update the running quarterly federal estimated tax liability. "
            "Generate the load-level P&L summary."
        ),
        expected_output=(
            "Tax and expense log: load_id, gross_revenue_usd, "
            "fuel_deduction_usd, toll_deduction_usd, maintenance_reserve_usd, "
            "per_diem_deduction_usd, total_deductions_usd, "
            "net_taxable_income_usd, net_margin_pct, "
            "ifta_miles_by_state (dict state_code: miles), "
            "quarterly_estimated_tax_updated (bool), "
            "quarterly_tax_liability_usd (updated running total), "
            "load_pl_summary (brief natural language summary of this load's financial result)."
        ),
        agent=tax_auditor,
        context=[invoice_task],
    )

    # ── Stage 3: Fleet Maintenance Record Update ──────────────────────────────
    maintenance_task = Task(
        description=(
            f"Update fleet maintenance records for {delivery.get('miles', 0)} miles "
            f"logged by driver {delivery.get('driver_id')} on load {delivery.get('load_id')}. "
            "Recalculate odometer-based proximity to next service interval for:\n"
            "  • Engine oil and filter (typical interval: 25,000 miles on synthetic)\n"
            "  • Fuel filters primary and secondary (15,000-20,000 miles)\n"
            "  • Tire rotation (20,000-25,000 miles)\n"
            "  • Brake lining inspection (50,000 miles or DOT annual, whichever first)\n"
            "  • DPF cleaning (200,000-250,000 miles or regen cycle data)\n"
            "  • DEF system inspection (annual)\n"
            "  • DOT Annual Inspection (12 months from last)\n"
            "Classification thresholds:\n"
            "  • URGENT: service is overdue (miles exceeded or date passed)\n"
            "  • DUE SOON: within 500 miles or 30 days\n"
            "  • OK: more than 500 miles and 30 days remaining\n"
            "If URGENT flags exist, recommend immediate scheduling at next available downtime."
        ),
        expected_output=(
            "Maintenance update: driver_id, load_id, miles_added, updated_total_odometer, "
            "service_intervals (list of: service_name, last_service_miles, next_due_miles, "
            "miles_remaining, status (OK/DUE_SOON/URGENT)), "
            "urgent_flags (list of service names requiring immediate attention), "
            "recommended_shop_appointment (date string if URGENT, else null), "
            "estimated_maintenance_cost_next_30_days_usd."
        ),
        agent=maintenance_monitor,
        context=[tax_task],
    )

    # ── Stage 4: Executive Daily P&L Brief ────────────────────────────────────
    exec_brief_task = Task(
        description=(
            "Generate the daily executive P&L brief incorporating this completed load. "
            "The brief must be under 200 words total and cover:\n"
            "  1. This Load's Financial Result: gross revenue, net profit, RPM, net margin %.\n"
            "  2. YTD Scorecard: YTD gross revenue, YTD net profit, YTD average RPM, "
            "YTD average CPM, current loaded mile utilization rate.\n"
            "  3. Progress to $1,000,000 Target: % complete, dollars remaining, "
            "weekly revenue run-rate needed to hit target by December 31, 2026, "
            "and current pace status (ON TRACK / BEHIND / AHEAD).\n"
            "  4. Top Profit Leak: identify the #1 controllable expense or revenue gap "
            "that, if fixed, would have the largest positive impact on the trajectory.\n"
            "  5. Action Item for Tomorrow: one specific, actionable recommendation "
            "the driver should execute on the next load to improve profitability.\n"
            "Format for mobile dashboard display — clear, direct, numbers-first."
        ),
        expected_output=(
            "Executive daily brief: this_load_net_profit_usd, this_load_rpm, "
            "this_load_net_margin_pct, "
            "ytd_gross_revenue_usd, ytd_net_profit_usd, ytd_avg_rpm, ytd_avg_cpm, "
            "loaded_utilization_rate_pct, "
            "pct_to_1m_target, dollars_remaining_to_target, "
            "weekly_run_rate_needed_usd, pace_status (ON_TRACK/BEHIND/AHEAD), "
            "top_profit_leak (natural language, 1 sentence), "
            "action_item_tomorrow (natural language, 1-2 sentences), "
            "full_brief_text (complete brief under 200 words, formatted for mobile display)."
        ),
        agent=bi_executive,
        context=[invoice_task, tax_task, maintenance_task],
    )

    return Crew(
        agents=[
            finance_specialist,
            tax_auditor,
            maintenance_monitor,
            bi_executive,
        ],
        tasks=[
            invoice_task,
            tax_task,
            maintenance_task,
            exec_brief_task,
        ],
        process=Process.sequential,
        verbose=True,
        task_callback=make_post_delivery_callback(
            delivery.get("driver_id"), delivery.get("load_id"), delivery
        ),
    )
