from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
import hashlib
import pandas as pd
import numpy as np
import os
from werkzeug.utils import secure_filename
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuração
app.config['SECRET_KEY'] = 'sua-chave-secreta-super-segura'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Criar pasta de uploads se não existir
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Banco de dados simulado
users_db = {
    'admin@mariua.net': {
        'password': hashlib.sha256('MARIUA2025'.encode()).hexdigest(),
        'name': 'Administrador'
    }
}

# =======================
# FUNÇÕES AUXILIARES
# =======================

def validar_coordenadas(lat, lng):
    """Valida se as coordenadas são válidas"""
    try:
        lat = float(lat)
        lng = float(lng)
        return (-90 <= lat <= 90) and (-180 <= lng <= 180)
    except (ValueError, TypeError):
        return False

def limpar_valor(valor):
    """Limpa e normaliza valores da planilha"""
    if pd.isna(valor):
        return None
    
    valor_str = str(valor).strip()
    
    # Valores inválidos
    if valor_str.lower() in ['nan', 'none', 'nat', '']:
        return None
    
    return valor_str

def converter_numero(valor, padrao=0):
    """Converte valores para número de forma segura"""
    try:
        if pd.isna(valor):
            return padrao
        return float(valor)
    except (ValueError, TypeError):
        return padrao

def converter_coordenada(valor):
    """Converte coordenadas de forma robusta"""
    try:
        if pd.isna(valor):
            return None
        
        valor_str = str(valor).replace(',', '.').strip()
        coord = float(valor_str)
        
        return coord if -180 <= coord <= 180 else None
    except (ValueError, TypeError):
        return None

def converter_data(valor):
    """
    Converte diferentes formatos de data para objeto datetime
    Aceita: dd/mm/yyyy, yyyy-mm-dd, timestamps do Excel
    """
    if pd.isna(valor):
        return None
    
    try:
        # Se já for datetime do pandas
        if isinstance(valor, pd.Timestamp):
            return valor.to_pydatetime()
        
        # Se for string
        if isinstance(valor, str):
            valor = valor.strip()
            
            # Formato dd/mm/yyyy
            if '/' in valor:
                return datetime.strptime(valor, '%d/%m/%Y')
            
            # Formato yyyy-mm-dd
            if '-' in valor:
                return datetime.strptime(valor, '%Y-%m-%d')
        
        # Se for número (Excel timestamp)
        if isinstance(valor, (int, float)):
            return pd.to_datetime(valor, unit='D', origin='1899-12-30')
        
        return None
    except (ValueError, TypeError) as e:
        logger.warning(f"Erro ao converter data '{valor}': {e}")
        return None

def formatar_data_br(data):
    """Formata datetime para dd/mm/yyyy"""
    if data is None:
        return None
    try:
        if isinstance(data, datetime):
            return data.strftime('%d/%m/%Y')
        return str(data)
    except:
        return None

def determinar_status(data_inicio, data_termino, progresso, anotacoes):
    """
    Determina o status da obra baseado nas datas e progresso
    
    Regras:
    - ENERGIZADA: Se contém "ENERGIZADA" nas anotações
    - CONCLUÍDA: Se data_termino < hoje
    - PROGRAMADA: Se data_inicio > hoje
    - EM ANDAMENTO: Se data_inicio <= hoje <= data_termino
    """
    hoje = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Verificar se está energizada
    is_energizada = False
    if anotacoes:
        is_energizada = 'ENERGIZADA' in anotacoes.upper()
    
    if is_energizada:
        return 'Energizada', is_energizada
    
    # Se não tem datas, usar apenas progresso
    if not data_inicio and not data_termino:
        if progresso >= 100:
            return 'Concluída', False
        elif progresso > 0:
            return 'Em Andamento', False
        else:
            return 'Programada', False
    
    # Lógica baseada em datas
    if data_termino:
        if data_termino < hoje:
            return 'Concluída', False
    
    if data_inicio:
        if data_inicio > hoje:
            return 'Programada', False
    
    # Se data_inicio <= hoje e (não tem data_termino OU data_termino >= hoje)
    if data_inicio and data_inicio <= hoje:
        if not data_termino or data_termino >= hoje:
            return 'Em Andamento', False
    
    # Fallback: usar progresso
    if progresso >= 100:
        return 'Concluída', False
    elif progresso > 0:
        return 'Em Andamento', False
    else:
        return 'Programada', False

# =======================
# PROCESSAMENTO DE PLANILHA
# =======================

def processar_planilha(caminho_arquivo):
    """
    Processa a planilha Excel de forma robusta e eficiente
    Retorna lista de obras processadas
    """
    try:
        logger.info(f"Iniciando processamento: {caminho_arquivo}")
        
        df = pd.read_excel(caminho_arquivo, header=0, engine='openpyxl')
        df = df.replace({np.nan: None})
        
        logger.info(f"Planilha carregada: {len(df)} linhas")
        
        obras = []
        hoje = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        for index, row in df.iterrows():
            try:
                # DADOS BÁSICOS
                projeto = limpar_valor(row.iloc[2])
                if not projeto:
                    continue
                
                # EQUIPE
                encarregado = limpar_valor(row.iloc[0]) or 'N/A'
                supervisor = limpar_valor(row.iloc[1]) or 'N/A'
                
                # LOCALIZAÇÃO
                cliente = limpar_valor(row.iloc[3]) or 'N/A'
                localidade = limpar_valor(row.iloc[4]) or 'N/A'
                
                # INFORMAÇÕES ADICIONAIS
                criterio = limpar_valor(row.iloc[5]) or ''
                anotacoes = limpar_valor(row.iloc[6]) or ''
                
                # NÚMEROS - POSTES
                postes_previstos = int(converter_numero(row.iloc[7]))
                postes_implantados = int(converter_numero(row.iloc[14]))
                cavas_realizadas = int(converter_numero(row.iloc[13]))
                
                # DATAS - CONVERTIDAS PARA DATETIME
                data_inicio_raw = row.iloc[8]
                data_termino_raw = row.iloc[9]
                
                data_inicio = converter_data(data_inicio_raw)
                data_termino = converter_data(data_termino_raw)
                
                # Formatar para exibição
                data_inicio_str = formatar_data_br(data_inicio) or ''
                data_termino_str = formatar_data_br(data_termino) or ''
                
                # PROGRAMAÇÃO
                obra_semana = limpar_valor(row.iloc[10]) or ''
                necessidade = limpar_valor(row.iloc[11]) or ''
                programacao_lv = limpar_valor(row.iloc[12]) or ''
                
                # COORDENADAS
                latitude = converter_coordenada(row.iloc[15])
                longitude = converter_coordenada(row.iloc[16])
                
                has_valid_coordinates = (
                    latitude is not None and 
                    longitude is not None and
                    validar_coordenadas(latitude, longitude)
                )
                
                # CLIENTES E PROJETOS
                clientes_previstos = int(converter_numero(row.iloc[17]))
                projeto_kit = limpar_valor(row.iloc[18]) or ''
                projeto_medidor = limpar_valor(row.iloc[19]) or ''
                
                # DOCUMENTAÇÃO
                ar_coelba = limpar_valor(row.iloc[20]) or 'N/A'
                data_visita_previa = limpar_valor(row.iloc[21]) or ''
                observacao_visita = limpar_valor(row.iloc[22]) or ''
                analise_pre_fechamento = limpar_valor(row.iloc[23]) or ''
                data_solicitacao_reserva = limpar_valor(row.iloc[24]) or ''
                
                # CÁLCULOS
                progresso = 0
                if postes_previstos > 0:
                    progresso = min(
                        round((postes_implantados / postes_previstos) * 100),
                        100
                    )
                
                # DETERMINAR STATUS BASEADO EM DATAS
                status, is_energizada = determinar_status(
                    data_inicio, 
                    data_termino, 
                    progresso, 
                    anotacoes
                )
                
                # MONTAR OBJETO
                obra = {
                    'id': index + 1,
                    'encarregado': encarregado,
                    'supervisor': supervisor,
                    'projeto': projeto,
                    'cliente': cliente,
                    'localidade': localidade,
                    'criterio': criterio,
                    'anotacoes': anotacoes,
                    'postesPrevistos': postes_previstos,
                    'dataInicio': data_inicio_str,
                    'dataTermino': data_termino_str,
                    'prazo': data_termino_str,  # Alias para compatibilidade
                    'obraSemana': obra_semana,
                    'necessidade': necessidade,
                    'programacaoLv': programacao_lv,
                    'cavasRealizadas': cavas_realizadas,
                    'postesImplantados': postes_implantados,
                    'latitude': latitude,
                    'longitude': longitude,
                    'hasCoordinates': has_valid_coordinates,
                    'clientesPrevistos': clientes_previstos,
                    'projetoKit': projeto_kit,
                    'projetoMedidor': projeto_medidor,
                    'arCoelba': ar_coelba,
                    'dataVisitaPrevia': data_visita_previa,
                    'observacaoVisita': observacao_visita,
                    'analisePreFechamento': analise_pre_fechamento,
                    'dataSolicitacaoReserva': data_solicitacao_reserva,
                    'progresso': progresso,
                    'isEnergizada': is_energizada,
                    'status': status
                }
                
                obras.append(obra)
                
                # Log das primeiras 5 obras
                if len(obras) <= 5:
                    logger.info(
                        f"Obra {projeto}: Status={status}, "
                        f"Início={data_inicio_str}, Término={data_termino_str}, "
                        f"Progresso={progresso}%"
                    )
                    
            except Exception as e:
                logger.error(f"Erro na linha {index + 2}: {str(e)}")
                continue
        
        # Estatísticas
        stats = {
            'total': len(obras),
            'em_andamento': len([o for o in obras if o['status'] == 'Em Andamento']),
            'concluidas': len([o for o in obras if o['status'] == 'Concluída']),
            'programadas': len([o for o in obras if o['status'] == 'Programada']),
            'energizadas': len([o for o in obras if o['isEnergizada']])
        }
        
        logger.info(f"✅ Processamento concluído: {stats}")
        
        return obras
        
    except Exception as e:
        logger.error(f"❌ Erro ao processar planilha: {str(e)}")
        raise Exception(f"Erro ao processar planilha: {str(e)}")

# =======================
# ENDPOINTS
# =======================

@app.route('/api/login', methods=['POST'])
def login():
    """Endpoint de autenticação"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Usuário e senha são obrigatórios'}), 400
    
    user = users_db.get(username)
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    if user and user['password'] == password_hash:
        token = jwt.encode({
            'username': username,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'token': token,
            'username': username,
            'name': user['name']
        }), 200
    
    return jsonify({'error': 'Credenciais inválidas'}), 401

@app.route('/api/obras', methods=['GET'])
@app.route('/api/obras/', methods=['GET'])
def get_obras():
    """Retorna todas as obras processadas"""
    try:
        planilha_path = os.path.join('uploads', 'PROGRAMACAO - NOVEMBRO.xlsx')
        
        if not os.path.exists(planilha_path):
            logger.error(f"Planilha não encontrada: {planilha_path}")
            return jsonify({
                'error': 'Planilha não encontrada no servidor',
                'path': planilha_path
            }), 404
        
        obras = processar_planilha(planilha_path)
        
        return jsonify({
            'success': True,
            'total': len(obras),
            'obras': obras,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar obras: {str(e)}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'version': '2.1'
    }), 200

@app.route('/api/debug/planilha', methods=['GET'])
def debug_planilha():
    """Endpoint de debug para análise da planilha"""
    try:
        planilha_path = os.path.join('uploads', 'PROGRAMACAO - NOVEMBRO.xlsx')
        
        if not os.path.exists(planilha_path):
            return jsonify({'error': 'Planilha não encontrada'}), 404
        
        df = pd.read_excel(planilha_path, header=0, engine='openpyxl')
        
        info = {
            'total_linhas': len(df),
            'total_colunas': len(df.columns),
            'colunas': df.columns.tolist(),
            'primeiras_5_linhas': []
        }
        
        for index, row in df.head(5).iterrows():
            data_inicio = converter_data(row.iloc[8])
            data_termino = converter_data(row.iloc[9])
            
            info['primeiras_5_linhas'].append({
                'linha': index + 1,
                'projeto': limpar_valor(row.iloc[2]),
                'encarregado': limpar_valor(row.iloc[0]),
                'data_inicio_raw': str(row.iloc[8]),
                'data_inicio_convertida': formatar_data_br(data_inicio),
                'data_termino_raw': str(row.iloc[9]),
                'data_termino_convertida': formatar_data_br(data_termino),
                'postes_previstos': converter_numero(row.iloc[7]),
                'postes_implantados': converter_numero(row.iloc[14]),
            })
        
        return jsonify(info), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("="*60)
    logger.info("🚀 Iniciando Servidor Flask - Sistema Mariuá v2.1")
    logger.info("="*60)
    logger.info(f"📁 Pasta de uploads: {app.config['UPLOAD_FOLDER']}")
    logger.info(f"📊 Planilha esperada: uploads/PROGRAMACAO - NOVEMBRO.xlsx")
    logger.info("📅 Lógica de status baseada em datas implementada")
    logger.info("="*60)
    
    app.run(debug=True, port=5000, host='0.0.0.0')