"""
PHI Backend Application Package

This package contains the core backend components for Prince Haul Intelligence.
"""

from .database import (
    Base,
    engine,
    SessionLocal,
    User,
    CustomerLead,
    CustomerJourneyEvent,
    CustomerFollowUp,
    CustomerAppointment,
    CustomerRevenueEntry,
    ActiveLoad,
    AIActionLog,
    FinancialVault,
    init_db,
    get_db,
    get_customer_lead,
    log_customer_event,
    get_fcm_token,
    set_fcm_token,
    log_agent_action,
    clear_invoice,
)

from .job_queue import JobQueue, JobStatus, JobRecord, get_job_queue, init_job_queue

__all__ = [
    # Database
    "Base",
    "engine",
    "SessionLocal",
    "User",
    "CustomerLead",
    "CustomerJourneyEvent",
    "CustomerFollowUp",
    "CustomerAppointment",
    "CustomerRevenueEntry",
    "ActiveLoad",
    "AIActionLog",
    "FinancialVault",
    "init_db",
    "get_db",
    "get_customer_lead",
    "log_customer_event",
    "get_fcm_token",
    "set_fcm_token",
    "log_agent_action",
    "clear_invoice",
    # Job Queue
    "JobQueue",
    "JobStatus",
    "JobRecord",
    "get_job_queue",
    "init_job_queue",
]
