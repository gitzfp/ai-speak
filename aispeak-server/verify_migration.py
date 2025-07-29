#!/usr/bin/env python3
"""
验证迁移后的数据库状态
"""
import sys
from sqlalchemy import create_engine, text

# 连接到生产数据库
DATABASE_URL = 'mysql+pymysql://chatgpt:chatgpt_plus@114.116.224.128/fluent_ai'
engine = create_engine(DATABASE_URL)

def main():
    try:
        with engine.connect() as conn:
            # 检查数据库中的表
            result = conn.execute(text("SHOW TABLES"))
            tables = sorted([row[0] for row in result])
            
            print("数据库中的所有表:")
            for table in tables:
                print(f"  ✅ {table}")
            
            # 检查关键表是否存在
            print("\n检查关键任务相关表:")
            task_tables = ['classes', 'class_students', 'class_teachers', 'tasks', 'task_contents', 'submissions']
            
            for table in task_tables:
                exists = table in tables
                status = "✅ 存在" if exists else "❌ 不存在"
                print(f"  {table}: {status}")
            
            # 检查 alembic_version
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            version = list(result)
            
            if version:
                print(f"\n当前 Alembic 版本: {version[0][0]}")
            else:
                print("\n❌ alembic_version 表为空")
                
            print("\n✅ 数据库迁移验证完成！")
            
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()