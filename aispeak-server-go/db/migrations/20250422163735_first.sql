-- Modify "word_syllables" table
ALTER TABLE `word_syllables` DROP INDEX `idx_word_syllable`, DROP INDEX `ix_word_syllables_id`, DROP INDEX `ix_word_syllables_syllable_id`, DROP INDEX `ix_word_syllables_word_id`;
-- Modify "words" table
ALTER TABLE `words` DROP INDEX `ix_words_id`;
-- Modify "study_completion_records" table
ALTER TABLE `study_completion_records` DROP INDEX `idx_user_book_date`, DROP INDEX `idx_user_date`;
-- Modify "study_progress_reports" table
ALTER TABLE `study_progress_reports` DROP INDEX `idx_user_book_date`;
-- Modify "study_word_progress" table
ALTER TABLE `study_word_progress` DROP INDEX `idx_user_word`;
-- Modify "syllables" table
ALTER TABLE `syllables` DROP INDEX `content`, DROP INDEX `ix_syllables_id`;
-- Modify "topic" table
ALTER TABLE `topic` DROP INDEX `created_by_index`, DROP INDEX `group_id_index`;
-- Modify "topic_phrase" table
ALTER TABLE `topic_phrase` DROP INDEX `topic_id_index`;
-- Modify "topic_session_relation" table
ALTER TABLE `topic_session_relation` DROP INDEX `session_id_index`, DROP INDEX `topic_id_index`;
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
-- Modify "account" table
ALTER TABLE `account` DROP INDEX `openid`, DROP INDEX `phone_number`;
-- Modify "topic_target" table
ALTER TABLE `topic_target` DROP INDEX `uq_target_topic_type_seq`;
-- Create "classes" table
CREATE TABLE `classes` (
  `id` varchar(80) NOT NULL COMMENT "班级ID",
  `name` varchar(200) NOT NULL COMMENT "班级名称",
  `grade_level` varchar(50) NOT NULL COMMENT "年级",
  `subject` varchar(50) NULL COMMENT "主教学科",
  `school_id` varchar(80) NULL COMMENT "学校ID",
  `teacher_id` varchar(80) NOT NULL COMMENT "班主任ID",
  `status` varchar(20) NULL DEFAULT "active" COMMENT "状态",
  `description` text NULL COMMENT "班级描述",
  `created_at` datetime(3) NULL,
  `updated_at` datetime(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_classes_grade_level` (`grade_level`),
  INDEX `idx_classes_school_id` (`school_id`),
  INDEX `idx_classes_status` (`status`),
  INDEX `idx_classes_subject` (`subject`),
  INDEX `idx_classes_teacher_id` (`teacher_id`)
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
-- Create "submissions" table
CREATE TABLE `submissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NULL,
  `updated_at` datetime(3) NULL,
  `deleted_at` datetime(3) NULL,
  `student_task_id` bigint unsigned NOT NULL COMMENT "学生任务ID",
  `content_id` bigint unsigned NOT NULL COMMENT "内容ID",
  `response` text NULL COMMENT "回答内容",
  `audio_url` varchar(500) NULL COMMENT "音频URL",
  `image_url` varchar(500) NULL COMMENT "图片URL",
  `file_url` varchar(500) NULL COMMENT "文件URL",
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
-- Create "task_class_relations" table
CREATE TABLE `task_class_relations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NULL,
  `updated_at` datetime(3) NULL,
  `deleted_at` datetime(3) NULL,
  `task_id` bigint unsigned NOT NULL COMMENT "任务ID",
  `class_id` varchar(80) NOT NULL COMMENT "班级ID",
  PRIMARY KEY (`id`),
  INDEX `idx_task_class_relations_class_id` (`class_id`),
  INDEX `idx_task_class_relations_deleted_at` (`deleted_at`),
  INDEX `idx_task_class_relations_task_id` (`task_id`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "timestamps" table
CREATE TABLE `timestamps` (
  `created_at` datetime(3) NULL COMMENT "创建时间",
  `updated_at` datetime(3) NULL COMMENT "更新时间"
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
-- Create "task_templates" table
CREATE TABLE `task_templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NULL,
  `updated_at` datetime(3) NULL,
  `deleted_at` datetime(3) NULL,
  `name` varchar(200) NOT NULL COMMENT "模板名称",
  `description` text NULL COMMENT "模板描述",
  `task_type` varchar(50) NOT NULL COMMENT "任务类型",
  `subject` varchar(50) NOT NULL COMMENT "所属学科",
  `content_structure` json NOT NULL COMMENT "内容结构",
  `default_settings` json NULL COMMENT "默认设置",
  `created_by` varchar(80) NOT NULL COMMENT "创建者ID",
  `is_public` bool NULL DEFAULT 0 COMMENT "是否公开",
  PRIMARY KEY (`id`),
  INDEX `idx_task_templates_deleted_at` (`deleted_at`),
  INDEX `idx_task_templates_subject` (`subject`),
  INDEX `idx_task_templates_task_type` (`task_type`)
) CHARSET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- Create "tasks" table
CREATE TABLE `tasks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NULL,
  `updated_at` datetime(3) NULL,
  `deleted_at` datetime(3) NULL,
  `teacher_id` varchar(80) NOT NULL COMMENT "教师ID",
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
  INDEX `idx_tasks_deleted_at` (`deleted_at`),
  INDEX `idx_tasks_lesson_id` (`lesson_id`),
  INDEX `idx_tasks_status` (`status`),
  INDEX `idx_tasks_subject` (`subject`),
  INDEX `idx_tasks_task_type` (`task_type`),
  INDEX `idx_tasks_teacher_id` (`teacher_id`),
  INDEX `idx_tasks_textbook_id` (`textbook_id`)
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
  `ref_book_id` varchar(51) NULL COMMENT "关联教材ID",
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
-- Drop "atlas_schema_revisions" table
DROP TABLE `atlas_schema_revisions`;
