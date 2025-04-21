-- Create "submissions" table
CREATE TABLE `submissions` (
mysql`id` bigint unsigned NOT NULL AUTO_INCREMENT,
mysql`created_at` datetime(3) NULL,
mysql`updated_at` datetime(3) NULL,
mysql`deleted_at` datetime(3) NULL,
mysql`student_task_id` bigint unsigned NOT NULL COMMENT "学生任务ID",
mysql`content_id` bigint unsigned NOT NULL COMMENT "内容ID",
mysql`response` text NULL COMMENT "回答内容",
mysql`audio_url` varchar(500) NULL COMMENT "音频URL",
mysql`image_url` varchar(500) NULL COMMENT "图片URL",
mysql`file_url` varchar(500) NULL COMMENT "文件URL",
mysql`is_correct` bool NULL COMMENT "是否正确",
mysql`auto_score` double NULL COMMENT "自动评分",
mysql`teacher_score` double NULL COMMENT "教师评分",
mysql`feedback` text NULL COMMENT "单项反馈",
mysql`attempt_count` bigint NULL DEFAULT 1 COMMENT "尝试次数",
mysql PRIMARY KEY (`id`),
mysql INDEX `idx_submissions_content_id` (`content_id`),
mysql INDEX `idx_submissions_deleted_at` (`deleted_at`),
mysql INDEX `idx_submissions_is_correct` (`is_correct`),
mysql INDEX `idx_submissions_student_task_id` (`student_task_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "lesson_sentence" table
CREATE TABLE `lesson_sentence` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`lesson_id` int NOT NULL,
mysql`english` text NOT NULL,
mysql`chinese` text NOT NULL,
mysql`audio_url` varchar(500) NULL,
mysql`audio_start` int NULL,
mysql`audio_end` int NULL,
mysql`is_lock` int NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "account_settings" table
CREATE TABLE `account_settings` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`account_id` varchar(80) NOT NULL,
mysql`source_language` varchar(80) NOT NULL,
mysql`target_language` varchar(80) NOT NULL,
mysql`speech_role_name` varchar(80) NULL,
mysql`auto_playing_voice` int NULL,
mysql`playing_voice_speed` varchar(50) NULL,
mysql`auto_text_shadow` int NULL,
mysql`auto_pronunciation` int NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "account_topic" table
CREATE TABLE `account_topic` (
mysql`id` varchar(80) NOT NULL,
mysql`language` varchar(80) NOT NULL,
mysql`ai_role` varchar(280) NOT NULL,
mysql`my_role` varchar(280) NOT NULL,
mysql`topic` varchar(2500) NOT NULL,
mysql`account_id` varchar(80) NOT NULL,
mysql`created_by` varchar(80) NOT NULL,
mysql`create_time` datetime NULL,
mysql`sequence` int NOT NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "alembic_version" table
CREATE TABLE `alembic_version` (
mysql`version_num` varchar(32) NOT NULL,
mysql PRIMARY KEY (`version_num`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "atlas_schema_revisions" table
CREATE TABLE `atlas_schema_revisions` (
mysql`version` varchar(255) NOT NULL,
mysql`description` varchar(255) NOT NULL,
mysql`type` bigint unsigned NOT NULL DEFAULT 2,
mysql`applied` bigint NOT NULL DEFAULT 0,
mysql`total` bigint NOT NULL DEFAULT 0,
mysql`executed_at` timestamp NOT NULL,
mysql`execution_time` bigint NOT NULL,
mysql`error` longtext NULL,
mysql`error_stmt` longtext NULL,
mysql`hash` varchar(255) NOT NULL,
mysql`partial_hashes` json NULL,
mysql`operator_version` varchar(255) NOT NULL,
mysql PRIMARY KEY (`version`)
) CHARSET utf8mb4 COLLATE utf8mb4_bin;
-- Create "class_students" table
CREATE TABLE `class_students` (
mysql`id` bigint unsigned NOT NULL AUTO_INCREMENT,
mysql`created_at` datetime(3) NULL,
mysql`updated_at` datetime(3) NULL,
mysql`deleted_at` datetime(3) NULL,
mysql`class_id` varchar(80) NOT NULL COMMENT "班级ID",
mysql`student_id` varchar(80) NOT NULL COMMENT "学生ID",
mysql`join_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT "加入日期",
mysql`leave_date` datetime(3) NULL COMMENT "离开日期",
mysql`status` varchar(20) NULL DEFAULT "active" COMMENT "状态",
mysql`role` varchar(50) NULL COMMENT "班级角色",
mysql PRIMARY KEY (`id`),
mysql INDEX `idx_class_students_class_id` (`class_id`),
mysql INDEX `idx_class_students_deleted_at` (`deleted_at`),
mysql INDEX `idx_class_students_status` (`status`),
mysql INDEX `idx_class_students_student_id` (`student_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "classes" table
CREATE TABLE `classes` (
mysql`id` varchar(80) NOT NULL COMMENT "班级ID",
mysql`name` varchar(200) NOT NULL COMMENT "班级名称",
mysql`grade_level` varchar(50) NOT NULL COMMENT "年级",
mysql`subject` varchar(50) NULL COMMENT "主教学科",
mysql`school_id` varchar(80) NULL COMMENT "学校ID",
mysql`teacher_id` varchar(80) NOT NULL COMMENT "班主任ID",
mysql`status` varchar(20) NULL DEFAULT "active" COMMENT "状态",
mysql`description` text NULL COMMENT "班级描述",
mysql`created_at` datetime(3) NULL,
mysql`updated_at` datetime(3) NULL,
mysql PRIMARY KEY (`id`),
mysql INDEX `idx_classes_grade_level` (`grade_level`),
mysql INDEX `idx_classes_school_id` (`school_id`),
mysql INDEX `idx_classes_status` (`status`),
mysql INDEX `idx_classes_subject` (`subject`),
mysql INDEX `idx_classes_teacher_id` (`teacher_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "file_detail" table
CREATE TABLE `file_detail` (
mysql`id` varchar(80) NOT NULL,
mysql`file_path` varchar(150) NOT NULL,
mysql`module` varchar(80) NULL,
mysql`module_id` varchar(80) NULL,
mysql`file_name` varchar(150) NULL,
mysql`file_ext` varchar(20) NULL,
mysql`deleted` int NULL,
mysql`created_by` varchar(80) NOT NULL,
mysql`create_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "account" table
CREATE TABLE `account` (
mysql`id` varchar(80) NOT NULL,
mysql`client_host` varchar(50) NULL,
mysql`user_agent` varchar(512) NULL,
mysql`fingerprint` varchar(64) NULL,
mysql`status` varchar(50) NULL,
mysql`openid` varchar(100) NULL,
mysql`session_key` varchar(200) NULL,
mysql`phone_number` varchar(20) NULL,
mysql`password` varchar(300) NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql`points` int NULL COMMENT "积分",
mysql`user_name` varchar(100) NULL COMMENT "用户昵称",
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "study_word_progress" table
CREATE TABLE `study_word_progress` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`user_id` varchar(50) NOT NULL COMMENT "用户ID",
mysql`word_id` int NOT NULL COMMENT "单词ID",
mysql`book_id` varchar(50) NOT NULL COMMENT "书籍ID",
mysql`plan_id` int NOT NULL COMMENT "计划ID",
mysql`learning_count` int NULL COMMENT "累计学习次数",
mysql`correct_count` int NULL COMMENT "正确次数（用户答对次数）",
mysql`incorrect_count` int NULL COMMENT "错误次数（用户答错次数）",
mysql`last_study_time` datetime NULL COMMENT "最后一次学习时间",
mysql`next_review_time` datetime NULL COMMENT "下次复习时间（未掌握时有效）",
mysql`is_mastered` int NULL COMMENT "是否已掌握（0=未掌握，1=已掌握）",
mysql`study_date` date NULL COMMENT "学习日期",
mysql`type` int NULL COMMENT "单词类型（0=没全部学完模式，1=全部学完三种模式）",
mysql`create_time` datetime NULL COMMENT "创建时间",
mysql`update_time` datetime NULL COMMENT "更新时间",
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "message" table
CREATE TABLE `message` (
mysql`id` varchar(80) NOT NULL,
mysql`session_id` varchar(80) NOT NULL,
mysql`account_id` varchar(80) NOT NULL,
mysql`sender` varchar(80) NOT NULL,
mysql`receiver` varchar(80) NOT NULL,
mysql`type` varchar(50) NOT NULL,
mysql`content` varchar(2500) NOT NULL,
mysql`style` varchar(80) NULL,
mysql`length` int NOT NULL,
mysql`file_name` varchar(800) NULL,
mysql`create_time` datetime NULL,
mysql`deleted` int NULL,
mysql`sequence` int NOT NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "message_grammar" table
CREATE TABLE `message_grammar` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`session_id` varchar(80) NOT NULL,
mysql`message_id` varchar(80) NOT NULL,
mysql`file_name` varchar(80) NULL,
mysql`account_id` varchar(80) NOT NULL,
mysql`type` varchar(80) NOT NULL,
mysql`result` text NOT NULL,
mysql`create_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "message_session" table
CREATE TABLE `message_session` (
mysql`id` varchar(80) NOT NULL,
mysql`account_id` varchar(80) NOT NULL,
mysql`type` varchar(50) NOT NULL,
mysql`message_count` int NULL,
mysql`is_default` int NULL,
mysql`completed` int NULL,
mysql`achieved_targets` text NULL,
mysql`deleted` int NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "message_translate" table
CREATE TABLE `message_translate` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`session_id` varchar(80) NOT NULL,
mysql`message_id` varchar(80) NOT NULL,
mysql`account_id` varchar(80) NOT NULL,
mysql`source_language` varchar(80) NOT NULL,
mysql`target_language` varchar(80) NOT NULL,
mysql`source_text` varchar(512) NOT NULL,
mysql`target_text` varchar(512) NOT NULL,
mysql`create_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "notifications" table
CREATE TABLE `notifications` (
mysql`id` bigint unsigned NOT NULL AUTO_INCREMENT,
mysql`created_at` datetime(3) NULL,
mysql`updated_at` datetime(3) NULL,
mysql`deleted_at` datetime(3) NULL,
mysql`task_id` bigint unsigned NOT NULL COMMENT "任务ID",
mysql`recipient_id` varchar(80) NOT NULL COMMENT "接收者ID",
mysql`notification_type` varchar(50) NOT NULL COMMENT "通知类型",
mysql`title` varchar(200) NOT NULL COMMENT "通知标题",
mysql`message` text NOT NULL COMMENT "通知内容",
mysql`is_read` bool NULL DEFAULT 0 COMMENT "是否已读",
mysql`read_time` datetime(3) NULL COMMENT "阅读时间",
mysql PRIMARY KEY (`id`),
mysql INDEX `idx_notifications_deleted_at` (`deleted_at`),
mysql INDEX `idx_notifications_is_read` (`is_read`),
mysql INDEX `idx_notifications_notification_type` (`notification_type`),
mysql INDEX `idx_notifications_read_time` (`read_time`),
mysql INDEX `idx_notifications_recipient_id` (`recipient_id`),
mysql INDEX `idx_notifications_task_id` (`task_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "settings_language" table
CREATE TABLE `settings_language` (
mysql`id` varchar(80) NOT NULL,
mysql`language` varchar(80) NOT NULL,
mysql`full_language` varchar(80) NOT NULL,
mysql`label` varchar(80) NOT NULL,
mysql`full_label` varchar(80) NOT NULL,
mysql`description` varchar(250) NULL,
mysql`sequence` int NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "settings_language_example" table
CREATE TABLE `settings_language_example` (
mysql`id` varchar(80) NOT NULL,
mysql`language` varchar(80) NOT NULL,
mysql`example` varchar(250) NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "settings_role" table
CREATE TABLE `settings_role` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`locale` varchar(80) NOT NULL,
mysql`local_name` varchar(80) NOT NULL,
mysql`name` varchar(255) NOT NULL,
mysql`short_name` varchar(80) NOT NULL,
mysql`gender` int NOT NULL,
mysql`avatar` varchar(350) NULL,
mysql`audio` varchar(350) NULL,
mysql`styles` varchar(350) NULL,
mysql`status` varchar(80) NOT NULL,
mysql`sequence` int NOT NULL,
mysql`create_time` datetime NOT NULL,
mysql`update_time` datetime NOT NULL,
mysql`deleted` int NOT NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "study_completion_records" table
CREATE TABLE `study_completion_records` (
mysql`id` int NOT NULL AUTO_INCREMENT COMMENT "完成记录唯一标识",
mysql`user_id` varchar(50) NOT NULL COMMENT "用户ID",
mysql`book_id` varchar(50) NOT NULL COMMENT "书籍ID",
mysql`date` date NOT NULL COMMENT "完成日期",
mysql`status` int NULL COMMENT "完成状态（0: 未完成, 1: 已完成）",
mysql`continuous_days` int NULL COMMENT "连续完成天数",
mysql`create_time` datetime NULL COMMENT "创建时间",
mysql`update_time` datetime NULL COMMENT "更新时间",
mysql`lesson_id` int NULL COMMENT "课程ID",
mysql`type` int NULL COMMENT "类型（0: 单词, 1: 句子,2.背词计划用了, 3:真正的单词拼写）",
mysql`speak_count` int NULL COMMENT "开口次数",
mysql`points` int NULL COMMENT "积分",
mysql`progress_data` text NULL COMMENT "存储类似 study_progress_reports 表的数据",
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "study_plans" table
CREATE TABLE `study_plans` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`user_id` varchar(50) NOT NULL COMMENT "用户ID",
mysql`book_id` varchar(50) NOT NULL COMMENT "书籍ID",
mysql`daily_words` int NULL COMMENT "计划每天学多少个单词",
mysql`create_time` datetime NULL COMMENT "创建时间",
mysql`update_time` datetime NULL COMMENT "更新时间",
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "study_progress_reports" table
CREATE TABLE `study_progress_reports` (
mysql`id` int NOT NULL AUTO_INCREMENT COMMENT "报告唯一标识",
mysql`user_id` varchar(50) NOT NULL COMMENT "用户ID",
mysql`book_id` varchar(50) NOT NULL COMMENT "书籍ID",
mysql`lesson_id` int NULL COMMENT "课程ID",
mysql`content` varchar(255) NOT NULL COMMENT "学习内容（单词或句子）",
mysql`content_type` int NOT NULL COMMENT "类型（0: 单词发音, 1: 单词读, 2: 单词写, 3: 单独拼写按钮进去的那边提交, 4:句子）",
mysql`error_count` int NULL COMMENT "错误次数（仅对单词的读和写有效）",
mysql`points` int NULL COMMENT "积分",
mysql`create_time` datetime NULL COMMENT "创建时间",
mysql`update_time` datetime NULL COMMENT "更新时间",
mysql`json_data` text NULL COMMENT "TEXT 数据 的评分数据",
mysql`content_id` int NOT NULL COMMENT "内容ID（单词ID或句子ID等）",
mysql`voice_file` varchar(300) NULL COMMENT "语音文件路径或 URL",
mysql`chinese` varchar(300) NULL COMMENT "中文翻译",
mysql`audio_url` varchar(300) NULL COMMENT "音频文件路径或 URL",
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "account_collect" table
CREATE TABLE `account_collect` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`message_id` varchar(80) NULL,
mysql`account_id` varchar(80) NOT NULL,
mysql`type` varchar(80) NOT NULL,
mysql`content` varchar(2500) NULL,
mysql`translation` varchar(2500) NULL,
mysql`deleted` int NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql`word_id` int NULL,
mysql`book_id` varchar(80) NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "study_records" table
CREATE TABLE `study_records` (
mysql`id` int NOT NULL AUTO_INCREMENT COMMENT "记录唯一标识",
mysql`user_id` varchar(50) NOT NULL COMMENT "用户ID",
mysql`book_id` varchar(50) NOT NULL COMMENT "书籍ID",
mysql`study_date` date NOT NULL COMMENT "学习日期",
mysql`new_words` int NULL COMMENT "今日新学单词数",
mysql`review_words` int NULL COMMENT "今日复习单词数",
mysql`duration` int NULL COMMENT "今日学习时长（分钟）",
mysql`update_time` datetime NULL COMMENT "更新时间",
mysql`create_time` datetime NULL COMMENT "创建时间",
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "lesson" table
CREATE TABLE `lesson` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`title` varchar(200) NOT NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql`book_id` varchar(80) NOT NULL,
mysql`parent_id` varchar(80) NULL,
mysql`lesson_id` varchar(80) NOT NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "syllables" table
CREATE TABLE `syllables` (
mysql`id` int NOT NULL AUTO_INCREMENT COMMENT "音节ID",
mysql`letter` varchar(50) NOT NULL COMMENT "音节对应的字母组合",
mysql`content` varchar(50) NOT NULL COMMENT "音节内容",
mysql`sound_path` varchar(500) NULL COMMENT "音节发音音频路径",
mysql`phonetic` varchar(50) NULL COMMENT "音节音标",
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "sys_cache" table
CREATE TABLE `sys_cache` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`key` varchar(80) NOT NULL,
mysql`value` varchar(512) NOT NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "sys_dict_data" table
CREATE TABLE `sys_dict_data` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`dict_type` varchar(80) NOT NULL,
mysql`dict_label` varchar(80) NOT NULL,
mysql`dict_value` varchar(80) NOT NULL,
mysql`status` varchar(80) NOT NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "sys_dict_type" table
CREATE TABLE `sys_dict_type` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`dict_type` varchar(80) NOT NULL,
mysql`dict_name` varchar(80) NOT NULL,
mysql`status` varchar(80) NOT NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "sys_feedback" table
CREATE TABLE `sys_feedback` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`account_id` varchar(80) NOT NULL,
mysql`content` varchar(2500) NOT NULL,
mysql`contact` varchar(250) NOT NULL,
mysql`create_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "task_class_relations" table
CREATE TABLE `task_class_relations` (
mysql`id` bigint unsigned NOT NULL AUTO_INCREMENT,
mysql`created_at` datetime(3) NULL,
mysql`updated_at` datetime(3) NULL,
mysql`deleted_at` datetime(3) NULL,
mysql`task_id` bigint unsigned NOT NULL COMMENT "任务ID",
mysql`class_id` varchar(80) NOT NULL COMMENT "班级ID",
mysql PRIMARY KEY (`id`),
mysql INDEX `idx_task_class_relations_class_id` (`class_id`),
mysql INDEX `idx_task_class_relations_deleted_at` (`deleted_at`),
mysql INDEX `idx_task_class_relations_task_id` (`task_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "words" table
CREATE TABLE `words` (
mysql`id` int NOT NULL AUTO_INCREMENT COMMENT "主键ID",
mysql`word_id` int NOT NULL COMMENT "单词唯一标识ID",
mysql`lesson_id` int NOT NULL COMMENT "所属课时ID",
mysql`book_id` varchar(50) NOT NULL COMMENT "所属书籍ID",
mysql`word` varchar(100) NULL COMMENT "单词内容",
mysql`chinese` varchar(200) NULL COMMENT "单词的中文释义",
mysql`phonetic` varchar(100) NULL COMMENT "单词的音标",
mysql`uk_phonetic` varchar(100) NULL COMMENT "英式音标",
mysql`us_phonetic` varchar(100) NULL COMMENT "美式音标",
mysql`sound_path` varchar(500) NULL COMMENT "单词音频文件路径",
mysql`uk_sound_path` varchar(500) NULL COMMENT "英式发音音频路径",
mysql`us_sound_path` varchar(500) NULL COMMENT "美式发音音频路径",
mysql`image_path` varchar(500) NULL COMMENT "单词图片文件路径",
mysql`has_base` bool NULL COMMENT "是否包含基础词信息",
mysql`paraphrase` text NULL COMMENT "单词的详细释义",
mysql`phonics` text NULL COMMENT "单词的自然拼读信息",
mysql`word_tense` text NULL COMMENT "单词的不同词态（如单数、复数、过去式等）",
mysql`example_sentence` text NULL COMMENT "包含该单词的例句",
mysql`phrase` text NULL COMMENT "包含该单词的常见词组",
mysql`synonym` text NULL COMMENT "单词的近义词",
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "task_target" table
CREATE TABLE `task_target` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`info_cn` varchar(200) NOT NULL,
mysql`info_en` varchar(200) NULL,
mysql`lesson_id` varchar(500) NOT NULL,
mysql`info_en_audio` varchar(500) NULL,
mysql`match_type` int NOT NULL,
mysql`status` int NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "task_templates" table
CREATE TABLE `task_templates` (
mysql`id` bigint unsigned NOT NULL AUTO_INCREMENT,
mysql`created_at` datetime(3) NULL,
mysql`updated_at` datetime(3) NULL,
mysql`deleted_at` datetime(3) NULL,
mysql`name` varchar(200) NOT NULL COMMENT "模板名称",
mysql`description` text NULL COMMENT "模板描述",
mysql`task_type` varchar(50) NOT NULL COMMENT "任务类型",
mysql`subject` varchar(50) NOT NULL COMMENT "所属学科",
mysql`content_structure` json NOT NULL COMMENT "内容结构",
mysql`default_settings` json NULL COMMENT "默认设置",
mysql`created_by` varchar(80) NOT NULL COMMENT "创建者ID",
mysql`is_public` bool NULL DEFAULT 0 COMMENT "是否公开",
mysql PRIMARY KEY (`id`),
mysql INDEX `idx_task_templates_deleted_at` (`deleted_at`),
mysql INDEX `idx_task_templates_subject` (`subject`),
mysql INDEX `idx_task_templates_task_type` (`task_type`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "tasks" table
CREATE TABLE `tasks` (
mysql`id` bigint unsigned NOT NULL AUTO_INCREMENT,
mysql`created_at` datetime(3) NULL,
mysql`updated_at` datetime(3) NULL,
mysql`deleted_at` datetime(3) NULL,
mysql`teacher_id` varchar(80) NOT NULL COMMENT "教师ID",
mysql`title` varchar(200) NOT NULL COMMENT "任务标题",
mysql`description` text NULL COMMENT "任务描述",
mysql`task_type` varchar(50) NOT NULL COMMENT "任务类型",
mysql`subject` varchar(50) NOT NULL COMMENT "所属学科",
mysql`deadline` datetime(3) NULL COMMENT "截止时间",
mysql`status` varchar(20) NULL DEFAULT "draft" COMMENT "任务状态",
mysql`allow_late_submission` bool NULL DEFAULT 0 COMMENT "允许迟交",
mysql`max_attempts` bigint NULL COMMENT "最大尝试次数",
mysql`grading_criteria` text NULL COMMENT "评分标准",
mysql`total_points` bigint NULL DEFAULT 100 COMMENT "总分",
mysql`attachments` json NULL COMMENT "附件信息",
mysql`textbook_id` bigint unsigned NULL COMMENT "关联教材ID",
mysql`lesson_id` bigint unsigned NULL COMMENT "关联教学单元ID",
mysql PRIMARY KEY (`id`),
mysql INDEX `idx_tasks_deleted_at` (`deleted_at`),
mysql INDEX `idx_tasks_lesson_id` (`lesson_id`),
mysql INDEX `idx_tasks_status` (`status`),
mysql INDEX `idx_tasks_subject` (`subject`),
mysql INDEX `idx_tasks_task_type` (`task_type`),
mysql INDEX `idx_tasks_teacher_id` (`teacher_id`),
mysql INDEX `idx_tasks_textbook_id` (`textbook_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci AUTO_INCREMENT 3;
-- Create "textbook" table
CREATE TABLE `textbook` (
mysql`id` varchar(80) NOT NULL,
mysql`name` varchar(200) NOT NULL,
mysql`subject_id` int NOT NULL,
mysql`version_type` varchar(50) NOT NULL,
mysql`publisher` varchar(50) NOT NULL,
mysql`grade` varchar(50) NOT NULL,
mysql`term` varchar(50) NOT NULL,
mysql`icon_url` varchar(500) NULL,
mysql`ext_id` varchar(200) NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "textbook_chapter" table
CREATE TABLE `textbook_chapter` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`title` varchar(200) NOT NULL,
mysql`book_id` varchar(100) NOT NULL,
mysql`parent_id` int NULL,
mysql`page_id` int NULL,
mysql`page_no` int NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "textbook_page" table
CREATE TABLE `textbook_page` (
mysql`id` varchar(80) NOT NULL,
mysql`book_id` varchar(80) NOT NULL,
mysql`page_name` varchar(200) NOT NULL,
mysql`page_no` int NOT NULL,
mysql`page_no_v2` varchar(50) NULL,
mysql`page_url` varchar(500) NULL,
mysql`page_url_source` varchar(500) NULL,
mysql`version` varchar(50) NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "textbook_sentences" table
CREATE TABLE `textbook_sentences` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`book_id` varchar(80) NOT NULL,
mysql`page_no` int NOT NULL,
mysql`sentence` text NOT NULL,
mysql`is_recite` int NULL,
mysql`is_ai_dub` bool NULL,
mysql`track_continue_play_id` varchar(80) NULL,
mysql`track_url_source` varchar(500) NULL,
mysql`track_right` float NULL,
mysql`track_top` float NULL,
mysql`track_left` float NULL,
mysql`track_url` varchar(500) NULL,
mysql`track_id` int NULL,
mysql`is_evaluation` int NULL,
mysql`track_name` varchar(200) NULL,
mysql`track_genre` text NULL,
mysql`track_duration` float NULL,
mysql`track_index` int NOT NULL,
mysql`track_text` text NULL,
mysql`track_evaluation` text NULL,
mysql`track_bottom` float NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "timestamps" table
CREATE TABLE `timestamps` (
mysql`created_at` datetime(3) NULL COMMENT "创建时间",
mysql`updated_at` datetime(3) NULL COMMENT "更新时间"
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "topic" table
CREATE TABLE `topic` (
mysql`id` varchar(80) NOT NULL,
mysql`group_id` varchar(80) NOT NULL,
mysql`language` varchar(80) NOT NULL,
mysql`name` varchar(80) NOT NULL,
mysql`level` int NOT NULL,
mysql`role_short_name` varchar(80) NOT NULL,
mysql`speech_rate` varchar(80) NOT NULL,
mysql`topic_bot_name` varchar(580) NOT NULL,
mysql`topic_user_name` varchar(580) NOT NULL,
mysql`prompt` varchar(2500) NOT NULL,
mysql`description` varchar(580) NOT NULL,
mysql`status` varchar(80) NOT NULL,
mysql`sequence` int NOT NULL,
mysql`image_url` varchar(500) NULL,
mysql`created_by` varchar(80) NOT NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "topic_group" table
CREATE TABLE `topic_group` (
mysql`id` varchar(80) NOT NULL,
mysql`type` varchar(80) NOT NULL,
mysql`name` varchar(80) NOT NULL,
mysql`description` varchar(80) NOT NULL,
mysql`status` varchar(80) NOT NULL,
mysql`sequence` int NOT NULL,
mysql`created_by` varchar(80) NOT NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "topic_history" table
CREATE TABLE `topic_history` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`account_id` varchar(80) NOT NULL,
mysql`topic_id` varchar(80) NOT NULL,
mysql`topic_type` varchar(80) NOT NULL,
mysql`topic_name` varchar(80) NOT NULL,
mysql`main_target_count` int NOT NULL,
mysql`trial_target_count` int NOT NULL,
mysql`main_target_completed_count` int NOT NULL,
mysql`trial_target_completed_count` int NOT NULL,
mysql`completion` int NOT NULL,
mysql`audio_score` int NULL,
mysql`content_score` int NULL,
mysql`suggestion` varchar(2080) NULL,
mysql`word_count` int NULL,
mysql`session_id` varchar(80) NOT NULL,
mysql`completed` varchar(80) NOT NULL,
mysql`status` varchar(80) NOT NULL,
mysql`create_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "topic_phrase" table
CREATE TABLE `topic_phrase` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`topic_id` varchar(80) NOT NULL,
mysql`phrase` varchar(500) NOT NULL,
mysql`phrase_translation` varchar(500) NULL,
mysql`type` varchar(80) NOT NULL,
mysql`status` varchar(80) NOT NULL,
mysql`sequence` int NOT NULL,
mysql`created_by` varchar(80) NOT NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "topic_session_relation" table
CREATE TABLE `topic_session_relation` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`topic_id` varchar(80) NOT NULL,
mysql`session_id` varchar(80) NOT NULL,
mysql`account_id` varchar(80) NOT NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "topic_target" table
CREATE TABLE `topic_target` (
mysql`id` int NOT NULL AUTO_INCREMENT,
mysql`topic_id` varchar(80) NOT NULL,
mysql`type` varchar(80) NOT NULL,
mysql`description` varchar(500) NOT NULL,
mysql`description_translation` varchar(500) NULL,
mysql`status` varchar(80) NOT NULL,
mysql`sequence` int NOT NULL,
mysql`created_by` varchar(80) NOT NULL,
mysql`create_time` datetime NULL,
mysql`update_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "word_syllables" table
CREATE TABLE `word_syllables` (
mysql`id` int NOT NULL AUTO_INCREMENT COMMENT "主键ID",
mysql`word_id` int NOT NULL COMMENT "单词ID",
mysql`syllable_id` int NOT NULL COMMENT "音节ID",
mysql`position` int NOT NULL COMMENT "音节在单词中的位置",
mysql`create_time` datetime NULL,
mysql PRIMARY KEY (`id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "task_contents" table
CREATE TABLE `task_contents` (
mysql`id` bigint unsigned NOT NULL AUTO_INCREMENT,
mysql`created_at` datetime(3) NULL,
mysql`updated_at` datetime(3) NULL,
mysql`deleted_at` datetime(3) NULL,
mysql`task_id` bigint unsigned NULL COMMENT "所属任务ID",
mysql`content_type` varchar(50) NOT NULL COMMENT "内容类型",
mysql`content_id` bigint unsigned NULL COMMENT "关联内容ID",
mysql`custom_content` text NULL COMMENT "自定义内容",
mysql`points` bigint NULL COMMENT "分值",
mysql`difficulty` varchar(20) NULL COMMENT "难度级别",
mysql`metadata` json NULL COMMENT "元数据",
mysql`order_num` bigint NULL COMMENT "排序号",
mysql PRIMARY KEY (`id`),
mysql INDEX `idx_task_contents_deleted_at` (`deleted_at`),
mysql INDEX `idx_task_contents_task_id` (`task_id`),
mysql CONSTRAINT `fk_tasks_task_contents` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci AUTO_INCREMENT 3;
