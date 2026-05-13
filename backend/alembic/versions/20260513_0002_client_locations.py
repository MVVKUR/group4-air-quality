"""Add client browser location reports.

Revision ID: 20260513_0002
Revises: 20260507_0001
Create Date: 2026-05-13
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260513_0002"
down_revision: str | Sequence[str] | None = "20260507_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "client_locations",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("accuracy_m", sa.Float(), nullable=True),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column(
            "received_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "client_locations_received_at_idx",
        "client_locations",
        ["received_at"],
    )


def downgrade() -> None:
    op.drop_index("client_locations_received_at_idx", table_name="client_locations")
    op.drop_table("client_locations")
