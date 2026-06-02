"""Create initial Sarap.ai tables.

Revision ID: 0001_initial_schema
Revises: None
Create Date: 2026-06-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organizations_id"), "organizations", ["id"], unique=False)
    op.create_index(op.f("ix_organizations_owner_id"), "organizations", ["owner_id"], unique=False)

    op.create_table(
        "branches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("current_rating", sa.Float(), nullable=False),
        sa.Column("review_count", sa.Integer(), nullable=False),
        sa.Column("risk_level", sa.String(length=24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_branches_id"), "branches", ["id"], unique=False)
    op.create_index(op.f("ix_branches_name"), "branches", ["name"], unique=False)
    op.create_index(op.f("ix_branches_organization_id"), "branches", ["organization_id"], unique=False)

    op.create_table(
        "weekly_reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("week_end", sa.Date(), nullable=False),
        sa.Column("total_reviews", sa.Integer(), nullable=False),
        sa.Column("negative_reviews", sa.Integer(), nullable=False),
        sa.Column("unanswered_reviews", sa.Integer(), nullable=False),
        sa.Column("top_complaint", sa.String(length=64), nullable=False),
        sa.Column("worst_branch", sa.String(length=255), nullable=False),
        sa.Column("rating_change", sa.Float(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("recommended_actions", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_weekly_reports_id"), "weekly_reports", ["id"], unique=False)
    op.create_index(op.f("ix_weekly_reports_organization_id"), "weekly_reports", ["organization_id"], unique=False)
    op.create_index(op.f("ix_weekly_reports_week_end"), "weekly_reports", ["week_end"], unique=False)
    op.create_index(op.f("ix_weekly_reports_week_start"), "weekly_reports", ["week_start"], unique=False)

    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("branch_id", sa.Integer(), nullable=False),
        sa.Column("reviewer_name", sa.String(length=255), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("review_date", sa.Date(), nullable=False),
        sa.Column("source", sa.String(length=80), nullable=False),
        sa.Column("is_answered", sa.Boolean(), nullable=False),
        sa.Column("sentiment", sa.String(length=24), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("urgency", sa.String(length=24), nullable=False),
        sa.Column("language", sa.String(length=12), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reviews_branch_id"), "reviews", ["branch_id"], unique=False)
    op.create_index(op.f("ix_reviews_category"), "reviews", ["category"], unique=False)
    op.create_index(op.f("ix_reviews_id"), "reviews", ["id"], unique=False)
    op.create_index(op.f("ix_reviews_review_date"), "reviews", ["review_date"], unique=False)
    op.create_index(op.f("ix_reviews_sentiment"), "reviews", ["sentiment"], unique=False)
    op.create_index(op.f("ix_reviews_urgency"), "reviews", ["urgency"], unique=False)

    op.create_table(
        "ai_replies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("review_id", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(length=12), nullable=False),
        sa.Column("tone", sa.String(length=40), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["review_id"], ["reviews.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_replies_id"), "ai_replies", ["id"], unique=False)
    op.create_index(op.f("ix_ai_replies_review_id"), "ai_replies", ["review_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_replies_review_id"), table_name="ai_replies")
    op.drop_index(op.f("ix_ai_replies_id"), table_name="ai_replies")
    op.drop_table("ai_replies")

    op.drop_index(op.f("ix_reviews_urgency"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_sentiment"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_review_date"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_category"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_branch_id"), table_name="reviews")
    op.drop_table("reviews")

    op.drop_index(op.f("ix_weekly_reports_week_start"), table_name="weekly_reports")
    op.drop_index(op.f("ix_weekly_reports_week_end"), table_name="weekly_reports")
    op.drop_index(op.f("ix_weekly_reports_organization_id"), table_name="weekly_reports")
    op.drop_index(op.f("ix_weekly_reports_id"), table_name="weekly_reports")
    op.drop_table("weekly_reports")

    op.drop_index(op.f("ix_branches_organization_id"), table_name="branches")
    op.drop_index(op.f("ix_branches_name"), table_name="branches")
    op.drop_index(op.f("ix_branches_id"), table_name="branches")
    op.drop_table("branches")

    op.drop_index(op.f("ix_organizations_owner_id"), table_name="organizations")
    op.drop_index(op.f("ix_organizations_id"), table_name="organizations")
    op.drop_table("organizations")

    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
