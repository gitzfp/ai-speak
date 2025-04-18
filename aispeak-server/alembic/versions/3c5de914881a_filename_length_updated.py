"""filename length updated

Revision ID: 3c5de914881a
Revises: 3636e05d53a7
Create Date: 2025-04-10 01:55:01.064690

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '3c5de914881a'
down_revision: Union[str, None] = '3636e05d53a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('message', 'file_name',
               existing_type=mysql.VARCHAR(length=80),
               type_=sa.String(length=800),
               existing_nullable=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('message', 'file_name',
               existing_type=sa.String(length=800),
               type_=mysql.VARCHAR(length=80),
               existing_nullable=True)
    # ### end Alembic commands ###
