"""update auto shadow to 0

Revision ID: 3636e05d53a7
Revises: ec6a356eb64a
Create Date: 2025-03-30 14:38:25.340294

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3636e05d53a7'
down_revision: Union[str, None] = 'ec6a356eb64a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###
