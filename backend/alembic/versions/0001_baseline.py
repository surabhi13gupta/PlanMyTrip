"""baseline: empty starting point, so the Vercel build has a migration to run (setup check).

The real tables arrive in Step 2.

Revision ID: 0001
Revises:
Create Date: 2026-10-04 12:23:58.897695

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""


def downgrade() -> None:
    """Downgrade schema."""
