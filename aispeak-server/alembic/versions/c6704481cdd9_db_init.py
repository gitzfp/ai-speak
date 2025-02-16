"""db init

Revision ID: c6704481cdd9
Revises: 
Create Date: 2025-02-16 17:32:41.689253

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c6704481cdd9'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('account',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('client_host', sa.String(length=50), nullable=True),
    sa.Column('user_agent', sa.String(length=512), nullable=True),
    sa.Column('fingerprint', sa.String(length=64), nullable=True),
    sa.Column('status', sa.String(length=50), nullable=True),
    sa.Column('openid', sa.String(length=100), nullable=True),
    sa.Column('session_key', sa.String(length=200), nullable=True),
    sa.Column('phone_number', sa.String(length=20), nullable=True),
    sa.Column('password', sa.String(length=300), nullable=True),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('openid'),
    sa.UniqueConstraint('phone_number')
    )
    op.create_table('account_collect',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('message_id', sa.String(length=80), nullable=True),
    sa.Column('account_id', sa.String(length=80), nullable=False),
    sa.Column('type', sa.String(length=80), nullable=False),
    sa.Column('content', sa.String(length=2500), nullable=True),
    sa.Column('translation', sa.String(length=2500), nullable=True),
    sa.Column('deleted', sa.Integer(), nullable=True),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('account_settings',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('account_id', sa.String(length=80), nullable=False),
    sa.Column('source_language', sa.String(length=80), nullable=False),
    sa.Column('target_language', sa.String(length=80), nullable=False),
    sa.Column('speech_role_name', sa.String(length=80), nullable=True),
    sa.Column('auto_playing_voice', sa.Integer(), nullable=True),
    sa.Column('playing_voice_speed', sa.String(length=50), nullable=True),
    sa.Column('auto_text_shadow', sa.Integer(), nullable=True),
    sa.Column('auto_pronunciation', sa.Integer(), nullable=True),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('account_topic',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('language', sa.String(length=80), nullable=False),
    sa.Column('ai_role', sa.String(length=280), nullable=False),
    sa.Column('my_role', sa.String(length=280), nullable=False),
    sa.Column('topic', sa.String(length=2500), nullable=False),
    sa.Column('account_id', sa.String(length=80), nullable=False),
    sa.Column('created_by', sa.String(length=80), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('sequence', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('file_detail',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('file_path', sa.String(length=150), nullable=False),
    sa.Column('module', sa.String(length=80), nullable=True),
    sa.Column('module_id', sa.String(length=80), nullable=True),
    sa.Column('file_name', sa.String(length=150), nullable=True),
    sa.Column('file_ext', sa.String(length=20), nullable=True),
    sa.Column('deleted', sa.Integer(), nullable=True),
    sa.Column('created_by', sa.String(length=80), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('message',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('session_id', sa.String(length=80), nullable=False),
    sa.Column('account_id', sa.String(length=80), nullable=False),
    sa.Column('sender', sa.String(length=80), nullable=False),
    sa.Column('receiver', sa.String(length=80), nullable=False),
    sa.Column('type', sa.String(length=50), nullable=False),
    sa.Column('content', sa.String(length=2500), nullable=False),
    sa.Column('style', sa.String(length=80), nullable=True),
    sa.Column('length', sa.Integer(), nullable=False),
    sa.Column('file_name', sa.String(length=80), nullable=True),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('deleted', sa.Integer(), nullable=True),
    sa.Column('sequence', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('message_grammar',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('session_id', sa.String(length=80), nullable=False),
    sa.Column('message_id', sa.String(length=80), nullable=False),
    sa.Column('file_name', sa.String(length=80), nullable=True),
    sa.Column('account_id', sa.String(length=80), nullable=False),
    sa.Column('type', sa.String(length=80), nullable=False),
    sa.Column('result', sa.Text(), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('message_session',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('account_id', sa.String(length=80), nullable=False),
    sa.Column('type', sa.String(length=50), nullable=False),
    sa.Column('message_count', sa.Integer(), nullable=True),
    sa.Column('is_default', sa.Integer(), nullable=True),
    sa.Column('completed', sa.Integer(), nullable=True),
    sa.Column('achieved_targets', sa.Text(), nullable=True),
    sa.Column('deleted', sa.Integer(), nullable=True),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('message_translate',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('session_id', sa.String(length=80), nullable=False),
    sa.Column('message_id', sa.String(length=80), nullable=False),
    sa.Column('account_id', sa.String(length=80), nullable=False),
    sa.Column('source_language', sa.String(length=80), nullable=False),
    sa.Column('target_language', sa.String(length=80), nullable=False),
    sa.Column('source_text', sa.String(length=512), nullable=False),
    sa.Column('target_text', sa.String(length=512), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('settings_language',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('language', sa.String(length=80), nullable=False),
    sa.Column('full_language', sa.String(length=80), nullable=False),
    sa.Column('label', sa.String(length=80), nullable=False),
    sa.Column('full_label', sa.String(length=80), nullable=False),
    sa.Column('description', sa.String(length=250), nullable=True),
    sa.Column('sequence', sa.Integer(), nullable=True),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('settings_language_example',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('language', sa.String(length=80), nullable=False),
    sa.Column('example', sa.String(length=250), nullable=True),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('settings_role',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('locale', sa.String(length=80), nullable=False),
    sa.Column('local_name', sa.String(length=80), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('short_name', sa.String(length=80), nullable=False),
    sa.Column('gender', sa.Integer(), nullable=False),
    sa.Column('avatar', sa.String(length=350), nullable=True),
    sa.Column('audio', sa.String(length=350), nullable=True),
    sa.Column('styles', sa.String(length=350), nullable=True),
    sa.Column('status', sa.String(length=80), nullable=False),
    sa.Column('sequence', sa.Integer(), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=False),
    sa.Column('update_time', sa.DateTime(), nullable=False),
    sa.Column('deleted', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('syllables',
    sa.Column('id', sa.Integer(), nullable=False, comment='音节ID'),
    sa.Column('letter', sa.String(length=50), nullable=False, comment='音节对应的字母组合'),
    sa.Column('content', sa.String(length=50), nullable=False, comment='音节内容'),
    sa.Column('sound_path', sa.String(length=500), nullable=True, comment='音节发音音频路径'),
    sa.Column('phonetic', sa.String(length=50), nullable=True, comment='音节音标'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('content')
    )
    op.create_index(op.f('ix_syllables_id'), 'syllables', ['id'], unique=False)
    op.create_table('sys_cache',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('key', sa.String(length=80), nullable=False),
    sa.Column('value', sa.String(length=512), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('sys_dict_data',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('dict_type', sa.String(length=80), nullable=False),
    sa.Column('dict_label', sa.String(length=80), nullable=False),
    sa.Column('dict_value', sa.String(length=80), nullable=False),
    sa.Column('status', sa.String(length=80), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('sys_dict_type',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('dict_type', sa.String(length=80), nullable=False),
    sa.Column('dict_name', sa.String(length=80), nullable=False),
    sa.Column('status', sa.String(length=80), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('sys_feedback',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('account_id', sa.String(length=80), nullable=False),
    sa.Column('content', sa.String(length=2500), nullable=False),
    sa.Column('contact', sa.String(length=250), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('textbook',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('subject_id', sa.Integer(), nullable=False),
    sa.Column('version_type', sa.String(length=50), nullable=False),
    sa.Column('grade', sa.String(length=50), nullable=False),
    sa.Column('term', sa.String(length=50), nullable=False),
    sa.Column('icon_url', sa.String(length=500), nullable=True),
    sa.Column('ext_id', sa.String(length=200), nullable=True),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('textbook_sentences',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('book_id', sa.String(length=80), nullable=False),
    sa.Column('page_number', sa.Integer(), nullable=False),
    sa.Column('sentence', sa.Text(), nullable=False),
    sa.Column('is_recite', sa.Integer(), nullable=True),
    sa.Column('is_ai_dub', sa.Boolean(), nullable=True),
    sa.Column('track_continue_play_id', sa.String(length=80), nullable=True),
    sa.Column('track_url_source', sa.String(length=500), nullable=True),
    sa.Column('track_right', sa.Float(), nullable=True),
    sa.Column('track_top', sa.Float(), nullable=True),
    sa.Column('track_left', sa.Float(), nullable=True),
    sa.Column('track_url', sa.String(length=500), nullable=True),
    sa.Column('track_id', sa.Integer(), nullable=False),
    sa.Column('is_evaluation', sa.Integer(), nullable=True),
    sa.Column('track_name', sa.String(length=200), nullable=True),
    sa.Column('track_genre', sa.String(length=200), nullable=True),
    sa.Column('track_duration', sa.Float(), nullable=True),
    sa.Column('track_index', sa.Integer(), nullable=False),
    sa.Column('track_text', sa.String(length=500), nullable=True),
    sa.Column('track_evaluation', sa.String(length=500), nullable=True),
    sa.Column('track_bottom', sa.Float(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('topic',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('group_id', sa.String(length=80), nullable=False),
    sa.Column('language', sa.String(length=80), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.Column('level', sa.Integer(), nullable=False),
    sa.Column('role_short_name', sa.String(length=80), nullable=False),
    sa.Column('speech_rate', sa.String(length=80), nullable=False),
    sa.Column('topic_bot_name', sa.String(length=580), nullable=False),
    sa.Column('topic_user_name', sa.String(length=580), nullable=False),
    sa.Column('prompt', sa.String(length=2500), nullable=False),
    sa.Column('description', sa.String(length=580), nullable=False),
    sa.Column('status', sa.String(length=80), nullable=False),
    sa.Column('sequence', sa.Integer(), nullable=False),
    sa.Column('image_url', sa.String(length=500), nullable=True),
    sa.Column('created_by', sa.String(length=80), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('created_by_index', 'topic', ['created_by'], unique=False)
    op.create_index('group_id_index', 'topic', ['group_id'], unique=False)
    op.create_table('topic_group',
    sa.Column('id', sa.String(length=80), nullable=False),
    sa.Column('type', sa.String(length=80), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.Column('description', sa.String(length=80), nullable=False),
    sa.Column('status', sa.String(length=80), nullable=False),
    sa.Column('sequence', sa.Integer(), nullable=False),
    sa.Column('created_by', sa.String(length=80), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('topic_history',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('account_id', sa.String(length=80), nullable=False),
    sa.Column('topic_id', sa.String(length=80), nullable=False),
    sa.Column('topic_type', sa.String(length=80), nullable=False),
    sa.Column('topic_name', sa.String(length=80), nullable=False),
    sa.Column('main_target_count', sa.Integer(), nullable=False),
    sa.Column('trial_target_count', sa.Integer(), nullable=False),
    sa.Column('main_target_completed_count', sa.Integer(), nullable=False),
    sa.Column('trial_target_completed_count', sa.Integer(), nullable=False),
    sa.Column('completion', sa.Integer(), nullable=False),
    sa.Column('audio_score', sa.Integer(), nullable=True),
    sa.Column('content_score', sa.Integer(), nullable=True),
    sa.Column('suggestion', sa.String(length=2080), nullable=True),
    sa.Column('word_count', sa.Integer(), nullable=True),
    sa.Column('session_id', sa.String(length=80), nullable=False),
    sa.Column('completed', sa.String(length=80), nullable=False),
    sa.Column('status', sa.String(length=80), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('topic_phrase',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('topic_id', sa.String(length=80), nullable=False),
    sa.Column('phrase', sa.String(length=500), nullable=False),
    sa.Column('phrase_translation', sa.String(length=500), nullable=True),
    sa.Column('type', sa.String(length=80), nullable=False),
    sa.Column('status', sa.String(length=80), nullable=False),
    sa.Column('sequence', sa.Integer(), nullable=False),
    sa.Column('created_by', sa.String(length=80), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('topic_id_index', 'topic_phrase', ['topic_id'], unique=False)
    op.create_table('topic_session_relation',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('topic_id', sa.String(length=80), nullable=False),
    sa.Column('session_id', sa.String(length=80), nullable=False),
    sa.Column('account_id', sa.String(length=80), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('session_id_index', 'topic_session_relation', ['session_id'], unique=False)
    op.create_index('topic_id_index', 'topic_session_relation', ['topic_id'], unique=False)
    op.create_table('topic_target',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('topic_id', sa.String(length=80), nullable=False),
    sa.Column('type', sa.String(length=80), nullable=False),
    sa.Column('description', sa.String(length=500), nullable=False),
    sa.Column('description_translation', sa.String(length=500), nullable=True),
    sa.Column('status', sa.String(length=80), nullable=False),
    sa.Column('sequence', sa.Integer(), nullable=False),
    sa.Column('created_by', sa.String(length=80), nullable=False),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('topic_id_index', 'topic_target', ['topic_id'], unique=False)
    op.create_table('word_syllables',
    sa.Column('id', sa.Integer(), nullable=False, comment='主键ID'),
    sa.Column('word_id', sa.Integer(), nullable=False, comment='单词ID'),
    sa.Column('syllable_id', sa.Integer(), nullable=False, comment='音节ID'),
    sa.Column('position', sa.Integer(), nullable=False, comment='音节在单词中的位置'),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_word_syllable', 'word_syllables', ['word_id', 'syllable_id'], unique=False)
    op.create_index(op.f('ix_word_syllables_id'), 'word_syllables', ['id'], unique=False)
    op.create_index(op.f('ix_word_syllables_syllable_id'), 'word_syllables', ['syllable_id'], unique=False)
    op.create_index(op.f('ix_word_syllables_word_id'), 'word_syllables', ['word_id'], unique=False)
    op.create_table('words',
    sa.Column('id', sa.Integer(), nullable=False, comment='主键ID'),
    sa.Column('word_id', sa.Integer(), nullable=False, comment='单词唯一标识ID'),
    sa.Column('lesson_id', sa.Integer(), nullable=False, comment='所属课时ID'),
    sa.Column('book_id', sa.String(length=50), nullable=False, comment='所属书籍ID'),
    sa.Column('word', sa.String(length=100), nullable=True, comment='单词内容'),
    sa.Column('chinese', sa.String(length=200), nullable=True, comment='单词的中文释义'),
    sa.Column('phonetic', sa.String(length=100), nullable=True, comment='单词的音标'),
    sa.Column('uk_phonetic', sa.String(length=100), nullable=True, comment='英式音标'),
    sa.Column('us_phonetic', sa.String(length=100), nullable=True, comment='美式音标'),
    sa.Column('sound_path', sa.String(length=500), nullable=True, comment='单词音频文件路径'),
    sa.Column('uk_sound_path', sa.String(length=500), nullable=True, comment='英式发音音频路径'),
    sa.Column('us_sound_path', sa.String(length=500), nullable=True, comment='美式发音音频路径'),
    sa.Column('image_path', sa.String(length=500), nullable=True, comment='单词图片文件路径'),
    sa.Column('has_base', sa.Boolean(), nullable=True, comment='是否包含基础词信息'),
    sa.Column('paraphrase', sa.Text(), nullable=True, comment='单词的详细释义'),
    sa.Column('phonics', sa.Text(), nullable=True, comment='单词的自然拼读信息'),
    sa.Column('word_tense', sa.Text(), nullable=True, comment='单词的不同词态（如单数、复数、过去式等）'),
    sa.Column('example_sentence', sa.Text(), nullable=True, comment='包含该单词的例句'),
    sa.Column('phrase', sa.Text(), nullable=True, comment='包含该单词的常见词组'),
    sa.Column('synonym', sa.Text(), nullable=True, comment='单词的近义词'),
    sa.Column('create_time', sa.DateTime(), nullable=True),
    sa.Column('update_time', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_words_id'), 'words', ['id'], unique=False)
    op.create_index(op.f('ix_words_word_id'), 'words', ['word_id'], unique=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_words_word_id'), table_name='words')
    op.drop_index(op.f('ix_words_id'), table_name='words')
    op.drop_table('words')
    op.drop_index(op.f('ix_word_syllables_word_id'), table_name='word_syllables')
    op.drop_index(op.f('ix_word_syllables_syllable_id'), table_name='word_syllables')
    op.drop_index(op.f('ix_word_syllables_id'), table_name='word_syllables')
    op.drop_index('idx_word_syllable', table_name='word_syllables')
    op.drop_table('word_syllables')
    op.drop_index('topic_id_index', table_name='topic_target')
    op.drop_table('topic_target')
    op.drop_index('topic_id_index', table_name='topic_session_relation')
    op.drop_index('session_id_index', table_name='topic_session_relation')
    op.drop_table('topic_session_relation')
    op.drop_index('topic_id_index', table_name='topic_phrase')
    op.drop_table('topic_phrase')
    op.drop_table('topic_history')
    op.drop_table('topic_group')
    op.drop_index('group_id_index', table_name='topic')
    op.drop_index('created_by_index', table_name='topic')
    op.drop_table('topic')
    op.drop_table('textbook_sentences')
    op.drop_table('textbook')
    op.drop_table('sys_feedback')
    op.drop_table('sys_dict_type')
    op.drop_table('sys_dict_data')
    op.drop_table('sys_cache')
    op.drop_index(op.f('ix_syllables_id'), table_name='syllables')
    op.drop_table('syllables')
    op.drop_table('settings_role')
    op.drop_table('settings_language_example')
    op.drop_table('settings_language')
    op.drop_table('message_translate')
    op.drop_table('message_session')
    op.drop_table('message_grammar')
    op.drop_table('message')
    op.drop_table('file_detail')
    op.drop_table('account_topic')
    op.drop_table('account_settings')
    op.drop_table('account_collect')
    op.drop_table('account')
    # ### end Alembic commands ###
