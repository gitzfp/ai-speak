"""description of the migration

Revision ID: 24f5e7af6ff8
Revises: 64bf13d5f58c
Create Date: 2025-01-12 03:21:18.579316

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '24f5e7af6ff8'
down_revision: Union[str, None] = '64bf13d5f58c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('account', sa.Column('openid', sa.String(length=100), nullable=True))
    op.add_column('account', sa.Column('session_key', sa.String(length=200), nullable=True))
    op.add_column('account', sa.Column('phone_number', sa.String(length=20), nullable=True))
    op.add_column('account', sa.Column('password', sa.String(length=100), nullable=False))
    op.create_unique_constraint(None, 'account', ['openid'])
    op.create_unique_constraint(None, 'account', ['phone_number'])
    op.alter_column('exercise_options', 'exercise_id',
               existing_type=mysql.INTEGER(),
               nullable=False)
    op.alter_column('exercise_options', 'is_correct',
               existing_type=mysql.TINYINT(),
               type_=sa.Integer(),
               existing_nullable=True)
    op.alter_column('exercise_options', 'text',
               existing_type=mysql.TEXT(),
               nullable=False)
    op.alter_column('exercise_options', 'audio',
               existing_type=mysql.VARCHAR(length=255),
               type_=sa.String(length=500),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'lesson_id',
               existing_type=mysql.INTEGER(),
               nullable=False)
    op.alter_column('lesson_explain', 'teacher_id',
               existing_type=mysql.INTEGER(),
               nullable=False)
    op.alter_column('lesson_explain', 'explain_content',
               existing_type=mysql.TEXT(),
               nullable=False)
    op.alter_column('lesson_explain', 'explain_audio',
               existing_type=mysql.VARCHAR(length=255),
               type_=sa.String(length=500),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'explain_audio_duration',
               existing_type=mysql.DECIMAL(precision=10, scale=3),
               type_=sa.Float(),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'status',
               existing_type=mysql.TINYINT(),
               type_=sa.Integer(),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'isai',
               existing_type=mysql.TINYINT(),
               type_=sa.Integer(),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'is_edit',
               existing_type=mysql.TINYINT(),
               type_=sa.Integer(),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'type',
               existing_type=mysql.TINYINT(),
               type_=sa.Integer(),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'create_time',
               existing_type=mysql.TIMESTAMP(),
               type_=sa.DateTime(),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'update_time',
               existing_type=mysql.TIMESTAMP(),
               type_=sa.DateTime(),
               existing_nullable=True)
    op.alter_column('lesson_part', 'textbook_id',
               existing_type=mysql.VARCHAR(length=80),
               nullable=True)
    op.alter_column('lesson_part', 'is_show',
               existing_type=mysql.TINYINT(),
               type_=sa.Integer(),
               existing_nullable=True,
               existing_server_default=sa.text("'1'"))
    op.alter_column('lesson_part', 'must',
               existing_type=mysql.TINYINT(),
               type_=sa.Integer(),
               existing_nullable=True,
               existing_server_default=sa.text("'0'"))
    op.drop_constraint('lesson_part_ibfk_1', 'lesson_part', type_='foreignkey')
    op.alter_column('lesson_point', 'type',
               existing_type=mysql.TINYINT(),
               type_=sa.Integer(),
               existing_nullable=False)
    op.alter_column('message_session', 'achieved_targets',
               existing_type=mysql.JSON(),
               type_=sa.Text(),
               existing_nullable=True)
    op.alter_column('task_target', 'lesson_id',
               existing_type=mysql.INTEGER(),
               nullable=False)
    op.alter_column('textbook_category', 'id',
               existing_type=mysql.INTEGER(),
               type_=sa.String(length=80),
               nullable=False)
    op.drop_index('idx_pid', table_name='textbook_category')
    op.drop_index('idx_textbook_id', table_name='textbook_category')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_index('idx_textbook_id', 'textbook_category', ['textbook_id'], unique=False)
    op.create_index('idx_pid', 'textbook_category', ['pid'], unique=False)
    op.alter_column('textbook_category', 'id',
               existing_type=sa.String(length=80),
               type_=mysql.INTEGER(),
               nullable=True)
    op.alter_column('task_target', 'lesson_id',
               existing_type=mysql.INTEGER(),
               nullable=True)
    op.alter_column('message_session', 'achieved_targets',
               existing_type=sa.Text(),
               type_=mysql.JSON(),
               existing_nullable=True)
    op.alter_column('lesson_point', 'type',
               existing_type=sa.Integer(),
               type_=mysql.TINYINT(),
               existing_nullable=False)
    op.create_foreign_key('lesson_part_ibfk_1', 'lesson_part', 'textbook', ['textbook_id'], ['id'])
    op.alter_column('lesson_part', 'must',
               existing_type=sa.Integer(),
               type_=mysql.TINYINT(),
               existing_nullable=True,
               existing_server_default=sa.text("'0'"))
    op.alter_column('lesson_part', 'is_show',
               existing_type=sa.Integer(),
               type_=mysql.TINYINT(),
               existing_nullable=True,
               existing_server_default=sa.text("'1'"))
    op.alter_column('lesson_part', 'textbook_id',
               existing_type=mysql.VARCHAR(length=80),
               nullable=False)
    op.alter_column('lesson_explain', 'update_time',
               existing_type=sa.DateTime(),
               type_=mysql.TIMESTAMP(),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'create_time',
               existing_type=sa.DateTime(),
               type_=mysql.TIMESTAMP(),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'type',
               existing_type=sa.Integer(),
               type_=mysql.TINYINT(),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'is_edit',
               existing_type=sa.Integer(),
               type_=mysql.TINYINT(),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'isai',
               existing_type=sa.Integer(),
               type_=mysql.TINYINT(),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'status',
               existing_type=sa.Integer(),
               type_=mysql.TINYINT(),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'explain_audio_duration',
               existing_type=sa.Float(),
               type_=mysql.DECIMAL(precision=10, scale=3),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'explain_audio',
               existing_type=sa.String(length=500),
               type_=mysql.VARCHAR(length=255),
               existing_nullable=True)
    op.alter_column('lesson_explain', 'explain_content',
               existing_type=mysql.TEXT(),
               nullable=True)
    op.alter_column('lesson_explain', 'teacher_id',
               existing_type=mysql.INTEGER(),
               nullable=True)
    op.alter_column('lesson_explain', 'lesson_id',
               existing_type=mysql.INTEGER(),
               nullable=True)
    op.alter_column('exercise_options', 'audio',
               existing_type=sa.String(length=500),
               type_=mysql.VARCHAR(length=255),
               existing_nullable=True)
    op.alter_column('exercise_options', 'text',
               existing_type=mysql.TEXT(),
               nullable=True)
    op.alter_column('exercise_options', 'is_correct',
               existing_type=sa.Integer(),
               type_=mysql.TINYINT(),
               existing_nullable=True)
    op.alter_column('exercise_options', 'exercise_id',
               existing_type=mysql.INTEGER(),
               nullable=True)
    op.drop_constraint(None, 'account', type_='unique')
    op.drop_constraint(None, 'account', type_='unique')
    op.drop_column('account', 'password')
    op.drop_column('account', 'phone_number')
    op.drop_column('account', 'session_key')
    op.drop_column('account', 'openid')
    # ### end Alembic commands ###
