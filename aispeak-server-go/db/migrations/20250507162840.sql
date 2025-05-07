-- Modify "submissions" table
ALTER TABLE `submissions` DROP COLUMN `audio_url`, DROP COLUMN `image_url`, DROP COLUMN `file_url`, ADD COLUMN `media_files` json NULL COMMENT "统一媒体文件";
