import os
import google.generativeai as genai
from dotenv import load_dotenv
import io
import pandas as pd
from fastapi.responses import StreamingResponse
from openpyxl.styles import Font, PatternFill, Alignment

from datetime import datetime, timedelta
from pydantic import BaseModel
import json
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from passlib.context import CryptContext
from jose import JWTError, jwt


# ==========================================
# IMPORTANDO NOSSOS MÓDULOS LOCAIS
# ==========================================
from database import engine, get_db
import models

# ==========================================
# CONFIGURAÇÕES DE SEGURANÇA E IA
# ==========================================
SECRET_KEY = "chave_super_secreta_melhor_em_casa"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

CHAVE_GEMINI = os.getenv("GEMINI_API_KEY", "COLE_SUA_CHAVE_AQUI")
genai.configure(api_key=CHAVE_GEMINI)

# ==========================================
# INICIALIZAÇÃO DA API
# ==========================================
app = FastAPI(title="API Melhor em Casa - Arquitetura Modular")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Cria as tabelas no banco usando o models.py
    models.Base.metadata.create_all(bind=engine)

    # Cria um usuário admin padrão se não existir
    db = next(get_db())
    usuario_existe = db.query(models.Usuario).filter(models.Usuario.email == "bruno.costa@uai.spdm.org.br").first()
    if not usuario_existe:
        senha_criptografada = pwd_context.hash("Beni2025@")
        nome = "Bruno Ferreira"
        perfil = "admin"
        novo_admin = models.Usuario(email="bruno.costa@uai.spdm.org.br", senha_hash=senha_criptografada)
        db.add(novo_admin)
        db.commit()
    db.close()

# ==========================================
# FUNÇÕES DE AUTENTICAÇÃO
# ==========================================
def criar_token_acesso(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def obter_usuario_atual(token: str = Depends(oauth2_scheme)):
    try:
        # Tenta ler o token usando a nossa chave secreta
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado ou inválido. Faça login novamente.")

# ==========================================
# ROTAS DA API
# ==========================================

# --- ROTA DE LOGIN CORRIGIDA ---
class UsuarioLogin(BaseModel):
    email: str
    senha: str

@app.post("/api/usuarios/login")
def login(credenciais: UsuarioLogin, db: Session = Depends(get_db)):
    # 1. Busca o usuário no banco de dados (este é o objeto que tem o perfil!)
    usuario_db = db.query(models.Usuario).filter(models.Usuario.email == credenciais.email).first()

    if not usuario_db:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    if not pwd_context.verify(credenciais.senha, usuario_db.senha_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    # 2. Cria o token usando os dados do BANCO DE DADOS (usuario_db)
    access_token = criar_token_acesso(
        data={
            "sub": usuario_db.email, 
            "perfil": usuario_db.perfil,  # <--- Agora ele pega do banco!
            "nome": usuario_db.nome  # <--- ADICIONE ESTA LINHA AQUI!
        } 
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- 1. ATUALIZE O MOLDE (Adicionamos o nome aqui) ---
class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    perfil: str = "usuario" # <--- NOVO

# --- 2. ATUALIZE A ROTA DE CADASTRO ---
@app.post("/api/usuarios/cadastrar")
def cadastrar_usuario(novo_usuario: UsuarioCreate, usuario_logado: str = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    usuario_existente = db.query(models.Usuario).filter(models.Usuario.email == novo_usuario.email).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Este email já está cadastrado no sistema.")

    senha_criptografada = pwd_context.hash(novo_usuario.senha)

    # Agora salvamos usando o nome que veio da tela
    db_usuario = models.Usuario(
        nome=novo_usuario.nome, 
        email=novo_usuario.email, 
        senha_hash=senha_criptografada
    )
    db.add(db_usuario)
    db.commit()

    return {"mensagem": f"Usuário {novo_usuario.nome} cadastrado com sucesso!"}

# --- 3. ATUALIZE A ROTA DE LISTAR (Para a tabela mostrar o nome) ---
@app.get("/api/usuarios")
def listar_usuarios(usuario_logado: str = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    usuarios = db.query(models.Usuario).all()
    # Agora retornamos o perfil também para aparecer na tabela
    return [{"id": u.id, "nome": u.nome, "email": u.email, "perfil": u.perfil} for u in usuarios]

# --- ROTA PARA EXCLUIR USUÁRIO ---
@app.delete("/api/usuarios/{usuario_id}")
def deletar_usuario(usuario_id: int, usuario_logado: str = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Proteção: O usuário não pode excluir a si mesmo acidentalmente
    if usuario.email == usuario_logado:
        raise HTTPException(status_code=400, detail="Você não pode excluir o usuário que está logado no momento.")

    db.delete(usuario)
    db.commit()
    return {"mensagem": "Usuário removido com sucesso"}

# --- NOVOS MOLDES PARA EDIÇÃO E RESET ---
class UsuarioUpdate(BaseModel):
    nome: str
    email: str
    perfil: str # <--- NOVO

class UsuarioResetSenha(BaseModel):
    nova_senha: str

# --- ROTA PARA EDITAR NOME E EMAIL ---
@app.put("/api/usuarios/{usuario_id}")
def editar_usuario(usuario_id: int, dados: UsuarioUpdate, usuario_logado: str = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if dados.email != usuario.email:
        email_existente = db.query(models.Usuario).filter(models.Usuario.email == dados.email).first()
        if email_existente:
            raise HTTPException(status_code=400, detail="Este email já está em uso.")

    usuario.nome = dados.nome
    usuario.email = dados.email
    usuario.perfil = dados.perfil # <--- Adicione esta linha para salvar a edição do perfil
    db.commit()
    return {"mensagem": "Dados atualizados com sucesso!"}

# --- ROTA PARA RESETAR SENHA ---
@app.put("/api/usuarios/{usuario_id}/reset-senha")
def resetar_senha(usuario_id: int, dados: UsuarioResetSenha, usuario_logado: str = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    senha_criptografada = pwd_context.hash(dados.nova_senha)
    usuario.senha_hash = senha_criptografada
    db.commit()
    return {"mensagem": "Senha redefinida com sucesso!"}

@app.get("/api/dashboard/geral")
def obter_dados_dashboard(usuario_logado: str = Depends(obter_usuario_atual)):
    """Retorna os dados formatados para os gráficos do React"""
    return [
        {"mes": "Jan", "admissoes": 45, "altas_clinicas": 30, "obitos": 8, "tempo_resposta": 52, "reinternacao": 12, "vm": 12, "tqt": 18, "gtt": 25, "sne": 30, "ad1": 40, "ad2": 35, "ad3": 25},
        {"mes": "Fev", "admissoes": 50, "altas_clinicas": 35, "obitos": 6, "tempo_resposta": 48, "reinternacao": 10, "vm": 14, "tqt": 19, "gtt": 26, "sne": 28, "ad1": 38, "ad2": 36, "ad3": 26},
        {"mes": "Mar", "admissoes": 55, "altas_clinicas": 32, "obitos": 9, "tempo_resposta": 45, "reinternacao": 8, "vm": 15, "tqt": 20, "gtt": 28, "sne": 25, "ad1": 35, "ad2": 38, "ad3": 27},
        {"mes": "Abr", "admissoes": 48, "altas_clinicas": 40, "obitos": 5, "tempo_resposta": 40, "reinternacao": 7, "vm": 13, "tqt": 18, "gtt": 25, "sne": 22, "ad1": 42, "ad2": 33, "ad3": 25},
        {"mes": "Mai", "admissoes": 60, "altas_clinicas": 45, "obitos": 7, "tempo_resposta": 38, "reinternacao": 6, "vm": 16, "tqt": 22, "gtt": 30, "sne": 26, "ad1": 30, "ad2": 40, "ad3": 30}
    ]


import pandas as pd
import io
from fastapi import UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import models # Certifique-se de que models está importado no topo do arquivo

# Certifique-se de que esta linha está no topo do seu arquivo main.py:
from datetime import datetime

@app.post("/api/upload/planilha")
async def upload_planilha(usuario_logado: str = Depends(obter_usuario_atual), file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = await file.read()

        # Lê todas as abas do Excel de uma vez só
        todas_as_abas = pd.read_excel(io.BytesIO(contents), sheet_name=None, header=1)

        # Junta todas as abas em uma única tabela para facilitar a busca
        df = pd.concat(todas_as_abas.values(), ignore_index=True)

        # Lista completa de meses do ano
        todos_os_meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

        # LÓGICA DE TEMPO REAL: Descobre o mês atual e corta a lista
        mes_atual_numero = datetime.now().month
        meses_para_processar = todos_os_meses[:mes_atual_numero]

        # Limpa os dados antigos do banco para não duplicar
        db.query(models.IndicadorMensal).delete()

        # Função interna super robusta para caçar o número exato na planilha
        def buscar_valor(nome_indicador, mes_atual):
            try:
                # Procura a linha que contém o texto
                linha = df[df['Indicador'].str.contains(nome_indicador, na=False, case=False)]

                if not linha.empty:
                    valor = linha.iloc[0][mes_atual]

                    # Se for vazio (NaN) ou um traço do Excel, retorna 0
                    if pd.isna(valor) or str(valor).strip() == '-':
                        return 0

                    # Converte para número inteiro
                    return int(valor)

                print(f"⚠️ Aviso: Não achei a linha contendo '{nome_indicador}'")
                return 0

            except Exception as e:
                print(f"❌ Erro ao converter '{nome_indicador}' no mês {mes_atual}. Erro: {e}")
                return 0

        # Percorre APENAS os meses até o atual
        for mes in meses_para_processar:
            if mes in df.columns:
                novo_mes = models.IndicadorMensal(
                    mes=mes,

                    # Fluxo Geral
                    pacientes_ativos=buscar_valor("Número total de pacientes ativos no mês", mes),
                    admissoes=buscar_valor("Número de admissões por origem", mes),
                    altas_clinicas=buscar_valor("Número de altas clínicas", mes),
                    obitos=buscar_valor("Número de óbitos de pacientes em acompanhamento", mes),

                    # Complexidade
                    ad1=buscar_valor("Distribuição por grau de dependência AD1", mes),
                    ad2=buscar_valor("Distribuição por grau de dependência AD2", mes),
                    ad3=buscar_valor("Distribuição por grau de dependência AD3", mes),

                    # Dispositivos e Cuidados Especiais
                    feridas_ativas=buscar_valor("Numero de pacientes com Feridas", mes),
                    pacientes_vm=buscar_valor("Número de pacientes com dispositivo VM", mes),
                    pacientes_tqt=buscar_valor("Número de pacientes com TQT", mes),
                    pacientes_gtt=buscar_valor("Número de pacientes com GTT", mes),
                    pacientes_sne=buscar_valor("Número de pacientes com SNE", mes),
                    cuidados_paliativos=buscar_valor("Numero de Pacientes Paliativos", mes),
                    uso_atb=buscar_valor("Numero de pacientes com antibiotico", mes)
                )
                db.add(novo_mes)

        db.commit()
        return {"mensagem": "Planilha processada e salva com sucesso!"}

    except Exception as e:
        print(f"Erro detalhado no terminal: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar planilha: {str(e)}")

@app.get("/api/relatorios/gerar")
def gerar_relatorio(tipo: str = "geral",usuario_logado: str = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Chave da API do Gemini não encontrada")

    genai.configure(api_key=api_key)

    # Pega os últimos 3 meses para a IA focar na tendência recente
    dados = db.query(models.IndicadorMensal).order_by(models.IndicadorMensal.id.desc()).limit(3).all()
    if not dados:
        return {"relatorio_markdown": "⚠️ **Aviso:** O banco de dados está vazio."}

    # Transforma TODOS os dados ricos em texto
    texto_dados = "Dados Mensais do Programa Melhor em Casa (Últimos meses):\n"
    for d in dados:
        texto_dados += f"""
        Mês: {d.mes}
        - Fluxo: {d.admissoes} admissões, {d.altas_clinicas} altas, {d.obitos} óbitos, {d.pacientes_ativos} ativos.
        - Perfil Clínico: {d.feridas_ativas} com feridas, {d.uso_atb} em uso de ATB, {d.cuidados_paliativos} em paliação.
        - Dispositivos: {d.pacientes_vm} VM, {d.pacientes_tqt} TQT, {d.pacientes_gtt} GTT, {d.pacientes_sne} SNE.
        - Complexidade: AD1({d.ad1}), AD2({d.ad2}), AD3({d.ad3}).
        """
    

        # 1. Busca o nome real do usuário no banco de dados usando o email logado
    usuario_db = db.query(models.Usuario).filter(models.Usuario.email == usuario_logado).first()
    nome_assinatura = usuario_db.nome if usuario_db else "Equipe Melhor em Casa"

    # 2. Ajusta o foco da IA dependendo do botão clicado
    foco_ia = "um resumo executivo geral"
    if tipo == "clinico":
        foco_ia = "uma análise clínica profunda focada em risco de infecções (ATB), evolução de feridas e complexidade dos pacientes (AD2/AD3 e dispositivos)"
    elif tipo == "gerencial":
        foco_ia = "uma análise gerencial focada em giro de leitos (admissões vs altas), taxa de óbitos e volume de pacientes ativos"

    # 3. O Prompt atualizado com a regra número 5 (Assinatura)
    prompt = f"""
    Você é um supervisor de enfermagem do programa 'Melhor em Casa'.
    Analise os dados abaixo e escreva {foco_ia}.

    Regras:
    1. Identifique tendências de piora ou melhora.
    2. Faça correlações inteligentes (ex: se aumentou feridas e aumentou ATB, alerte sobre infecções).
    3. Dê 2 recomendações práticas para a equipe no final.
    4. Formate a resposta em Markdown, usando títulos (##), bullet points e negritos para destacar números.
    5. Obrigatoriamente, termine o relatório com uma assinatura formal e profissional usando exatamente este nome: {nome_assinatura}.

    DADOS:
    {texto_dados}
    """

    try:
        # Usando o nome oficial e atualizado do modelo
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        return {"relatorio_markdown": response.text}
    except Exception as e:
        # O print abaixo vai forçar o erro a aparecer no terminal se falhar de novo!
        print(f"ERRO REAL DO GEMINI: {e}") 
        raise HTTPException(status_code=500, detail=f"Erro na IA: {str(e)}")
    

@app.get("/api/indicadores")
def listar_indicadores(usuario_logado: str = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    # Busca todos os meses salvos no banco de dados
    indicadores = db.query(models.IndicadorMensal).all()
    return indicadores

# 2. Cria a rota que vai receber esses dados
@app.post("/api/indicadores/manual")
def salvar_digitacao_manual(dados: IndicadorManual, usuario_logado: str = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    indicador = db.query(models.IndicadorMensal).filter(models.IndicadorMensal.mes == dados.mes).first()

    if indicador:
        indicador.admissoes = dados.admissoes
        indicador.altas_clinicas = dados.altas_clinicas
        indicador.obitos = dados.obitos
        indicador.feridas_ativas = dados.feridas_ativas
        indicador.pacientes_vm = dados.pacientes_vm
        indicador.pacientes_tqt = dados.pacientes_tqt
        indicador.pacientes_gtt = dados.pacientes_gtt
        indicador.pacientes_sne = dados.pacientes_sne
        indicador.cuidados_paliativos = dados.cuidados_paliativos
        indicador.uso_atb = dados.uso_atb
        indicador.pacientes_ativos = dados.pacientes_ativos # <--- ADICIONE AQUI

        # ---> CORREÇÃO: Adicionado para ATUALIZAR os dados de complexidade
        indicador.ad1 = dados.ad1
        indicador.ad2 = dados.ad2
        indicador.ad3 = dados.ad3

        mensagem = f"Dados de {dados.mes} atualizados!"
    else:
        novo_indicador = models.IndicadorMensal(
            mes=dados.mes,
            admissoes=dados.admissoes,
            altas_clinicas=dados.altas_clinicas,
            obitos=dados.obitos,
            feridas_ativas=dados.feridas_ativas,
            pacientes_vm=dados.pacientes_vm,
            pacientes_tqt=dados.pacientes_tqt,
            pacientes_gtt=dados.pacientes_gtt,
            pacientes_sne=dados.pacientes_sne,
            cuidados_paliativos=dados.cuidados_paliativos,
            uso_atb=dados.uso_atb,
            pacientes_ativos=dados.pacientes_ativos, # <--- ADICIONE AQUI

            # ---> CORREÇÃO: Adicionado para CRIAR os dados de complexidade
            ad1=dados.ad1,
            ad2=dados.ad2,
            ad3=dados.ad3
        )
        db.add(novo_indicador)
        mensagem = f"Mês de {dados.mes} criado!"

    db.commit()
    return {"mensagem": mensagem}


# 1. Molde para receber os dados do React
class MensagemChat(BaseModel):
    mensagem: str
    contexto_relatorio: str

# 2. Rota do Chat
@app.post("/api/relatorios/chat")
def chat_relatorio(dados: MensagemChat, usuario_logado: str = Depends(obter_usuario_atual)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Chave da API não encontrada")

    genai.configure(api_key=api_key)

    # O Prompt agora exige que a IA devolva um formato JSON estrito
    prompt = f"""
    Você é um assistente virtual especialista no programa 'Melhor em Casa'.
    O usuário está lendo o seguinte relatório gerado por você:

    --- INÍCIO DO RELATÓRIO ---
    {dados.contexto_relatorio}
    --- FIM DO RELATÓRIO ---

    Comando do usuário: {dados.mensagem}

    Sua tarefa:
    1. Responda ao usuário no chat de forma direta.
    2. SE o usuário pedir para alterar, adicionar, resumir ou remover algo do relatório, reescreva o relatório completo aplicando a mudança.
    3. SE o usuário fizer apenas uma pergunta, mantenha o texto do relatório exatamente igual.

    Você DEVE retornar APENAS um objeto JSON válido (sem formatação markdown em volta), com esta estrutura exata:
    {{
        "resposta_chat": "Sua resposta para o usuário ler no chat",
        "relatorio_atualizado": "O texto completo do relatório em Markdown (atualizado ou mantido igual)"
    }}
    """

    try:
        model = genai.GenerativeModel('gemini-flash-latest') 
        response = model.generate_content(prompt)

        # Limpa a resposta caso a IA coloque blocos de código (```json) em volta
        texto_limpo = response.text.replace("```json", "").replace("```", "").strip()

        # Transforma o texto da IA em um dicionário Python
        resultado_json = json.loads(texto_limpo)

        return {
            "resposta": resultado_json.get("resposta_chat", "Entendido."),
            "novo_relatorio": resultado_json.get("relatorio_atualizado", dados.contexto_relatorio)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar alteração: {str(e)}")

@app.delete("/api/indicadores/{item_id}")

def deletar_indicador(item_id: int, usuario_logado: str = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    # Busca o registro específico pelo ID
    item = db.query(models.IndicadorMensal).filter(models.IndicadorMensal.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Registro não encontrado")

    # Apaga do banco e salva a alteração
    db.delete(item)
    db.commit()

    return {"mensagem": f"Registro {item_id} excluído com sucesso"}

from pydantic import BaseModel

# 1. Molde exato e à prova de falhas para a edição
class EdicaoCompleta(BaseModel):
    mes: str
    admissoes: int
    altas_clinicas: int
    obitos: int
    pacientes_ativos: int
    feridas_ativas: int
    uso_atb: int
    cuidados_paliativos: int
    pacientes_vm: int
    pacientes_tqt: int
    pacientes_gtt: int
    pacientes_sne: int
    ad1: int
    ad2: int
    ad3: int

# 2. Rota atualizada usando o novo molde
@app.put("/api/indicadores/{item_id}")
def atualizar_indicador(item_id: int, dados: EdicaoCompleta,usuario_logado: str = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    item = db.query(models.IndicadorMensal).filter(models.IndicadorMensal.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Registro não encontrado")

    # Atualiza todos os campos
    item.mes = dados.mes
    item.admissoes = dados.admissoes
    # Tenta salvar em altas_clinicas, se o seu banco usar só 'altas', mude a linha abaixo para item.altas = dados.altas_clinicas
    item.altas_clinicas = dados.altas_clinicas 
    item.obitos = dados.obitos
    item.pacientes_ativos = dados.pacientes_ativos
    item.feridas_ativas = dados.feridas_ativas
    item.uso_atb = dados.uso_atb
    item.cuidados_paliativos = dados.cuidados_paliativos
    item.pacientes_vm = dados.pacientes_vm
    item.pacientes_tqt = dados.pacientes_tqt
    item.pacientes_gtt = dados.pacientes_gtt
    item.pacientes_sne = dados.pacientes_sne
    item.ad1 = dados.ad1
    item.ad2 = dados.ad2
    item.ad3 = dados.ad3

    db.commit()
    return {"mensagem": "Registro atualizado com sucesso"}

@app.get("/api/indicadores/exportar")
def exportar_excel(usuario_logado: str = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    # 1. Busca os dados no banco
    dados = db.query(models.IndicadorMensal).all()

    if not dados:
        raise HTTPException(status_code=404, detail="Nenhum dado encontrado para exportar.")

    # 2. Prepara os dados para o Excel
    lista_dados = []
    for item in dados:
        lista_dados.append({
            "Mês/Ano": item.mes,
            "Admissões": item.admissoes,
            "Altas Clínicas": item.altas_clinicas,
            "Óbitos": item.obitos,
            "Pacientes Ativos": item.pacientes_ativos,
            "Feridas Ativas": item.feridas_ativas,
            "Uso de ATB": item.uso_atb,
            "Cuidados Paliativos": item.cuidados_paliativos,
            "Pacientes em VM": item.pacientes_vm,
            "Pacientes com TQT": item.pacientes_tqt,
            "Pacientes com GTT": item.pacientes_gtt,
            "Pacientes com SNE": item.pacientes_sne,
            "Complexidade AD1": item.ad1,
            "Complexidade AD2": item.ad2,
            "Complexidade AD3": item.ad3
        })

    df = pd.DataFrame(lista_dados)

    # 3. Cria o arquivo Excel na memória
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Indicadores')

        # 4. Formatação visual da planilha
        worksheet = writer.sheets['Indicadores']
        header_fill = PatternFill(start_color='4F46E5', end_color='4F46E5', fill_type='solid')
        header_font = Font(color='FFFFFF', bold=True)
        alinhamento_centro = Alignment(horizontal='center', vertical='center')

        for col in worksheet.columns:
            col_letter = col[0].column_letter
            worksheet[f'{col_letter}1'].fill = header_fill
            worksheet[f'{col_letter}1'].font = header_font
            worksheet[f'{col_letter}1'].alignment = alinhamento_centro

            max_length = 0
            for cell in col:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            worksheet.column_dimensions[col_letter].width = (max_length + 2)

            for cell in col[1:]:
                cell.alignment = alinhamento_centro

    output.seek(0)

    # 5. Retorna o arquivo para download
    headers = {
        'Content-Disposition': 'attachment; filename="Relatorio_MelhorEmCasa.xlsx"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')