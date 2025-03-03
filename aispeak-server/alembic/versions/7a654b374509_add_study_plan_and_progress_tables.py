"""add study plan and progress tables

Revision ID: 7a654b374509
Revises: 2a04458b2ddf
Create Date: 2025-03-03 17:46:13.612636

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '7a654b374509'
down_revision: Union[str, None] = '2a04458b2ddf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('study_word_progress', sa.Column('create_time', sa.DateTime(), nullable=True, comment='创建时间'))
    op.alter_column('study_word_progress', 'last_study_time',
               existing_type=mysql.DATETIME(),
               type_=sa.Date(),
               existing_comment='最后一次学习时间',
               existing_nullable=True)
    op.alter_column('study_word_progress', 'next_review_time',
               existing_type=mysql.DATETIME(),
               type_=sa.Date(),
               existing_comment='下次复习时间（未掌握时有效）',
               existing_nullable=True)
    op.drop_column('study_word_progress', 'memory_stage')
    op.drop_column('study_word_progress', 'is_new')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('study_word_progress', sa.Column('is_new', mysql.INTEGER(display_width=11), autoincrement=False, nullable=True, comment='是否为新学单词（1=新学，0=复习）'))
    op.add_column('study_word_progress', sa.Column('memory_stage', mysql.INTEGER(display_width=11), autoincrement=False, nullable=True, comment='记忆阶段（0=未学，1=短期记忆，2=长期记忆）'))
    op.alter_column('study_word_progress', 'next_review_time',
               existing_type=sa.Date(),
               type_=mysql.DATETIME(),
               existing_comment='下次复习时间（未掌握时有效）',
               existing_nullable=True)
    op.alter_column('study_word_progress', 'last_study_time',
               existing_type=sa.Date(),
               type_=mysql.DATETIME(),
               existing_comment='最后一次学习时间',
               existing_nullable=True)
    op.drop_column('study_word_progress', 'create_time')
    # ### end Alembic commands ###
