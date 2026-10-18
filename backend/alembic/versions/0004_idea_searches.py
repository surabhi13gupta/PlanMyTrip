"""idea searches: saved SerpApi answers for the Ideas panel (backend-spec §4.5).

A new table only, so it is safe for code that is still running, which never reads it.

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-18 18:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0004"
down_revision: str | Sequence[str] | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "idea_searches",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("query_key", sa.String(length=250), nullable=False),
        sa.Column("category", sa.String(length=30), nullable=False),
        sa.Column("results", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "fetched_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("fetched_by", sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(["fetched_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("query_key"),
    )
    op.create_index(
        "ix_idea_searches_fetched_by_fetched_at",
        "idea_searches",
        ["fetched_by", "fetched_at"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_idea_searches_fetched_by_fetched_at", table_name="idea_searches")
    op.drop_table("idea_searches")
