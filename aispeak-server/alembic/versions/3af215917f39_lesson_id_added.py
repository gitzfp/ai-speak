"""lesson_id added

Revision ID: 3af215917f39
Revises: 9a954c1fc3e1
Create Date: 2025-02-22 13:35:52.590080

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3af215917f39'
down_revision: Union[str, None] = '9a954c1fc3e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('lesson', sa.Column('lesson_id', sa.String(length=80), nullable=False))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('lesson', 'lesson_id')
    # ### end Alembic commands ###
