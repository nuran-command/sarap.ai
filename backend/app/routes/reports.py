from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.organization import Organization
from app.models.weekly_report import WeeklyReport
from app.models.user import User
from app.schemas.weekly_report import DashboardSummary, WeeklyReportRead
from app.services.auth_service import get_current_user
from app.services.report_service import dashboard_summary, generate_weekly_report, serialize_report

router = APIRouter(tags=["reports"])


@router.post("/organizations/{organization_id}/reports/weekly/generate", response_model=WeeklyReportRead)
def create_weekly_report(
    organization_id: int,
    week_start: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    organization = _get_owned_organization(db, organization_id, current_user.id)
    report = generate_weekly_report(db, organization, week_start)
    return serialize_report(report)


@router.get("/organizations/{organization_id}/reports/weekly", response_model=list[WeeklyReportRead])
def list_weekly_reports(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, object]]:
    _get_owned_organization(db, organization_id, current_user.id)
    reports = (
        db.query(WeeklyReport)
        .filter(WeeklyReport.organization_id == organization_id)
        .order_by(WeeklyReport.week_start.desc(), WeeklyReport.id.desc())
        .all()
    )
    return [serialize_report(report) for report in reports]


@router.get("/organizations/{organization_id}/dashboard/today", response_model=DashboardSummary)
def get_today_dashboard(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    organization = _get_owned_organization(db, organization_id, current_user.id)
    return dashboard_summary(db, organization)


def _get_owned_organization(db: Session, organization_id: int, owner_id: int) -> Organization:
    organization = (
        db.query(Organization)
        .filter(Organization.id == organization_id, Organization.owner_id == owner_id)
        .first()
    )
    if organization is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return organization

