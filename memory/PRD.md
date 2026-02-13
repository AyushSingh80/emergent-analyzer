# Analytics Dashboard PRD

## Original Problem Statement
Build an advanced dashboard and analytics website that:
1. Takes a webhook URL (JSON data source) as input on the first page
2. Shows the complete data sheet on the next page with column selection options
3. Calculates and displays analytics (basic and advanced) on selected columns
4. Allows users to choose chart types for columns using Recharts
5. Provides functionality to compare different charts

## User Choices
- **Data Source**: Accept any webhook URL that returns JSON data
- **Chart Library**: Recharts
- **Analytics**: Both basic (sum, avg, min, max, count) and advanced (std dev, percentiles)
- **Authentication**: No authentication (public access)
- **Design**: Dark terminal/command center theme

## Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with async MongoDB (Motor)
- **Database**: MongoDB for session storage
- **Endpoints**:
  - `POST /api/fetch-data` - Fetch JSON from webhook URL
  - `GET /api/session/:id` - Get session details
  - `GET /api/session/:id/data` - Get paginated data
  - `POST /api/analyze` - Calculate statistics on columns
  - `GET /api/session/:id/analytics` - Get stored analytics
  - `DELETE /api/session/:id` - Delete session

### Frontend (React)
- **Framework**: React with React Router
- **UI Library**: Shadcn/UI components
- **Charts**: Recharts (Bar, Line, Area, Pie)
- **Styling**: Tailwind CSS with custom dark theme

### Pages
1. **Landing Page** (`/`) - Webhook URL input
2. **Data Preview** (`/preview/:sessionId`) - Data table with column selection
3. **Dashboard** (`/dashboard/:sessionId`) - Charts and analytics
4. **Comparison** (`/compare/:sessionId`) - Side-by-side chart comparison

## What's Been Implemented (Jan 2026)

### Backend Features
- ✅ Webhook data fetching with JSON parsing
- ✅ Automatic column type detection (numeric/categorical/date)
- ✅ Session management with MongoDB
- ✅ Paginated data retrieval
- ✅ Comprehensive statistics calculation:
  - Basic: count, sum, mean, median, min, max
  - Advanced: std dev, variance, percentiles (25, 50, 75, 90)
  - Categorical: value counts, mode, unique count
- ✅ Distribution data for chart visualization
- ✅ Error handling for invalid URLs and data

### Frontend Features
- ✅ Dark terminal-style UI with grid lines background
- ✅ Webhook URL input with validation
- ✅ Full data table with column visibility toggle
- ✅ Column selection badges with type indicators
- ✅ Pagination controls
- ✅ Multiple chart types (Bar, Line, Area, Pie)
- ✅ Chart type selector per column
- ✅ KPI cards with averages/unique values
- ✅ Statistics panel with all metrics
- ✅ Chart comparison view with:
  - Column selectors
  - Chart type selectors
  - Sync tooltips toggle
  - Swap charts functionality

## P0 Features (Complete)
- [x] Webhook URL input and data fetching
- [x] Data preview with pagination
- [x] Column selection for analysis
- [x] Basic and advanced statistics
- [x] Multiple chart visualizations
- [x] Chart comparison functionality

## P1 Features (Backlog)
- [ ] Export analytics as PDF/CSV
- [ ] Save dashboard configurations
- [ ] Real-time data refresh
- [ ] Custom date range filtering
- [ ] Data transformation options

## P2 Features (Future)
- [ ] User authentication
- [ ] Saved sessions history
- [ ] Collaborative sharing
- [ ] Custom chart colors
- [ ] Alert thresholds

## Next Action Items
1. Add export functionality (PDF/CSV)
2. Implement dashboard save/load
3. Add date range filtering for time-series data
4. Consider adding trend analysis
