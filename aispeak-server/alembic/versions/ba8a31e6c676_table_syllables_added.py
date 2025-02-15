"""table_syllables added

Revision ID: ba8a31e6c676
Revises: ffb22ecd4f82
Create Date: 2025-02-15 00:54:22.158047

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ba8a31e6c676'
down_revision: Union[str, None] = 'ffb22ecd4f82'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('words', sa.Column('create_time', sa.DateTime(), nullable=True))
    op.add_column('words', sa.Column('update_time', sa.DateTime(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('words', 'update_time')
    op.drop_column('words', 'create_time')
    # ### end Alembic commands ###
