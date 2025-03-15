from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError , DisconnectionError 
from app . config import Config 
import time 


def checkout_listener(dbapi_con, con_record, con_proxy):
    try:
        try:
            dbapi_con.ping(False)
        except TypeError:
            dbapi_con.ping()
    except dbapi_con.OperationalError as exc:
        if exc.args[0] in (2006, 2013, 2014, 2045, 2055):
            raise DisconnectionError()
        else:
            raise
        
def get_engine_with_retry(retries=10, delay=5):
    """带重试机制的引擎创建函数"""
    for i in range(retries):
        try:
            engine = create_engine(
                Config.SQLALCHEMY_DATABASE_URL, 
                echo=Config.SQL_ECHO,
                pool_pre_ping=True
            )
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                return engine
        except (OperationalError, DisconnectionError) as e:
            if i == retries - 1:
                raise RuntimeError(f"数据库连接失败: {str(e)}")
            time.sleep(delay)
    
    raise RuntimeError("数据库连接超时")

# 创建数据库连接, SQLALCHEMY_DATABASE_URL不能为空
if not Config.SQLALCHEMY_DATABASE_URL:
    raise Exception('SQLALCHEMY_DATABASE_URL不能为空')
engine = get_engine_with_retry()
event.listen(engine, 'checkout', checkout_listener)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()


# 数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

