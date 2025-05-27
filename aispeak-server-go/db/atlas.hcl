data"external_schema" "gorm" {
  program = [
    "/Users/fpz/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.23.9.darwin-arm64/bin/go", "run", "-mod=mod",
    "ariga.io/atlas-provider-gorm",
    "load",
    "--path", "../models",# GORM 模型目录
    "--dialect", "mysql"# 或 postgres, sqlite, sqlserver
  ]
}

env "gorm" {
  src = data.external_schema.gorm.url
  dev = "mysql://chatgpt:chatgpt_plus@localhost:3306/fluent_ai_dev"# Atlantis 内部使用的开发数据库环境
migration {
    dir = "file://migrations"# 存放生成迁移文件的目录
  }
format {
migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}
