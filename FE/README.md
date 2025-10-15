# Utility Billing Frontend (React + Vite)

Modern web interface for utility billing automation.

## Features

- React 18 with functional components and hooks
- Vite for fast development and building
- React Router for navigation
- Axios for API communication
- React Dropzone for file uploads
- React Toastify for notifications
- Lucide React for icons
- Responsive design

## Project Structure

```
FE/
├── src/
│   ├── components/
│   │   ├── Layout.jsx         # Main layout with navigation
│   │   └── FileUploader.jsx   # Drag-and-drop file uploader
│   ├── pages/
│   │   ├── Dashboard.jsx      # System status dashboard
│   │   ├── Upload.jsx         # File upload page
│   │   ├── Process.jsx        # Processing page
│   │   └── Results.jsx        # Results and downloads
│   ├── services/
│   │   └── api.js             # API client
│   ├── App.jsx                # Main app component
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── public/
├── package.json
├── vite.config.js
└── Dockerfile
```

## Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Building

```bash
# Production build
npm run build

# Output will be in dist/
```

## Docker

```bash
# Build image
docker build -t utility-billing-frontend .

# Run container
docker run -p 80:80 utility-billing-frontend
```

## Pages

### Dashboard
- System status overview
- Master data status
- Quick action links

### Upload Files
- Upload input files (utility readings)
- Upload master data files
- View and manage uploaded files

### Process
- View ready files
- Start processing
- View processing results and stats

### Results
- View generated output files
- Download ERP CSV files
- Download validation reports

## Customization

### Styling
- Modify CSS files in `src/` directories
- Global styles in `src/index.css`
- Component-specific styles in `src/components/*.css` and `src/pages/*.css`

### API Integration
- Update `src/services/api.js` to add/modify endpoints
- Base URL configured via environment variable

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
