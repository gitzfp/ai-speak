"""添加 content_id

Revision ID: e7114820b742
Revises: daac3e06cc75
Create Date: 2025-03-14 13:47:58.770011

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7114820b742'
down_revision: Union[str, None] = 'daac3e06cc75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('study_progress_reports', sa.Column('content_id', sa.Integer(), nullable=False, comment='内容ID（单词ID或句子ID等）'))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('study_progress_reports', 'content_id')
    # ### end Alembic commands ###
