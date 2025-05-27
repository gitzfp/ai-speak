-- Modify "tasks" table: change class_id from NULL to NOT NULL
-- 第一步：检查现有数据中是否有 class_id 为 NULL 的记录
-- 如果有，需要先处理这些记录

-- 为 class_id 为 NULL 的记录设置默认值
UPDATE `tasks` 
SET `class_id` = 'UNKNOWN_CLASS' 
WHERE `class_id` IS NULL OR `class_id` = '';

-- 修改 class_id 字段为 NOT NULL
ALTER TABLE `tasks` 
MODIFY COLUMN `class_id` varchar(80) NOT NULL COMMENT '班级ID';
