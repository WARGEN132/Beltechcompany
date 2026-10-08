import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('root')!;

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// На пререндеренных страницах в #root уже лежит готовый HTML — подхватываем его.
// На spa.html (корзина, товары без своего HTML) #root пустой — рисуем с нуля.
if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}