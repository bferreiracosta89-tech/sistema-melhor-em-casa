import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

# Pega a URL do banco de dados do .env. 
# Se não encontrar, usa o SQLite local como padrão de segurança.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./banco_melhor_em_casa.db")

# Configuração do motor do banco de dados
# O argumento 'check_same_thread' é necessário apenas para o SQLite funcionar bem com o FastAPI
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Para PostgreSQL em produção (Render/Railway), usamos a conexão padrão
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Cria a fábrica de sessões (como se fosse a "porta de entrada" para fazer consultas)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Classe base que o SQLAlchemy usará para criar as tabelas no arquivo models.py
Base = declarative_base()

# Função utilitária para abrir e fechar a conexão a cada requisição da API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()