import { Routes, Route } from 'react-router-dom'
import './App.css'

export default function App() {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="brand">
            Deep<span className="accent">Finance</span>
          </h1>
        </div>
        <nav className="sidebar-nav">
          {/* Navigation items will be added here */}
        </nav>
      </aside>

      <main className="main-content">
        <header className="app-header">
          <h1>
            Deep<span className="accent">Finance</span>
          </h1>
        </header>

        <div className="content-wrapper">
          <Routes>
            <Route
              path="/"
              element={
                <div className="placeholder">
                  <p>Welcome to DeepFinance</p>
                  <p>Routes will be configured here</p>
                </div>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  )
}
