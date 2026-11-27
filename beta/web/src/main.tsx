import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/app.css';
import { ThemeProvider } from './lib/theme';
import { ErrorBoundary } from './components/ErrorBoundary';

// Routes are code-split, so the home page does not load every chart.
const HomePage = lazy(() => import('./pages/HomePage'));
const PaperPage = lazy(() => import('./pages/PaperPage'));
const AuthorPage = lazy(() => import('./pages/AuthorPage'));
const InstitutionPage = lazy(() => import('./pages/InstitutionPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const InstitutionsIndex = lazy(() => import('./pages/InstitutionPage').then(m => ({ default: m.InstitutionsIndex })));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ErrorBoundary>
        <Suspense fallback={<div className="route-loading" role="status" aria-label="Loading" />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* DOIs contain slashes, so the paper route takes the rest of the path. */}
            <Route path="/paper/*" element={<PaperPage />} />
            <Route path="/author/:id" element={<AuthorPage />} />
            <Route path="/institutions" element={<InstitutionsIndex />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/institution/:id" element={<InstitutionPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
