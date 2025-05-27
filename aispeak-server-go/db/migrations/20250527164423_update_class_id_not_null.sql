-- Create "study_records" table
CREATE TABLE `study_records` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT "记录唯一标识",
  `user_id` varchar(50) NOT NULL COMMENT "用户ID",
  `book_id` varchar(50) NOT NULL COMMENT "书籍ID",
  `study_date` date NOT NULL COMMENT "学习日期",
  `new_words` int NULL COMMENT "今日新学单词数",
  `review_words` int NULL COMMENT "今日复习单词数",
  `duration` int NULL COMMENT "今日学习时长（分钟）",
  `update_time` datetime NULL COMMENT "更新时间",
  `create_time` datetime NULL COMMENT "创建时间",
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "notifications" table
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NULL,
  `updated_at` datetime(3) NULL,
  `deleted_at` datetime(3) NULL,
  `task_id` bigint unsigned NOT NULL COMMENT "任务ID",
  `recipient_id` varchar(80) NOT NULL COMMENT "接收者ID",
  `notification_type` varchar(50) NOT NULL COMMENT "通知类型",
  `title` varchar(200) NOT NULL COMMENT "通知标题",
  `message` text NOT NULL COMMENT "通知内容",
  `is_read` bool NULL DEFAULT 0 COMMENT "是否已读",
  `read_time` datetime(3) NULL COMMENT "阅读时间",
  PRIMARY KEY (`id`),
  INDEX `idx_notifications_deleted_at` (`deleted_at`),
  INDEX `idx_notifications_is_read` (`is_read`),
  INDEX `idx_notifications_notification_type` (`notification_type`),
  INDEX `idx_notifications_read_time` (`read_time`),
  INDEX `idx_notifications_recipient_id` (`recipient_id`),
  INDEX `idx_notifications_task_id` (`task_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "account_settings" table
CREATE TABLE `account_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` varchar(80) NOT NULL,
  `source_language` varchar(80) NOT NULL,
  `target_language` varchar(80) NOT NULL,
  `speech_role_name` varchar(80) NULL,
  `auto_playing_voice` int NULL,
  `playing_voice_speed` varchar(50) NULL,
  `auto_text_shadow` int NULL,
  `auto_pronunciation` int NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "account_topic" table
CREATE TABLE `account_topic` (
  `id` varchar(80) NOT NULL,
  `language` varchar(80) NOT NULL,
  `ai_role` varchar(280) NOT NULL,
  `my_role` varchar(280) NOT NULL,
  `topic` varchar(2500) NOT NULL,
  `account_id` varchar(80) NOT NULL,
  `created_by` varchar(80) NOT NULL,
  `create_time` datetime NULL,
  `sequence` int NOT NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "alembic_version" table
CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL,
  PRIMARY KEY (`version_num`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "class_students" table
CREATE TABLE `class_students` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NULL,
  `updated_at` datetime(3) NULL,
  `deleted_at` datetime(3) NULL,
  `class_id` varchar(80) NOT NULL COMMENT "班级ID",
  `student_id` varchar(80) NOT NULL COMMENT "学生ID",
  `join_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT "加入日期",
  `leave_date` datetime(3) NULL COMMENT "离开日期",
  `status` varchar(20) NULL DEFAULT "active" COMMENT "状态",
  `role` varchar(50) NULL COMMENT "班级角色",
  PRIMARY KEY (`id`),
  INDEX `idx_class_students_class_id` (`class_id`),
  INDEX `idx_class_students_deleted_at` (`deleted_at`),
  INDEX `idx_class_students_status` (`status`),
  INDEX `idx_class_students_student_id` (`student_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "class_teachers" table
CREATE TABLE `class_teachers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NULL,
  `updated_at` datetime(3) NULL,
  `deleted_at` datetime(3) NULL,
  `class_id` varchar(80) NOT NULL COMMENT "班级ID",
  `teacher_id` varchar(80) NOT NULL COMMENT "教师ID",
  `join_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT "加入日期",
  `leave_date` datetime(3) NULL COMMENT "离开日期",
  `status` varchar(20) NULL DEFAULT "active" COMMENT "状态",
  `role` varchar(50) NULL COMMENT "教师角色",
  PRIMARY KEY (`id`),
  INDEX `idx_class_teachers_class_id` (`class_id`),
  INDEX `idx_class_teachers_deleted_at` (`deleted_at`),
  INDEX `idx_class_teachers_status` (`status`),
  INDEX `idx_class_teachers_teacher_id` (`teacher_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "classes" table
CREATE TABLE `classes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NULL,
  `updated_at` datetime(3) NULL,
  `deleted_at` datetime(3) NULL,
  `name` varchar(200) NOT NULL COMMENT "班级名称",
  `grade_level` varchar(50) NOT NULL COMMENT "年级",
  `subject` varchar(50) NULL COMMENT "主教学科",
  `school_id` varchar(80) NULL COMMENT "学校ID",
  `teacher_id` varchar(80) NOT NULL COMMENT "班主任ID",
  `status` varchar(20) NULL DEFAULT "active" COMMENT "状态",
  `description` text NULL COMMENT "班级描述",
  `max_students` bigint NOT NULL DEFAULT 50 COMMENT "最大学生人数",
  PRIMARY KEY (`id`),
  INDEX `idx_classes_deleted_at` (`deleted_at`),
  INDEX `idx_classes_grade_level` (`grade_level`),
  INDEX `idx_classes_school_id` (`school_id`),
  INDEX `idx_classes_status` (`status`),
  INDEX `idx_classes_subject` (`subject`),
  INDEX `idx_classes_teacher_id` (`teacher_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "file_detail" table
CREATE TABLE `file_detail` (
  `id` varchar(80) NOT NULL,
  `file_path` varchar(150) NOT NULL,
  `module` varchar(80) NULL,
  `module_id` varchar(80) NULL,
  `file_name` varchar(150) NULL,
  `file_ext` varchar(20) NULL,
  `deleted` int NULL,
  `created_by` varchar(80) NOT NULL,
  `create_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "lesson" table
CREATE TABLE `lesson` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  `book_id` varchar(80) NOT NULL,
  `parent_id` varchar(80) NULL,
  `lesson_id` varchar(80) NOT NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "lesson_sentence" table
CREATE TABLE `lesson_sentence` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lesson_id` int NOT NULL,
  `english` text NOT NULL,
  `chinese` text NOT NULL,
  `audio_url` varchar(500) NULL,
  `audio_start` int NULL,
  `audio_end` int NULL,
  `is_lock` int NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "message" table
CREATE TABLE `message` (
  `id` varchar(80) NOT NULL,
  `session_id` varchar(80) NOT NULL,
  `account_id` varchar(80) NOT NULL,
  `sender` varchar(80) NOT NULL,
  `receiver` varchar(80) NOT NULL,
  `type` varchar(50) NOT NULL,
  `content` varchar(2500) NOT NULL,
  `style` varchar(80) NULL,
  `length` int NOT NULL,
  `file_name` varchar(800) NULL,
  `create_time` datetime NULL,
  `deleted` int NULL,
  `sequence` int NOT NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "message_grammar" table
CREATE TABLE `message_grammar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(80) NOT NULL,
  `message_id` varchar(80) NOT NULL,
  `file_name` varchar(80) NULL,
  `account_id` varchar(80) NOT NULL,
  `type` varchar(80) NOT NULL,
  `result` text NOT NULL,
  `create_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "submissions" table
CREATE TABLE `submissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NULL,
  `updated_at` datetime(3) NULL,
  `deleted_at` datetime(3) NULL,
  `student_task_id` bigint unsigned NOT NULL COMMENT "学生任务ID",
  `content_id` bigint unsigned NOT NULL COMMENT "内容ID",
  `response` text NULL COMMENT "回答内容",
  `media_files` json NULL COMMENT "统一媒体文件",
  `is_correct` bool NULL COMMENT "是否正确",
  `auto_score` double NULL COMMENT "自动评分",
  `teacher_score` double NULL COMMENT "教师评分",
  `feedback` text NULL COMMENT "单项反馈",
  `attempt_count` bigint NULL DEFAULT 1 COMMENT "尝试次数",
  PRIMARY KEY (`id`),
  INDEX `idx_submissions_content_id` (`content_id`),
  INDEX `idx_submissions_deleted_at` (`deleted_at`),
  INDEX `idx_submissions_is_correct` (`is_correct`),
  INDEX `idx_submissions_student_task_id` (`student_task_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "message_translate" table
CREATE TABLE `message_translate` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(80) NOT NULL,
  `message_id` varchar(80) NOT NULL,
  `account_id` varchar(80) NOT NULL,
  `source_language` varchar(80) NOT NULL,
  `target_language` varchar(80) NOT NULL,
  `source_text` varchar(512) NOT NULL,
  `target_text` varchar(512) NOT NULL,
  `create_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "study_word_progress" table
CREATE TABLE `study_word_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL COMMENT "用户ID",
  `word_id` int NOT NULL COMMENT "单词ID",
  `book_id` varchar(50) NOT NULL COMMENT "书籍ID",
  `plan_id` int NOT NULL COMMENT "计划ID",
  `learning_count` int NULL COMMENT "累计学习次数",
  `correct_count` int NULL COMMENT "正确次数（用户答对次数）",
  `incorrect_count` int NULL COMMENT "错误次数（用户答错次数）",
  `last_study_time` datetime NULL COMMENT "最后一次学习时间",
  `next_review_time` datetime NULL COMMENT "下次复习时间（未掌握时有效）",
  `is_mastered` int NULL COMMENT "是否已掌握（0=未掌握，1=已掌握）",
  `study_date` date NULL COMMENT "学习日期",
  `type` int NULL COMMENT "单词类型（0=没全部学完模式，1=全部学完三种模式）",
  `create_time` datetime NULL COMMENT "创建时间",
  `update_time` datetime NULL COMMENT "更新时间",
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "settings_language" table
CREATE TABLE `settings_language` (
  `id` varchar(80) NOT NULL,
  `language` varchar(80) NOT NULL,
  `full_language` varchar(80) NOT NULL,
  `label` varchar(80) NOT NULL,
  `full_label` varchar(80) NOT NULL,
  `description` varchar(250) NULL,
  `sequence` int NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "settings_language_example" table
CREATE TABLE `settings_language_example` (
  `id` varchar(80) NOT NULL,
  `language` varchar(80) NOT NULL,
  `example` varchar(250) NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "settings_role" table
CREATE TABLE `settings_role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `locale` varchar(80) NOT NULL,
  `local_name` varchar(80) NOT NULL,
  `name` varchar(255) NOT NULL,
  `short_name` varchar(80) NOT NULL,
  `gender` int NOT NULL,
  `avatar` varchar(350) NULL,
  `audio` varchar(350) NULL,
  `styles` varchar(350) NULL,
  `status` varchar(80) NOT NULL,
  `sequence` int NOT NULL,
  `create_time` datetime NOT NULL,
  `update_time` datetime NOT NULL,
  `deleted` int NOT NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "study_completion_records" table
CREATE TABLE `study_completion_records` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT "完成记录唯一标识",
  `user_id` varchar(50) NOT NULL COMMENT "用户ID",
  `book_id` varchar(50) NOT NULL COMMENT "书籍ID",
  `date` date NOT NULL COMMENT "完成日期",
  `status` int NULL COMMENT "完成状态（0: 未完成, 1: 已完成）",
  `continuous_days` int NULL COMMENT "连续完成天数",
  `create_time` datetime NULL COMMENT "创建时间",
  `update_time` datetime NULL COMMENT "更新时间",
  `lesson_id` int NULL COMMENT "课程ID",
  `type` int NULL COMMENT "类型（0: 单词, 1: 句子,2.背词计划用了, 3:真正的单词拼写）",
  `speak_count` int NULL COMMENT "开口次数",
  `points` int NULL COMMENT "积分",
  `progress_data` text NULL COMMENT "存储类似 study_progress_reports 表的数据",
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "study_plans" table
CREATE TABLE `study_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL COMMENT "用户ID",
  `book_id` varchar(50) NOT NULL COMMENT "书籍ID",
  `daily_words` int NULL COMMENT "计划每天学多少个单词",
  `create_time` datetime NULL COMMENT "创建时间",
  `update_time` datetime NULL COMMENT "更新时间",
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "study_progress_reports" table
CREATE TABLE `study_progress_reports` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT "报告唯一标识",
  `user_id` varchar(50) NOT NULL COMMENT "用户ID",
  `book_id` varchar(50) NOT NULL COMMENT "书籍ID",
  `lesson_id` int NULL COMMENT "课程ID",
  `content` varchar(255) NOT NULL COMMENT "学习内容（单词或句子）",
  `content_type` int NOT NULL COMMENT "类型（0: 单词发音, 1: 单词读, 2: 单词写, 3: 单独拼写按钮进去的那边提交, 4:句子）",
  `error_count` int NULL COMMENT "错误次数（仅对单词的读和写有效）",
  `points` int NULL COMMENT "积分",
  `create_time` datetime NULL COMMENT "创建时间",
  `update_time` datetime NULL COMMENT "更新时间",
  `json_data` text NULL COMMENT "TEXT 数据 的评分数据",
  `content_id` int NOT NULL COMMENT "内容ID（单词ID或句子ID等）",
  `voice_file` varchar(300) NULL COMMENT "语音文件路径或 URL",
  `chinese` varchar(300) NULL COMMENT "中文翻译",
  `audio_url` varchar(300) NULL COMMENT "音频文件路径或 URL",
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "account_collect" table
CREATE TABLE `account_collect` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message_id` varchar(80) NULL,
  `account_id` varchar(80) NOT NULL,
  `type` varchar(80) NOT NULL,
  `content` varchar(2500) NULL,
  `translation` varchar(2500) NULL,
  `deleted` int NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  `word_id` int NULL,
  `book_id` varchar(80) NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "account" table
CREATE TABLE `account` (
  `id` varchar(80) NOT NULL,
  `client_host` varchar(50) NULL,
  `user_agent` varchar(512) NULL,
  `fingerprint` varchar(64) NULL,
  `status` varchar(50) NULL,
  `openid` varchar(100) NULL,
  `session_key` varchar(200) NULL,
  `phone_number` varchar(20) NULL,
  `password` varchar(300) NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  `points` int NULL COMMENT "积分",
  `user_name` varchar(100) NULL COMMENT "用户昵称",
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "message_session" table
CREATE TABLE `message_session` (
  `id` varchar(80) NOT NULL,
  `account_id` varchar(80) NOT NULL,
  `type` varchar(50) NOT NULL,
  `message_count` int NULL,
  `is_default` int NULL,
  `completed` int NULL,
  `achieved_targets` text NULL,
  `deleted` int NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "syllables" table
CREATE TABLE `syllables` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT "音节ID",
  `letter` varchar(50) NOT NULL COMMENT "音节对应的字母组合",
  `content` varchar(50) NOT NULL COMMENT "音节内容",
  `sound_path` varchar(500) NULL COMMENT "音节发音音频路径",
  `phonetic` varchar(50) NULL COMMENT "音节音标",
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "sys_cache" table
CREATE TABLE `sys_cache` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(80) NOT NULL,
  `value` varchar(512) NOT NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "sys_dict_data" table
CREATE TABLE `sys_dict_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dict_type` varchar(80) NOT NULL,
  `dict_label` varchar(80) NOT NULL,
  `dict_value` varchar(80) NOT NULL,
  `status` varchar(80) NOT NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "sys_dict_type" table
CREATE TABLE `sys_dict_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dict_type` varchar(80) NOT NULL,
  `dict_name` varchar(80) NOT NULL,
  `status` varchar(80) NOT NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "sys_feedback" table
CREATE TABLE `sys_feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` varchar(80) NOT NULL,
  `content` varchar(2500) NOT NULL,
  `contact` varchar(250) NOT NULL,
  `create_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "words" table
CREATE TABLE `words` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT "主键ID",
  `word_id` int NOT NULL COMMENT "单词唯一标识ID",
  `lesson_id` int NOT NULL COMMENT "所属课时ID",
  `book_id` varchar(50) NOT NULL COMMENT "所属书籍ID",
  `word` varchar(100) NULL COMMENT "单词内容",
  `chinese` varchar(200) NULL COMMENT "单词的中文释义",
  `phonetic` varchar(100) NULL COMMENT "单词的音标",
  `uk_phonetic` varchar(100) NULL COMMENT "英式音标",
  `us_phonetic` varchar(100) NULL COMMENT "美式音标",
  `sound_path` varchar(500) NULL COMMENT "单词音频文件路径",
  `uk_sound_path` varchar(500) NULL COMMENT "英式发音音频路径",
  `us_sound_path` varchar(500) NULL COMMENT "美式发音音频路径",
  `image_path` varchar(500) NULL COMMENT "单词图片文件路径",
  `has_base` bool NULL COMMENT "是否包含基础词信息",
  `paraphrase` text NULL COMMENT "单词的详细释义",
  `phonics` text NULL COMMENT "单词的自然拼读信息",
  `word_tense` text NULL COMMENT "单词的不同词态（如单数、复数、过去式等）",
  `example_sentence` text NULL COMMENT "包含该单词的例句",
  `phrase` text NULL COMMENT "包含该单词的常见词组",
  `synonym` text NULL COMMENT "单词的近义词",
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "task_target" table
CREATE TABLE `task_target` (
  `id` int NOT NULL AUTO_INCREMENT,
  `info_cn` varchar(200) NOT NULL,
  `info_en` varchar(200) NULL,
  `lesson_id` varchar(500) NOT NULL,
  `info_en_audio` varchar(500) NULL,
  `match_type` int NOT NULL,
  `status` int NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "tasks" table
CREATE TABLE `tasks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NULL,
  `updated_at` datetime(3) NULL,
  `deleted_at` datetime(3) NULL,
  `teacher_id` varchar(80) NOT NULL COMMENT "教师ID",
  `class_id` varchar(80) NOT NULL COMMENT "班级ID",
  `title` varchar(200) NOT NULL COMMENT "任务标题",
  `description` text NULL COMMENT "任务描述",
  `task_type` varchar(50) NOT NULL COMMENT "任务类型",
  `subject` varchar(50) NOT NULL COMMENT "所属学科",
  `deadline` datetime(3) NULL COMMENT "截止时间",
  `status` varchar(20) NULL DEFAULT "draft" COMMENT "任务状态",
  `allow_late_submission` bool NULL DEFAULT 0 COMMENT "允许迟交",
  `max_attempts` bigint NULL COMMENT "最大尝试次数",
  `grading_criteria` text NULL COMMENT "评分标准",
  `total_points` bigint NULL DEFAULT 100 COMMENT "总分",
  `attachments` json NULL COMMENT "附件信息",
  `textbook_id` bigint unsigned NULL COMMENT "关联教材ID",
  `lesson_id` bigint unsigned NULL COMMENT "关联教学单元ID",
  PRIMARY KEY (`id`),
  INDEX `idx_tasks_class_id` (`class_id`),
  INDEX `idx_tasks_deleted_at` (`deleted_at`),
  INDEX `idx_tasks_lesson_id` (`lesson_id`),
  INDEX `idx_tasks_status` (`status`),
  INDEX `idx_tasks_subject` (`subject`),
  INDEX `idx_tasks_task_type` (`task_type`),
  INDEX `idx_tasks_teacher_id` (`teacher_id`),
  INDEX `idx_tasks_textbook_id` (`textbook_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "textbook" table
CREATE TABLE `textbook` (
  `id` varchar(80) NOT NULL,
  `name` varchar(200) NOT NULL,
  `subject_id` int NOT NULL,
  `version_type` varchar(50) NOT NULL,
  `publisher` varchar(50) NOT NULL,
  `grade` varchar(50) NOT NULL,
  `term` varchar(50) NOT NULL,
  `icon_url` varchar(500) NULL,
  `ext_id` varchar(200) NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "textbook_chapter" table
CREATE TABLE `textbook_chapter` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `book_id` varchar(100) NOT NULL,
  `parent_id` int NULL,
  `page_id` int NULL,
  `page_no` int NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "textbook_page" table
CREATE TABLE `textbook_page` (
  `id` varchar(80) NOT NULL,
  `book_id` varchar(80) NOT NULL,
  `page_name` varchar(200) NOT NULL,
  `page_no` int NOT NULL,
  `page_no_v2` varchar(50) NULL,
  `page_url` varchar(500) NULL,
  `page_url_source` varchar(500) NULL,
  `version` varchar(50) NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "textbook_sentences" table
CREATE TABLE `textbook_sentences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` varchar(80) NOT NULL,
  `page_no` int NOT NULL,
  `sentence` text NOT NULL,
  `is_recite` int NULL,
  `is_ai_dub` bool NULL,
  `track_continue_play_id` varchar(80) NULL,
  `track_url_source` varchar(500) NULL,
  `track_right` float NULL,
  `track_top` float NULL,
  `track_left` float NULL,
  `track_url` varchar(500) NULL,
  `track_id` int NULL,
  `is_evaluation` int NULL,
  `track_name` varchar(200) NULL,
  `track_genre` text NULL,
  `track_duration` float NULL,
  `track_index` int NOT NULL,
  `track_text` text NULL,
  `track_evaluation` text NULL,
  `track_bottom` float NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "topic" table
CREATE TABLE `topic` (
  `id` varchar(80) NOT NULL,
  `group_id` varchar(80) NOT NULL,
  `language` varchar(80) NOT NULL,
  `name` varchar(80) NOT NULL,
  `level` int NOT NULL,
  `role_short_name` varchar(80) NOT NULL,
  `speech_rate` varchar(80) NOT NULL,
  `topic_bot_name` varchar(580) NOT NULL,
  `topic_user_name` varchar(580) NOT NULL,
  `prompt` varchar(2500) NOT NULL,
  `description` varchar(580) NOT NULL,
  `status` varchar(80) NOT NULL,
  `sequence` int NOT NULL,
  `image_url` varchar(500) NULL,
  `created_by` varchar(80) NOT NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "topic_group" table
CREATE TABLE `topic_group` (
  `id` varchar(80) NOT NULL,
  `type` varchar(80) NOT NULL,
  `name` varchar(80) NOT NULL,
  `description` varchar(80) NOT NULL,
  `status` varchar(80) NOT NULL,
  `sequence` int NOT NULL,
  `created_by` varchar(80) NOT NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "topic_history" table
CREATE TABLE `topic_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` varchar(80) NOT NULL,
  `topic_id` varchar(80) NOT NULL,
  `topic_type` varchar(80) NOT NULL,
  `topic_name` varchar(80) NOT NULL,
  `main_target_count` int NOT NULL,
  `trial_target_count` int NOT NULL,
  `main_target_completed_count` int NOT NULL,
  `trial_target_completed_count` int NOT NULL,
  `completion` int NOT NULL,
  `audio_score` int NULL,
  `content_score` int NULL,
  `suggestion` varchar(2080) NULL,
  `word_count` int NULL,
  `session_id` varchar(80) NOT NULL,
  `completed` varchar(80) NOT NULL,
  `status` varchar(80) NOT NULL,
  `create_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "topic_phrase" table
CREATE TABLE `topic_phrase` (
  `id` int NOT NULL AUTO_INCREMENT,
  `topic_id` varchar(80) NOT NULL,
  `phrase` varchar(500) NOT NULL,
  `phrase_translation` varchar(500) NULL,
  `type` varchar(80) NOT NULL,
  `status` varchar(80) NOT NULL,
  `sequence` int NOT NULL,
  `created_by` varchar(80) NOT NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "topic_session_relation" table
CREATE TABLE `topic_session_relation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `topic_id` varchar(80) NOT NULL,
  `session_id` varchar(80) NOT NULL,
  `account_id` varchar(80) NOT NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "topic_target" table
CREATE TABLE `topic_target` (
  `id` int NOT NULL AUTO_INCREMENT,
  `topic_id` varchar(80) NOT NULL,
  `type` varchar(80) NOT NULL,
  `description` varchar(500) NOT NULL,
  `description_translation` varchar(500) NULL,
  `status` varchar(80) NOT NULL,
  `sequence` int NOT NULL,
  `created_by` varchar(80) NOT NULL,
  `create_time` datetime NULL,
  `update_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "word_syllables" table
CREATE TABLE `word_syllables` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT "主键ID",
  `word_id` int NOT NULL COMMENT "单词ID",
  `syllable_id` int NOT NULL COMMENT "音节ID",
  `position` int NOT NULL COMMENT "音节在单词中的位置",
  `create_time` datetime NULL,
  PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "task_contents" table
CREATE TABLE `task_contents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NULL,
  `updated_at` datetime(3) NULL,
  `deleted_at` datetime(3) NULL,
  `task_id` bigint unsigned NULL COMMENT "所属任务ID",
  `content_type` varchar(50) NULL COMMENT "内容类型（dictation/spelling/...）",
  `generate_mode` varchar(20) NULL DEFAULT "auto" COMMENT "生成模式(auto/manual)",
  `ref_book_id` varchar(50) NULL COMMENT "关联教材ID",
  `ref_lesson_id` bigint NULL COMMENT "关联单元ID",
  `selected_word_ids` json NULL COMMENT "手动选择的单词ID列表",
  `selected_sentence_ids` json NULL COMMENT "手动选择的句子ID列表",
  `points` bigint NULL COMMENT "分值",
  `metadata` json NULL COMMENT "元数据",
  `order_num` bigint NULL COMMENT "排序号",
  PRIMARY KEY (`id`),
  INDEX `idx_task_contents_content_type` (`content_type`),
  INDEX `idx_task_contents_deleted_at` (`deleted_at`),
  INDEX `idx_task_contents_ref_book_id` (`ref_book_id`),
  INDEX `idx_task_contents_ref_lesson_id` (`ref_lesson_id`),
  INDEX `idx_task_contents_task_id` (`task_id`),
  CONSTRAINT `fk_tasks_task_contents` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
