from sqlalchemy import Column, Integer, String
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False) # <--- Adicionamos o nome aqui
    email = Column(String, unique=True, index=True)
    senha_hash = Column(String)
    perfil = Column(String, default="usuario") # <--- ADICIONE ESTA LINHA

class IndicadorMensal(Base):
    __tablename__ = "indicadores_mensais"

    id = Column(Integer, primary_key=True, index=True)
    mes = Column(String, unique=True, index=True) # Ex: "Janeiro", "Fevereiro"

    # Dados que o Pandas vai extrair da planilha
    admissoes = Column(Integer, default=0)
    altas_clinicas = Column(Integer, default=0)
    obitos = Column(Integer, default=0)
    feridas_ativas = Column(Integer, default=0)
    pacientes_vm = Column(Integer, default=0)
    pacientes_tqt = Column(Integer, default=0)
    pacientes_gtt = Column(Integer, default=0)
    pacientes_sne = Column(Integer, default=0)
    cuidados_paliativos = Column(Integer, default=0)
    uso_atb = Column(Integer, default=0)
    pacientes_ativos = Column(Integer, default=0)
    # Complexidade
    ad1 = Column(Integer, default=0)
    ad2 = Column(Integer, default=0)
    ad3 = Column(Integer, default=0)

    # Outros indicadores
    pacientes_com_feridas = Column(Integer, default=0)
    pacientes_em_antibioticoterapia = Column(Integer, default=0)
    pacientes_em_oxigenioterapia = Column(Integer, default=0)