# Atlas 数据库迁移自动化控制文件
.PHONY: help migrate-diff migrate-up migrate-down validate lint baseline schema-export clean init-env test-env gen

# 环境变量配置
MIGRATION_DIR := "file://migrations"
ENV_DEV := "dev"
ENV_PROD := "prod"
MODEL_DIR := "./models"
DEV_DB_URL := "mysql://chatgpt:chatgpt_plus@localhost:3306/fluent_ai"
PROD_DB_URL := "mysql://chatgpt:$$chatgpt_plus@prod-db:3306/fluent_ai" # 生产密码通过环境变量注入
ENABLE_DEV_BASELINE := true  # 设置为true以启用开发环境基线

help: ## 显示帮助信息
	@echo "数据库迁移管理命令集："
	@echo "make migrate-diff name=<迁移名称>  # 生成新的迁移文件"
	@echo "make migrate-up env=dev           # 应用开发环境迁移"
	@echo "make migrate-down env=dev steps=1 # 回滚开发环境迁移"
	@echo "make validate                     # 验证迁移文件完整性"
	@echo "make baseline version=v1.0.0      # 设置生产基线版本"
	@echo "make schema-export                # 导出当前Schema快照"
	@echo "make clean                        # 清理迁移缓存文件"

init-env: ## 初始化开发环境
	sudo go install ariga.io/atlas/cmd/atlas@latest
	sudo go install ariga.io/atlas-provider-gorm@latest
	sudo go get ariga.io/atlas-provider-gorm@latest
	@echo "正在安装依赖工具..."
	@test -f db/atlas.hcl || cp templates/atlas.hcl db/
	@mkdir -p db/migrations db/schema

migrate-diff: ## 生成迁移差异文件（需指定name）
	@test -n "$(name)" || (echo "Error: 必须指定迁移名称 (name=...)"; exit 1)
	cd db && atlas migrate diff $(name) \
		--dir $(MIGRATION_DIR) \
		--env $(ENV_DEV) \
		--dev-url $(DEV_DB_URL) 

migrate-up: ## 应用迁移（默认env=dev）
	cd db && atlas migrate apply \
		--dir $(MIGRATION_DIR) \
		--url $(if $(filter $(env),prod), $(PROD_DB_URL), $(DEV_DB_URL)) \
		--env $(if $(env),$(env),$(ENV_DEV))

migrate-down: ## 回滚迁移（默认回滚1步）
	cd db && atlas migrate apply \
		--dir $(MIGRATION_DIR) \
		--url $(if $(filter $(env),prod), $(PROD_DB_URL), $(DEV_DB_URL)) \
		--env $(if $(env),$(env),$(ENV_DEV)) \
		--baseline $(version) \
		-- $(if $(steps),$(steps),1)

validate: ## 验证迁移文件
	cd db && atlas migrate validate \
		--dir $(MIGRATION_DIR) \
		--dev-url "docker://mysql/8/dev" \
		--env $(ENV_DEV)

lint: ## 执行迁移文件静态检查
	cd db && atlas migrate lint \
		--dir $(MIGRATION_DIR) \
		--dev-url "docker://mysql/8/dev" \
		--latest 1

# 多环境基线管理模块
.PHONY: baseline

# 生产环境基线（严格模式）
baseline-prod: validate-prod-schema
	@echo "正在设置生产基线（需二级审批）"
	@test -f .env.prod || (echo "缺少生产环境凭证"; exit 1)
	cd db && atlas migrate baseline \
		--env prod \
		--baseline "v$(PROJECT_VERSION)" \
		--dir $(MIGRATION_DIR) \
		--url "$$(awk -F= '/PROD_DB_URL/ {print $$2}' .env.prod)"

baseline-init:
	@echo "正在创建初始基线迁移..."
	@mkdir -p db/migrations
	cd db && atlas schema inspect \
		--url $(DEV_DB_URL) \
		--format '{{ sql . "mysql" }}' > migrations/$(shell date +%Y%m%d%H%M%S)_baseline.sql
	cd db && atlas migrate hash \
		--dir $(MIGRATION_DIR)

# 开发环境基线（可选）
baseline-dev:
	@echo "正在为开发环境设置基线..."
	cd db && atlas migrate hash \
		--dir $(MIGRATION_DIR)
	cd db && atlas migrate apply \
		--env $(ENV_DEV) \
		--dir $(MIGRATION_DIR) \
		--url $(DEV_DB_URL)

baseline-allow-dirty:
	@echo "正在为开发环境设置基线..."
	cd db && atlas migrate hash \
		--dir $(MIGRATION_DIR)
	cd db && atlas migrate apply \
		--env $(ENV_DEV) \
		--dir $(MIGRATION_DIR) \
		--url $(DEV_DB_URL) \
		--allow-dirty

# 开发环境基线（可选）- 使用基线版本
baseline-with-version:
	@echo "正在为开发环境设置基线版本..."
	cd db && atlas schema apply \
		--url $(DEV_DB_URL) \
		--to file://migrations?version=$(shell ls -1 db/migrations/*.sql | sort | tail -1 | xargs basename | cut -d_ -f1) \
		--dev-url $(DEV_DB_URL)

# 从现有数据库创建迁移
existing-db:
	@echo "从现有数据库创建迁移..."
	@mkdir -p db/migrations
	cd db && atlas schema inspect \
		--url $(DEV_DB_URL) \
		--format '{{ sql . }}' > migrations/$(shell date +%Y%m%d%H%M%S)_init.sql
	cd db && atlas migrate hash \
		--dir $(MIGRATION_DIR)

# 从现有数据库创建迁移并设置基线
setup-existing-db:
	@echo "从现有数据库创建迁移并设置基线..."
	@mkdir -p db/migrations
	cd db && atlas schema inspect \
		--url $(DEV_DB_URL) \
		--format '{{ sql . }}' > migrations/$(shell date +%Y%m%d%H%M%S)_init.sql
	cd db && atlas migrate hash \
		--dir $(MIGRATION_DIR)
	@echo "正在设置基线..."
	@VERSION=$$(date +%Y%m%d%H%M%S); \
	echo "-- 创建Atlas版本表" > db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "CREATE TABLE IF NOT EXISTS atlas_schema_revisions (" >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    version varchar(255) NOT NULL," >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    description varchar(255) NOT NULL," >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    type bigint unsigned NOT NULL DEFAULT 2," >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    applied bigint NOT NULL DEFAULT 0," >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    total bigint NOT NULL DEFAULT 0," >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    executed_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP," >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    execution_time bigint NOT NULL DEFAULT 0," >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    error longtext NULL," >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    error_stmt longtext NULL," >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    hash varchar(255) NOT NULL," >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    partial_hashes json NULL," >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    operator_version varchar(255) NOT NULL," >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "    PRIMARY KEY (version)" >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo ") CHARSET utf8mb4 COLLATE utf8mb4_bin;" >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "" >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	echo "-- 标记所有现有迁移为已应用" >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	for file in $$(ls -1 db/migrations/*.sql | grep -v create_atlas_version.sql); do \
		version=$$(basename $$file | cut -d_ -f1); \
		echo "INSERT INTO atlas_schema_revisions (version, description, type, applied, total, executed_at, execution_time, hash, operator_version) VALUES ('$$version', 'existing', 2, 1, 1, NOW(), 0, 'manual-baseline', 'atlas-cli');" >> db/migrations/$${VERSION}_create_atlas_version.sql; \
	done; \
	cd db && mysql -u chatgpt -pchatgpt_plus -h localhost fluent_ai < migrations/$${VERSION}_create_atlas_version.sql
	cd db && atlas migrate hash \
		--dir $(MIGRATION_DIR)
	@echo "基线设置完成，所有迁移已标记为已应用"

schema-export: ## 导出当前数据库Schema
	cd db && atlas schema inspect \
		--url $(DEV_DB_URL) \
		--format '{{ sql . }}' > schema/$(shell date +%Y%m%d)_schema.sql

clean: ## 清理临时文件
	rm -rf db/migrations/*.tmp
	rm -f db/schema/*.bak
	go clean -modcache

test-env: ## 启动测试数据库容器
	docker run --rm -d -p 3307:3306 \
		-e MYSQL_ROOT_PASSWORD=test \
		-e MYSQL_DATABASE=test_db \
		--name atlas-testdb mysql:8.0

gen: ## 自动生成模型代码
	go generate ./...
