-- 使用现有的字典表存储系统设置
-- 插入字典类型
INSERT INTO sys_dict_type (dict_type, dict_name, status) VALUES
('system_features', '系统功能开关', '1')
ON CONFLICT DO NOTHING;

-- 插入默认功能设置
INSERT INTO sys_dict_data (dict_type, dict_label, dict_value, status) VALUES
('system_features', 'showTextbookModule', 'false', '1'),
('system_features', 'enableManualInput', 'true', '1')
ON CONFLICT DO NOTHING;