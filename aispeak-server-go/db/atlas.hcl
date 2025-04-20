# 定义数据源：从 Go 代码中的 GORM 模型获取模式
data "external_schema" "gorm" {
  # 使用 Go 代码扫描器
  program = [
    "go",
    "run",
    "-mod=mod",
    "ariga.io/atlas-provider-gorm",  # 官方提供的 GORM 集成工具
    "load",
    "--path=../models/...",               # 你的 GORM 模型目录
    "--dialect=mysql"                # 指定数据库类型
  ]
}

env "prod" {
  url = "mysql://chatgpt:chatgpt_plus@114.116.224.128:3306/fluent_ai" 
  #开发数据库（用于计算迁移步骤）
  dev_url = "mysql://chatgpt:chatgpt_plus@localhost:3306/fluent_ai_dev"
  migration {
    dir = "file://migrations"
  }
}


# 开发环境配置
env "dev" {
  # 数据源 = GORM 模型扫描结果
  src = data.external_schema.gorm.url
  url = "mysql://chatgpt:chatgpt_plus@localhost:3306/fluent_ai"  # 独立开发库
  dev_url = "mysql://chatgpt:chatgpt_plus@localhost:3306/fluent_ai_dev"  # 临时计算库
  
  migration {
    dir = "file://migrations"
  }
  
  # 排除测试文件（可选）
  exclude = ["*_test.go", "test/*"]
}