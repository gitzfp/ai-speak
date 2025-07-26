"""add_class_code_to_classes_table

Revision ID: 1ddeb9d35a3b
Revises: 3bbe22c35a31
Create Date: 2025-07-26 18:12:36.908207

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ddeb9d35a3b'
down_revision: Union[str, None] = '3bbe22c35a31'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add class_code column to classes table
    op.add_column('classes', sa.Column('class_code', sa.String(length=6), nullable=True, comment='班级码(6位唯一)'))
    
    # Create unique index on class_code
    op.create_index('ix_classes_class_code', 'classes', ['class_code'], unique=True)


def downgrade() -> None:
    # Remove index and column
    op.drop_index('ix_classes_class_code', table_name='classes')
    op.drop_column('classes', 'class_code')
