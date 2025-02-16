"""textbook page added

Revision ID: afa99d2c6bba
Revises: 09db9db90593
Create Date: 2025-02-16 23:46:05.830600

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'afa99d2c6bba'
down_revision: Union[str, None] = '09db9db90593'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('textbook_sentences', sa.Column('page_no', sa.Integer(), nullable=False))
    op.drop_column('textbook_sentences', 'page_number')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('textbook_sentences', sa.Column('page_number', mysql.INTEGER(), autoincrement=False, nullable=False))
    op.drop_column('textbook_sentences', 'page_no')
    # ### end Alembic commands ###
