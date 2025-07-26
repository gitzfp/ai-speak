"""add_student_id_to_submissions

Revision ID: f5fda3b0b7dd
Revises: bdd1d23a9c59
Create Date: 2025-07-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'f5fda3b0b7dd'
down_revision: Union[str, None] = 'd96bf7ee7518'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add student_id column to submissions table
    op.add_column('submissions', sa.Column('student_id', sa.String(length=80), nullable=True, comment='学生ID'))
    op.create_index(op.f('ix_submissions_student_id'), 'submissions', ['student_id'], unique=False)


def downgrade() -> None:
    # Remove student_id column and index
    op.drop_index(op.f('ix_submissions_student_id'), table_name='submissions')
    op.drop_column('submissions', 'student_id')