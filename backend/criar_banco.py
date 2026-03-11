from database import engine, Base, SessionLocal
import models
from passlib.context import CryptContext

# Configuração de criptografia de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

print("Iniciando a criação do banco de dados...")

# 1. Cria as tabelas físicas no arquivo SQLite
Base.metadata.create_all(bind=engine)
print("Tabelas criadas com sucesso.")

# 2. Abre a sessão para inserir o usuário
db = SessionLocal()
usuario_existente = db.query(models.Usuario).filter(models.Usuario.email == "bruno.costa@uai.spdm.org.br").first()

if not usuario_existente:
    # Criptografa a senha "Beni2025@" antes de salvar
    senha_criptografada = pwd_context.hash("Beni2025@")

    novo_usuario = models.Usuario(
        email="bruno.costa@uai.spdm.org.br",
        senha_hash=senha_criptografada,
        nome="Bruno Ferreira",
        perfil = "admin"
    )
    db.add(novo_usuario)
    db.commit()
    print("✅ Usuário 'bruno.costa@uai.spdm.org.br' (senha: Beni2025@) criado com sucesso!")
else:
    print("⚠️ O usuário admin já existe no banco de dados.")

db.close()
print("Banco de dados pronto para uso!")