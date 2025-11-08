from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
import hashlib
import pandas as pd
import os
from werkzeug.utils import secure_filename
from openpyxl import load_workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
import time
import shutil

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

# Configurações padrão por projeto B
PROJETOS_CONFIG = {
    'B-0001': {
        'supervisor': 'João Silva',
        'cliente': 'Cliente Exemplo 1',
        'localidade': 'Irecê',
        'criterio': 'QLP'
    },
    'B-0002': {
        'supervisor': 'Maria Santos',
        'cliente': 'Cliente Exemplo 2',
        'localidade': 'Central',
        'criterio': 'QLU'
    }
}

# Lista de atividades disponíveis
ATIVIDADES_DISPONIVEIS = [
    'IMPLANTAÇÃO',
    'LANÇAMENTO',
    'ESCAVAÇÃO',
    'DESCARGA/IMPLANTAÇÃO',
    'INSTALAÇÃO DE ESTRUTURA',
    'PODA DE LIVRAMENTO',
    'CAVA COM RETRO'
]

# Função helper para salvar planilha com retry
def salvar_planilha_com_retry(wb, caminho, max_tentativas=3):
    """Tenta salvar a planilha com retry em caso de erro de permissão"""
    for tentativa in range(max_tentativas):
        try:
            # Criar backup temporário
            backup_path = caminho + '.backup'
            if os.path.exists(backup_path):
                os.remove(backup_path)
            
            # Salvar no arquivo temporário primeiro
            temp_path = caminho + '.temp'
            wb.save(temp_path)
            
            # Se salvou com sucesso, fazer backup do original
            if os.path.exists(caminho):
                shutil.copy2(caminho, backup_path)
            
            # Substituir o arquivo original
            shutil.move(temp_path, caminho)
            
            # Remover backup se tudo deu certo
            if os.path.exists(backup_path):
                os.remove(backup_path)
            
            print(f"✅ Planilha salva com sucesso!")
            return True
            
        except PermissionError as e:
            print(f"⚠️ Tentativa {tentativa + 1}/{max_tentativas} falhou: Arquivo pode estar aberto")
            if tentativa < max_tentativas - 1:
                time.sleep(1)  # Espera 1 segundo antes de tentar novamente
            else:
                raise Exception(f"❌ Não foi possível salvar o arquivo após {max_tentativas} tentativas. "
                              f"FECHE O ARQUIVO EXCEL se estiver aberto e tente novamente!")
        except Exception as e:
            print(f"❌ Erro ao salvar: {str(e)}")
            raise

    return False

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
                # L - NECESSIDADE (ATIVIDADE DO DIA)
                atividade_dia = str(row.iloc[11]) if pd.notna(row.iloc[11]) else 'IMPLANTAÇÃO'
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
                
                # Determinar status baseado nas DATAS
                from datetime import datetime
                hoje = datetime.now().date()
                
                # Processar data de início
                dt_inicio = None
                if data_inicio and data_inicio != 'nan' and str(data_inicio).strip():
                    try:
                        # Tentar converter data
                        if isinstance(data_inicio, datetime):
                            dt_inicio = data_inicio.date()
                        else:
                            # Tentar parsear string
                            data_str = str(data_inicio).strip()
                            if '/' in data_str:
                                dt_inicio = datetime.strptime(data_str, '%d/%m/%Y').date()
                            elif '-' in data_str:
                                dt_inicio = datetime.strptime(data_str.split()[0], '%Y-%m-%d').date()
                    except:
                        dt_inicio = None
                
                # Processar data de término (prazo)
                dt_termino = None
                if prazo and prazo != 'nan' and str(prazo).strip():
                    try:
                        if isinstance(prazo, datetime):
                            dt_termino = prazo.date()
                        else:
                            data_str = str(prazo).strip()
                            if '/' in data_str:
                                dt_termino = datetime.strptime(data_str, '%d/%m/%Y').date()
                            elif '-' in data_str:
                                dt_termino = datetime.strptime(data_str.split()[0], '%Y-%m-%d').date()
                    except:
                        dt_termino = None
                
                # LÓGICA DE STATUS:
                # 1. ENERGIZADA: Anotações contém "ENERGIZADA" OU Data de término < hoje
                # 2. EM ANDAMENTO: Data início <= hoje E (Data término >= hoje OU sem data término)
                # 3. PROGRAMADA: Data início > hoje
                # 4. CONCLUÍDA: Progresso >= 100%
                
                if is_energizada or (dt_termino and dt_termino < hoje):
                    status = 'Energizada'
                elif progresso >= 100:
                    status = 'Concluída'
                elif dt_inicio and dt_inicio > hoje:
                    status = 'Programada'
                elif dt_inicio and dt_inicio <= hoje:
                    if dt_termino:
                        if dt_termino >= hoje:
                            status = 'Em Andamento'
                        else:
                            status = 'Energizada'
                    else:
                        status = 'Em Andamento'
                else:
                    # Se não tem data de início, usa progresso
                    if progresso > 0:
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
                    'atividadeDia': atividade_dia,
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

# Endpoint para buscar obras
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

# Endpoint para buscar atividades disponíveis
@app.route('/api/atividades', methods=['GET'])
def get_atividades():
    return jsonify({
        'success': True,
        'atividades': ATIVIDADES_DISPONIVEIS
    }), 200

# Endpoint para buscar configuração de projeto B
@app.route('/api/projeto-config/<projeto_id>', methods=['GET'])
def get_projeto_config(projeto_id):
    config = PROJETOS_CONFIG.get(projeto_id, {})
    return jsonify({
        'success': True,
        'config': config
    }), 200

# Endpoint para adicionar nova obra
@app.route('/api/obras/adicionar', methods=['POST'])
def adicionar_obra():
    try:
        data = request.get_json()
        print(f"📥 Dados recebidos para adicionar: {data}")
        
        planilha_path = os.path.join('uploads', 'PROGRAMACAO - NOVEMBRO.xlsx')
        
        if not os.path.exists(planilha_path):
            print("❌ ERRO: Planilha não encontrada")
            return jsonify({'error': 'Planilha não encontrada'}), 404
        
        # Verificar se o arquivo está aberto
        try:
            # Tenta abrir o arquivo para verificar permissões
            with open(planilha_path, 'r+b'):
                pass
        except PermissionError:
            return jsonify({
                'error': '⚠️ O arquivo Excel está ABERTO! Por favor, FECHE o arquivo "PROGRAMACAO - NOVEMBRO.xlsx" e tente novamente.'
            }), 423  # 423 Locked
        
        # Carregar a planilha
        wb = load_workbook(planilha_path)
        ws = wb.active
        
        # Encontrar a próxima linha vazia
        proxima_linha = ws.max_row + 1
        print(f"➕ Adicionando obra na linha: {proxima_linha}")
        
        # Adicionar dados na planilha
        ws[f'A{proxima_linha}'] = data.get('encarregado', 'N/A')
        ws[f'B{proxima_linha}'] = data.get('supervisor', 'N/A')
        ws[f'C{proxima_linha}'] = data.get('projeto', '')
        ws[f'D{proxima_linha}'] = data.get('cliente', 'N/A')
        ws[f'E{proxima_linha}'] = data.get('localidade', 'N/A')
        ws[f'F{proxima_linha}'] = data.get('criterio', '')
        ws[f'G{proxima_linha}'] = data.get('anotacoes', '')
        ws[f'H{proxima_linha}'] = data.get('postesPrevistos', 0)
        ws[f'I{proxima_linha}'] = data.get('dataInicio', '')
        ws[f'J{proxima_linha}'] = data.get('prazo', '')
        ws[f'K{proxima_linha}'] = data.get('obraSemana', '')
        ws[f'L{proxima_linha}'] = data.get('atividadeDia', 'IMPLANTAÇÃO')
        ws[f'M{proxima_linha}'] = data.get('programacaoLv', '')
        ws[f'N{proxima_linha}'] = data.get('cavasRealizadas', 0)
        ws[f'O{proxima_linha}'] = data.get('postesImplantados', 0)
        ws[f'P{proxima_linha}'] = data.get('latitude', '')
        ws[f'Q{proxima_linha}'] = data.get('longitude', '')
        ws[f'R{proxima_linha}'] = data.get('clientesPrevistos', 0)
        ws[f'S{proxima_linha}'] = data.get('projetoKit', '')
        ws[f'T{proxima_linha}'] = data.get('projetoMedidor', '')
        ws[f'U{proxima_linha}'] = data.get('arCoelba', 'N/A')
        ws[f'V{proxima_linha}'] = data.get('dataVisitaPrevia', '')
        ws[f'W{proxima_linha}'] = data.get('observacaoVisita', '')
        ws[f'X{proxima_linha}'] = data.get('analisePreFechamento', '')
        ws[f'Y{proxima_linha}'] = data.get('dataSolicitacaoReserva', '')
        
        print(f"💾 Salvando planilha...")
        
        # Salvar a planilha com retry
        try:
            salvar_planilha_com_retry(wb, planilha_path)
            wb.close()
            
            print("✅ Obra adicionada com sucesso!")
            return jsonify({
                'success': True,
                'message': 'Obra adicionada com sucesso!'
            }), 200
            
        except Exception as save_error:
            wb.close()
            raise save_error
        
    except Exception as e:
        print(f"❌ ERRO ao adicionar obra: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Mensagem mais amigável para erro de permissão
        error_msg = str(e)
        if 'Permission denied' in error_msg or 'FECHE O ARQUIVO' in error_msg:
            error_msg = '⚠️ O arquivo Excel está ABERTO! Por favor, FECHE o arquivo e tente novamente.'
        
        return jsonify({'error': error_msg}), 500

# Endpoint para atualizar obra existente
@app.route('/api/obras/atualizar/<int:obra_id>', methods=['PUT'])
def atualizar_obra(obra_id):
    try:
        data = request.get_json()
        planilha_path = os.path.join('uploads', 'PROGRAMACAO - NOVEMBRO.xlsx')
        
        print(f"📝 Tentando atualizar obra ID: {obra_id}")
        print(f"📥 Dados recebidos: {data}")
        
        if not os.path.exists(planilha_path):
            return jsonify({'error': 'Planilha não encontrada'}), 404
        
        # Verificar se o arquivo está aberto
        try:
            with open(planilha_path, 'r+b'):
                pass
        except PermissionError:
            return jsonify({
                'error': '⚠️ O arquivo Excel está ABERTO! Por favor, FECHE o arquivo "PROGRAMACAO - NOVEMBRO.xlsx" e tente novamente.'
            }), 423  # 423 Locked
        
        # Carregar a planilha
        wb = load_workbook(planilha_path)
        ws = wb.active
        
        # A linha na planilha é obra_id (obra_id já considera o cabeçalho)
        # obra_id = 1 significa a primeira obra (linha 2 no Excel, pois linha 1 é cabeçalho)
        linha = obra_id + 1
        
        print(f"🔄 Atualizando linha {linha} na planilha")
        
        # Verificar se a linha existe
        if linha > ws.max_row:
            wb.close()
            return jsonify({'error': f'Obra ID {obra_id} não encontrada'}), 404
        
        # Atualizar dados na planilha (apenas campos fornecidos)
        if 'encarregado' in data:
            ws[f'A{linha}'] = data['encarregado']
            print(f"✏️ Encarregado atualizado: {data['encarregado']}")
        
        if 'supervisor' in data:
            ws[f'B{linha}'] = data['supervisor']
            print(f"✏️ Supervisor atualizado: {data['supervisor']}")
        
        if 'atividadeDia' in data:
            ws[f'L{linha}'] = data['atividadeDia']
            print(f"✏️ Atividade do dia atualizada: {data['atividadeDia']}")
        
        if 'postesImplantados' in data:
            ws[f'O{linha}'] = data['postesImplantados']
            print(f"✏️ Postes implantados atualizado: {data['postesImplantados']}")
        
        if 'cavasRealizadas' in data:
            ws[f'N{linha}'] = data['cavasRealizadas']
            print(f"✏️ Cavas realizadas atualizado: {data['cavasRealizadas']}")
        
        if 'anotacoes' in data:
            ws[f'G{linha}'] = data['anotacoes']
            print(f"✏️ Anotações atualizadas: {data['anotacoes']}")
        
        print(f"💾 Salvando alterações...")
        
        # Salvar a planilha com retry
        try:
            salvar_planilha_com_retry(wb, planilha_path)
            wb.close()
            
            print(f"✅ Obra atualizada com sucesso!")
            return jsonify({
                'success': True,
                'message': 'Obra atualizada com sucesso'
            }), 200
            
        except Exception as save_error:
            wb.close()
            raise save_error
        
    except Exception as e:
        print(f"❌ ERRO ao atualizar obra: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Mensagem mais amigável para erro de permissão
        error_msg = str(e)
        if 'Permission denied' in error_msg or 'FECHE O ARQUIVO' in error_msg:
            error_msg = '⚠️ O arquivo Excel está ABERTO! Por favor, FECHE o arquivo e tente novamente.'
        
        return jsonify({'error': error_msg}), 500

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