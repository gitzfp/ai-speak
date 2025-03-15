"""create_study_plans_and_progress_tables

Revision ID: dce2cb236b6f
Revises: 
Create Date: 2025-03-01 17:16:26.460387

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dce2cb236b6f'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建 study_plans 表
    op.drop_table('study_plans')
    op.create_table(
        'study_plans',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer, nullable=False, comment='用户ID'),
        sa.Column('book_id', sa.Integer, nullable=False, comment='书籍ID'),
        sa.Column('daily_words', sa.Integer, default=0, comment='计划每天学多少个单词'),
        sa.Column('total_words', sa.Integer, default=0, comment='这本书总共多少单词'),
        sa.Column('total_days', sa.Integer, default=0, comment='总计划天数'),
        sa.Column('create_time', sa.DateTime, default=sa.func.now(), comment='创建时间'),
    )

    # 创建 study_word_progress 表
    op.drop_table('study_word_progress')
    op.create_table(
        'study_word_progress',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer, nullable=False, comment='用户ID'),
        sa.Column('word_id', sa.Integer, nullable=False, comment='单词ID'),
        sa.Column('book_id', sa.Integer, nullable=False, comment='书籍ID'),
        sa.Column('learning_count', sa.Integer, default=0, comment='累计学习次数'),
        sa.Column('correct_count', sa.Integer, default=0, comment='正确次数（用户答对次数）'),
        sa.Column('incorrect_count', sa.Integer, default=0, comment='错误次数（用户答错次数）'),
        sa.Column('last_study_time', sa.DateTime, comment='最后一次学习时间'),
        sa.Column('next_review_time', sa.DateTime, comment='下次复习时间（未掌握时有效）'),
        sa.Column('memory_stage', sa.Integer, default=0, comment='记忆阶段（0=未学，1=短期记忆，2=长期记忆）'),
        sa.Column('is_mastered', sa.Integer, default=0, comment='是否已掌握（0=未掌握，1=已掌握）'),
        sa.Column('study_date', sa.Date, comment='学习日期'),
        sa.Column('is_new', sa.Integer, default=1, comment='是否为新学单词（1=新学，0=复习）'),
        sa.Index('idx_user_word', 'user_id', 'word_id'),
    )

    # 创建 study_records 表
    op.drop_table('study_records')
    op.create_table(
        'study_records',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True, comment='记录唯一标识'),
        sa.Column('user_id', sa.Integer, nullable=False, comment='用户ID'),
        sa.Column('book_id', sa.Integer, nullable=False, comment='书籍ID'),
        sa.Column('study_date', sa.Date, nullable=False, comment='学习日期'),
        sa.Column('new_words', sa.Integer, default=0, comment='今日新学单词数'),
        sa.Column('review_words', sa.Integer, default=0, comment='今日复习单词数'),
        sa.Column('duration', sa.Integer, default=0, comment='今日学习时长（分钟）'),
    )


def downgrade() -> None:
    # 删除 study_records 表
    op.drop_table('study_records')

    # 删除 study_word_progress 表
    op.drop_table('study_word_progress')

    # 删除 study_plans 表
    op.drop_table('study_plans')