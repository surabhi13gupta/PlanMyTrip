"""trip share link: trips.share_token and trips.shared_at (backend-spec §4.3).

Two nullable columns: existing trips simply aren't shared, and code still running never reads
them. The unique index lets many trips have NULL.

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-18 21:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0005"
down_revision: str | Sequence[str] | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("trips", sa.Column("share_token", sa.String(length=32), nullable=True))
    op.add_column("trips", sa.Column("shared_at", sa.DateTime(timezone=True), nullable=True))
    op.create_unique_constraint("trips_share_token_key", "trips", ["share_token"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("trips_share_token_key", "trips", type_="unique")
    op.drop_column("trips", "shared_at")
    op.drop_column("trips", "share_token")
