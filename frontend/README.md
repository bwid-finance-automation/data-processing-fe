# Excel Comparison Frontend

Modern React + Vite + Tailwind CSS frontend for the Excel Summary Comparison API.

## Features

- ⚡ **Vite** - Lightning-fast dev server and build tool
- ⚛️ **React 18** - Modern React with hooks
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 📤 **Clear File Upload** - Separate inputs for Previous/Current month files
- 📊 **Statistics Display** - Real-time comparison results
- 📥 **Two Download Buttons** - Summary report + Highlighted file
- 📱 **Responsive Design** - Works on desktop and mobile
- ⚡ **Real-time Feedback** - Loading states and error handling

## Tech Stack

- **React 18.3** - UI framework
- **Vite 6.0** - Build tool and dev server
- **Tailwind CSS 4.1** - Utility-first CSS
- **Axios** - HTTP client for API calls

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:8000`

### Installation

```bash
cd frontend
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

Or use the startup script from the project root:

```bash
./start_frontend.sh
```

## Usage

1. **Select Previous Month File** (left card)
   - Click to upload the older Excel file

2. **Select Current Month File** (right card)
   - Click to upload the newer Excel file

3. **Click "Compare Files"**
   - Wait for processing (usually 5-30 seconds)

4. **View Results**
   - See statistics for new, updated, and unchanged rows
   - Download both output files

## File Order

**Important:** The order matters!

- **Previous Month** = The OLDER file (baseline)
- **Current Month** = The NEWER file (comparison target)

The tool compares: Current vs Previous

## Output Files

### 1. Summary Report
- Contains 3 sheets:
  - `new_rows`: New entries
  - `update_rows`: Changed entries
  - `summary`: Statistics

### 2. Highlighted File
- Original current month file with:
  - 🟡 Yellow rows: New entries
  - 🔵 Blue cells: Changed values

## Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## Configuration

### API URL

The frontend uses environment variables for API configuration:

- **Development**: `http://localhost:8000` (default)
- **Production**: Set `VITE_API_URL` in `.env` file

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=https://your-api-domain.com
```

### Vite Proxy

The `vite.config.js` has a proxy configured to forward `/api` requests to the backend during development.

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx          # Main application component
│   ├── index.css        # Tailwind directives
│   └── main.jsx         # React entry point
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── package.json         # Dependencies and scripts
```

## Troubleshooting

### CORS Errors
Make sure the backend API has CORS enabled for `http://localhost:5173`

### Files Not Uploading
- Check file size (backend may have limits)
- Ensure files are `.xlsx` or `.xls` format
- Make sure backend API is running

### Backend Connection Failed
- Verify backend is running: `http://localhost:8000/api/health`
- Check the proxy setting in `vite.config.js`

### Tailwind Styles Not Working
- Make sure PostCSS and Tailwind are installed
- Check that `@tailwind` directives are in `src/index.css`
- Try clearing cache: `rm -rf node_modules/.vite && npm run dev`

## Available Scripts

- `npm run dev` - Start development server (port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Performance

- **Fast Refresh** - Instant HMR (Hot Module Replacement) with Vite
- **Optimized Build** - Automatic code splitting and minification
- **Modern Bundle** - Uses native ES modules for faster loading

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
