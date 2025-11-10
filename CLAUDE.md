# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema Mariuá is a construction project management web application with a React frontend and Flask Python backend. The system uses Excel files as the primary data storage mechanism for managing "obras" (construction works/projects).

**Architecture**: Full-stack monolithic application
- **Frontend**: React 18.2.0 (Create React App) - Port 3000
- **Backend**: Flask 3.0.0 (Python) - Port 5000
- **Data Storage**: Excel (.xlsx) files in `backend/uploads/`
- **Authentication**: JWT tokens with SHA-256 password hashing

## Development Commands

### Frontend (React)
```bash
cd frontend
npm install              # Install dependencies
npm start                # Start dev server on http://localhost:3000
npm run build            # Build for production
npm test                 # Run tests
```

### Backend (Flask)
```bash
cd backend
pip install -r requirements.txt    # Install Python dependencies
python app.py                       # Start Flask server on http://localhost:5000
```

### Running Full Stack
1. Start backend: `cd backend && python app.py`
2. Start frontend: `cd frontend && npm start` (in new terminal)
3. Access app at http://localhost:3000

## Key Architecture Patterns

### Data Flow
1. React components fetch data from Flask API endpoints
2. Flask reads/writes Excel file using pandas + openpyxl
3. Excel file acts as single source of truth (no database)
4. JWT authentication stored in localStorage on frontend
5. File locking mechanism prevents concurrent write conflicts

### Excel File Structure
The system processes Excel files with 25 columns (A-Y):
- **A**: Encarregado (foreman)
- **B**: Supervisor
- **C**: Projeto (Project ID, e.g., B-0001)
- **D**: Título/Cliente
- **E**: Município/Localidade
- **F**: Critério (QLP, QLU, etc.)
- **G**: Anotações (annotations, "ENERGIZADA" marks completion)
- **H**: Postes Previstos
- **I**: Data de Início
- **J**: Data Conclusão (Prazo)
- **K**: Obra da Semana
- **L**: Atividade do Dia (dropdown: IMPLANTAÇÃO, LANÇAMENTO, etc.)
- **M-Y**: Various tracking fields (cavas, coordinates, observations, etc.)

### Status Calculation Logic
Obras status is determined in `processar_planilha()` (backend/app.py:227-259):
1. **Energizada**: If "ENERGIZADA" in annotations OR prazo < today
2. **Concluída**: If progress >= 100%
3. **Programada**: If data_inicio > today
4. **Em Andamento**: If data_inicio <= today AND prazo >= today

### API Endpoints Structure
All endpoints prefixed with `/api`:
- `POST /login` - Authentication (returns JWT token)
- `GET /obras` - Fetch all construction works
- `POST /obras/adicionar` - Add new obra (appends row to Excel)
- `PUT /obras/atualizar/<id>` - Update existing obra
- `GET /atividades` - Get available activity types
- `GET /projeto-config/<projeto_id>` - Get project template config
- `GET /health` - Health check

### Frontend Page Navigation
The app uses manual state-based navigation (not React Router):
- Navigation managed by `currentPage` state in App.js
- Pages: home, obras, dashboards, frota, seguranca
- Use `setCurrentPage('page-name')` to navigate
- No URL routing or browser history

### File Locking and Concurrent Access
Backend implements retry mechanism for Excel file writes:
- `salvar_planilha_com_retry()` function (app.py:62-100)
- Max 3 retry attempts with 1-second delays
- Returns 423 status code if file is locked
- Creates temporary backups during save operations

## Important Files and Their Roles

### Backend Core
- **backend/app.py** (611 lines): Main Flask API with all endpoints and Excel processing logic
- **backend/requirements.txt**: Python dependencies (Flask, pandas, openpyxl, PyJWT)
- **backend/uploads/**: Directory for Excel files (currently hardcoded to PROGRAMACAO - NOVEMBRO.xlsx)

### Frontend Core
- **frontend/src/App.js** (375 lines): Main React app with auth state and page routing
- **frontend/src/pages/Obras.js** (889 lines): Main obras management page with PROGRAMAÇÃO DO DIA section
- **frontend/src/components/**: Reusable components (Login, SVGIcon)
- **frontend/public/Logos/**: Logo images (Mariua26Cor.png, Mariua25Branca.png, LogoMariua.png)
- **frontend/public/carousel/**: Homepage carousel images (1.jpeg through 20.jpeg)

### Configuration
- **frontend/package.json**: Frontend dependencies and npm scripts
- **package.json** (root): Contains react-router-dom (currently unused)

## Known Issues and Technical Debt

### Critical Security Issues
1. **Hardcoded credentials**: User credentials in app.py lines 27-32 should be in database or env vars
2. **Hardcoded secret key**: JWT secret key (app.py:18) should be in environment variable
3. **Debug mode enabled**: Flask debug=True (app.py:611) exposes sensitive error info
4. **CORS open to all origins**: CORS(app) should be restricted in production

### High Priority Issues
1. **Duplicate HomePage component**: Defined both inline in App.js (lines 141-222) AND in separate Home.js file
2. **Missing prop passing**: Home.js expects currentUser and onNavigate props but they're not passed from App.js
3. **Inconsistent page components**: SegurancaPage, FrotaPage, DashboardsPage defined inline instead of using separate page files

### Medium Priority Issues
1. **Hardcoded API URLs**: API_URL in App.js:7 and Obras.js:4 should use process.env.REACT_APP_API_URL
2. **Month-specific filename**: Excel filename hardcoded as 'PROGRAMACAO - NOVEMBRO.xlsx' will be outdated each month
3. **Missing image files**: Multiple hardcoded paths to logos and carousel images that may not exist
4. **Unused Login.js component**: Dead code that should be removed or integrated

### Data Handling Issues
1. **String 'nan' comparisons**: Code checks `if prazo != 'nan'` but pandas may return NaN type (use pd.isna() instead)
2. **Unsafe float conversions**: Float conversions without try-catch in processar_planilha()

## Development Best Practices for This Codebase

### Working with Excel Files
- Always use `salvar_planilha_com_retry()` for writes (never direct wb.save())
- Check file locking before modifications (return 423 status if locked)
- Use pandas for reading, openpyxl for writing
- Header row is row 1, data starts at row 2
- obra_id maps to Excel row: `excel_row = obra_id + 1`

### Adding New Obra Fields
If adding new columns to Excel:
1. Update column index in `processar_planilha()` (app.py:103-316)
2. Add field to obra object construction (lines 193-219)
3. Update frontend Obras.js form inputs
4. Update `atualizar_obra()` endpoint if field should be editable

### Frontend State Management
- No Redux or Context API used
- Use useState for local component state
- Use props drilling for passing navigation handlers
- Store JWT token in localStorage (key: 'token')
- Current user stored in localStorage (key: 'currentUser')

### API Error Handling
- Backend returns JSON with `success: true/false` and `message` fields
- Frontend checks response.ok before parsing JSON
- Use try-catch for all fetch calls
- Display user-friendly error messages via alert() or console.error()

### Styling Approach
- Pure CSS (no framework like Bootstrap or Tailwind)
- CSS files co-located with components (e.g., Obras.css next to Obras.js)
- Global styles in App.css
- Uses CSS Grid and Flexbox for layouts
- Color scheme: Blue headers (#007bff), White backgrounds, Gray borders

## Testing and Debugging

### Manual Testing Checklist
1. Test login with credentials: admin@mariua.net / MARIUA2025
2. Verify obras load correctly from Excel
3. Test adding new obra (should append to Excel)
4. Test updating obra activity (should modify Excel)
5. Check PROGRAMAÇÃO DO DIA table shows only "Em Andamento" obras
6. Test PNG export functionality (html2canvas)

### Debugging Tools
- Backend logs: Check Flask console output
- Frontend logs: Check browser console (React DevTools recommended)
- Excel validation: Open Excel file directly to verify data
- API testing: Use `/api/health` endpoint to verify backend is running
- Debug coordinates: Use `/api/debug/coordenadas` endpoint

### Common Issues
- **"Arquivo pode estar aberto"**: Close Excel file before API writes
- **Empty obras list**: Check Excel file exists at backend/uploads/PROGRAMACAO - NOVEMBRO.xlsx
- **Authentication fails**: Verify JWT token is valid and not expired (24hr expiry)
- **Images not loading**: Verify files exist in frontend/public/Logos/ and frontend/public/carousel/

## Environment Variables (Should Be Added)
Currently all config is hardcoded. Should migrate to:
- `FLASK_SECRET_KEY`: JWT secret key
- `FLASK_ENV`: development/production
- `REACT_APP_API_URL`: Backend API URL
- `UPLOAD_FOLDER`: Excel files directory
- `ADMIN_EMAIL`: Admin user email
- `ADMIN_PASSWORD_HASH`: Admin password hash

## Python Dependencies Notes
- **Flask 3.0.0**: Latest major version, stable
- **pandas 2.1.3**: For Excel data manipulation
- **openpyxl 3.1.2**: For Excel file I/O (supports .xlsx format only)
- **PyJWT 2.8.0**: Note - newer versions return string directly from encode()
- **Python version**: 3.14.0 (ensure compatibility)

## React Dependencies Notes
- **React 18.2.0**: Uses new root API (createRoot)
- **react-scripts 5.0.1**: CRA version (no eject yet)
- **html2canvas 1.4.1**: For PNG export of tables
- **react-router-dom 7.9.5**: Installed but NOT currently used (manual navigation instead)

## Quick Reference: Adding a New Page

1. Create page component in `frontend/src/pages/NewPage.js`
2. Add case to renderPage() switch in App.js
3. Add navigation item to navbar in App.js
4. Import the component at top of App.js
5. Test navigation works correctly

## Quick Reference: Adding a New API Endpoint

1. Define route in backend/app.py with @app.route decorator
2. Add endpoint to API_URL base in frontend components
3. Implement fetch call in React component
4. Handle success/error responses
5. Test with frontend UI and check Flask logs
