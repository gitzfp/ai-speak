"""description of the migration

Revision ID: 8cbe66d27b05
Revises: 21e3a67abca6
Create Date: 2025-01-22 02:09:32.532805

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '8cbe66d27b05'
down_revision: Union[str, None] = '21e3a67abca6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('exercise', 'lesson_id',
               existing_type=mysql.INTEGER(),
               type_=sa.String(length=100),
               existing_nullable=False)
    op.alter_column('lesson_explain', 'lesson_id',
               existing_type=mysql.INTEGER(),
               type_=sa.String(length=100),
               existing_nullable=False)
    op.alter_column('lesson_part', 'lesson_id',
               existing_type=mysql.INTEGER(),
               type_=sa.String(length=100),
               existing_nullable=False)
    op.alter_column('lesson_point', 'lesson_id',
               existing_type=mysql.INTEGER(),
               type_=sa.String(length=100),
               existing_nullable=False)
    op.alter_column('teacher', 'lesson_id',
               existing_type=mysql.INTEGER(),
               type_=sa.String(length=100),
               existing_nullable=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('teacher', 'lesson_id',
               existing_type=sa.String(length=100),
               type_=mysql.INTEGER(),
               existing_nullable=True)
    op.alter_column('lesson_point', 'lesson_id',
               existing_type=sa.String(length=100),
               type_=mysql.INTEGER(),
               existing_nullable=False)
    op.alter_column('lesson_part', 'lesson_id',
               existing_type=sa.String(length=100),
               type_=mysql.INTEGER(),
               existing_nullable=False)
    op.alter_column('lesson_explain', 'lesson_id',
               existing_type=sa.String(length=100),
               type_=mysql.INTEGER(),
               existing_nullable=False)
    op.alter_column('exercise', 'lesson_id',
               existing_type=sa.String(length=100),
               type_=mysql.INTEGER(),
               existing_nullable=False)
    # ### end Alembic commands ###