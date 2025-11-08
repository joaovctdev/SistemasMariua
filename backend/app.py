from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
import hashlib
import pandas as pd
import os
from werkzeug.utils import secure_filename

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

# Função auxiliar para processar planilha
def processar_planilha(caminho_arquivo):
    """Processa a planilha e retorna lista de obras"""
    try:
        # Ler o Excel com pandas
        df = pd.read_excel(caminho_arquivo, header=0)
        
        # Processar os dados
        obras = []
        
        for index, row in df.iterrows():
            try:
                # Extrair TODAS as colunas (baseado na ordem correta do Excel)
                # A - ENCARREGADO
                encarregado = str(row.iloc[0]) if pd.notna(row.iloc[0]) else 'N/A'
                # B - SUPERVISOR
                supervisor = str(row.iloc[1]) if pd.notna(row.iloc[1]) else 'N/A'
                # C - PROJETO
                projeto = str(row.iloc[2]) if pd.notna(row.iloc[2]) else f"B-{str(index+1).zfill(4)}"
                # D - TÍTULO (cliente)
                cliente = str(row.iloc[3]) if pd.notna(row.iloc[3]) else 'N/A'
                # E - MUNICIPIO (localidade)
                localidade = str(row.iloc[4]) if pd.notna(row.iloc[4]) else 'N/A'
                # F - CRITÉRIO
                criterio = str(row.iloc[5]) if pd.notna(row.iloc[5]) else ''
                # G - ANOTAÇÕES
                anotacoes = str(row.iloc[6]) if pd.notna(row.iloc[6]) else ''
                # H - POSTES PREVISTOS
                postes_previstos = float(row.iloc[7]) if pd.notna(row.iloc[7]) else 0
                # I - DATA DE INÍCIO
                data_inicio = str(row.iloc[8]) if pd.notna(row.iloc[8]) else ''
                # J - DATA CONCLUSÃO (prazo)
                prazo = str(row.iloc[9]) if pd.notna(row.iloc[9]) else ''
                # K - OBRA DA SEMANA
                obra_semana = str(row.iloc[10]) if pd.notna(row.iloc[10]) else ''
                # L - NECESSIDADE
                necessidade = str(row.iloc[11]) if pd.notna(row.iloc[11]) else ''
                # M - PROGRAMAÇÃO LV
                programacao_lv = str(row.iloc[12]) if pd.notna(row.iloc[12]) else ''
                # N - CAVAS REALIZADAS
                cavas_realizadas = float(row.iloc[13]) if pd.notna(row.iloc[13]) else 0
                # O - POSTES REALIZADOS
                postes_implantados = float(row.iloc[14]) if pd.notna(row.iloc[14]) else 0
                # P - LATITUDE
                latitude_raw = row.iloc[15] if pd.notna(row.iloc[15]) else None
                latitude = None
                if latitude_raw is not None:
                    try:
                        # Tentar converter para float
                        lat_str = str(latitude_raw).replace(',', '.').strip()
                        latitude = float(lat_str)
                    except:
                        latitude = None
                
                # Q - LONGITUDE
                longitude_raw = row.iloc[16] if pd.notna(row.iloc[16]) else None
                longitude = None
                if longitude_raw is not None:
                    try:
                        # Tentar converter para float
                        lng_str = str(longitude_raw).replace(',', '.').strip()
                        longitude = float(lng_str)
                    except:
                        longitude = None
                # R - CLIENTES PREVISTOS
                clientes_previstos = float(row.iloc[17]) if pd.notna(row.iloc[17]) else 0
                # S - PROJETO KIT
                projeto_kit = str(row.iloc[18]) if pd.notna(row.iloc[18]) else ''
                # T - PROJETO MEDIDOR
                projeto_medidor = str(row.iloc[19]) if pd.notna(row.iloc[19]) else ''
                # U - AR COELBA
                ar_coelba = str(row.iloc[20]) if pd.notna(row.iloc[20]) else 'N/A'
                # V - VISITA PRÉVIA
                data_visita_previa = str(row.iloc[21]) if pd.notna(row.iloc[21]) else ''
                # W - OBSERVAÇÃO DA VISITA
                observacao_visita = str(row.iloc[22]) if pd.notna(row.iloc[22]) else ''
                # X - ANÁLISE PRÉ FECH
                analise_pre_fechamento = str(row.iloc[23]) if pd.notna(row.iloc[23]) else ''
                # Y - SOLICITAÇÃO DE RESERVA
                data_solicitacao_reserva = str(row.iloc[24]) if pd.notna(row.iloc[24]) else ''
                
                # Calcular progresso
                progresso = 0
                if postes_previstos > 0:
                    progresso = min(round((postes_implantados / postes_previstos) * 100), 100)
                
                # Verificar se está energizada
                is_energizada = 'ENERGIZADA' in anotacoes.upper()
                
                # Determinar status
                if is_energizada:
                    status = 'Energizada'
                elif progresso >= 100:
                    status = 'Concluída'
                elif progresso > 0:
                    status = 'Em Andamento'
                else:
                    status = 'Programada'
                
                # Verificar se tem coordenadas válidas
                has_valid_coordinates = (
                    latitude is not None and 
                    longitude is not None and
                    -90 <= latitude <= 90 and
                    -180 <= longitude <= 180
                )
                
                obra = {
                    'id': index + 1,
                    'encarregado': encarregado,
                    'supervisor': supervisor,
                    'projeto': projeto,
                    'cliente': cliente,
                    'localidade': localidade,
                    'criterio': criterio,
                    'anotacoes': anotacoes,
                    'postesPrevistos': int(postes_previstos),
                    'dataInicio': data_inicio,
                    'prazo': prazo,
                    'obraSemana': obra_semana,
                    'necessidade': necessidade,
                    'programacaoLv': programacao_lv,
                    'cavasRealizadas': int(cavas_realizadas),
                    'postesImplantados': int(postes_implantados),
                    'latitude': latitude,
                    'longitude': longitude,
                    'hasCoordinates': has_valid_coordinates,
                    'clientesPrevistos': int(clientes_previstos),
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
                
                # Só adicionar se tiver projeto válido
                if projeto and projeto != 'nan':
                    obras.append(obra)
                    # Debug: mostrar coordenadas das primeiras 3 obras
                    if len(obras) <= 3:
                        print(f"Obra {projeto}: Lat={latitude}, Lng={longitude}, Valid={has_valid_coordinates}")
                    
                    
            except Exception as e:
                print(f"Erro ao processar linha {index}: {e}")
                continue
        
        return obras
    except Exception as e:
        raise Exception(f"Erro ao processar planilha: {str(e)}")

# Endpoint de login
@app.route('/api/login', methods=['POST'])
def login():
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

# Endpoint para buscar obras - CORRIGIDO
@app.route('/api/obras', methods=['GET'])
@app.route('/api/obras/', methods=['GET'])
def get_obras():
    try:
        # Caminho da planilha no backend
        planilha_path = os.path.join('uploads', 'PROGRAMACAO - NOVEMBRO.xlsx')
        
        print(f"Procurando planilha em: {planilha_path}")
        print(f"Arquivo existe? {os.path.exists(planilha_path)}")
        
        if not os.path.exists(planilha_path):
            return jsonify({'error': 'Planilha não encontrada no servidor'}), 404
        
        obras = processar_planilha(planilha_path)
        
        print(f"Total de obras processadas: {len(obras)}")
        
        return jsonify({
            'success': True,
            'total': len(obras),
            'obras': obras
        }), 200
        
    except Exception as e:
        print(f"Erro ao buscar obras: {e}")
        return jsonify({'error': str(e)}), 500

# Rota de teste
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

# Endpoint de debug para coordenadas
@app.route('/api/debug/coordenadas', methods=['GET'])
def debug_coordenadas():
    try:
        planilha_path = os.path.join('uploads', 'PROGRAMACAO - NOVEMBRO.xlsx')
        
        if not os.path.exists(planilha_path):
            return jsonify({'error': 'Planilha não encontrada'}), 404
        
        df = pd.read_excel(planilha_path, header=0)
        
        coordenadas_info = []
        for index, row in df.iterrows():
            if index < 5:  # Apenas as 5 primeiras linhas
                projeto = str(row.iloc[2]) if pd.notna(row.iloc[2]) else 'N/A'
                lat_raw = row.iloc[15]
                lng_raw = row.iloc[16]
                
                coordenadas_info.append({
                    'linha': index + 1,
                    'projeto': projeto,
                    'latitude_raw': str(lat_raw),
                    'longitude_raw': str(lng_raw),
                    'lat_type': str(type(lat_raw)),
                    'lng_type': str(type(lng_raw))
                })
        
        return jsonify({
            'total_linhas': len(df),
            'primeiras_5_linhas': coordenadas_info
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Iniciando servidor Flask...")
    print("Verifique se a planilha está em: backend/uploads/PROGRAMACAO - NOVEMBRO.xlsx")
    app.run(debug=True, port=5000)