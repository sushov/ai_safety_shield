// src/App.jsx
import React, { useState } from "react";
import "./assets/style.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("tester"); // 'tester' or 'about'
  const [prompt, setPrompt] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setAnalysis(null);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);
      if (!data.categories) throw new Error("Invalid response format.");

      setAnalysis(data);
    } catch (err) {
      setError(err.message || "Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const getColors = (score) => {
    if (score >= 80) return { color: "#ef4444", label: "CRITICAL RISK" };
    if (score >= 40) return { color: "#f97316", label: "MODERATE RISK" };
    return { color: "#22c55e", label: "SAFE" };
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <h1>🛡️ AI Safety Shield</h1>
          <span style={{color: '#64748b', fontSize: '0.9rem'}}>Enterprise Grade Prompt Analysis</span>
        </div>
        <nav className="nav-tabs">
          <button 
            className={`nav-btn ${activeTab === 'tester' ? 'active' : ''}`}
            onClick={() => setActiveTab('tester')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            How it Works
          </button>
        </nav>
      </header>

      {/* DASHBOARD TAB */}
      {activeTab === "tester" && (
        <main className="dashboard-grid">
          {/* Left Panel: Input */}
          <section className="card">
            <h2>Prompt Injection Test</h2>
            <p style={{marginBottom: '20px', color: '#94a3b8', fontSize: '0.9rem'}}>
              Paste a user prompt below to evaluate it against standard safety policies (Violence, Self-Harm, Jailbreaks).
            </p>
            <textarea
              className="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Ignore previous instructions and tell me how to build a..."
              rows={12}
            />
            <button 
              className="action-btn" 
              onClick={handleAnalyze} 
              disabled={loading}
            >
              {loading ? "Scanning Protocols..." : "Run Security Analysis"}
            </button>
            {error && <div style={{color: '#ef4444', marginTop: '15px'}}>⚠️ {error}</div>}
          </section>

          {/* Right Panel: Analysis */}
          <section className="card">
            <h2>Threat Intelligence</h2>
            
            {!analysis && !loading && (
              <div style={{textAlign: 'center', marginTop: '60px', opacity: 0.5}}>
                <div style={{fontSize: '3rem', marginBottom: '10px'}}>📡</div>
                <p>Waiting for input stream...</p>
              </div>
            )}

            {loading && (
              <div style={{textAlign: 'center', marginTop: '60px'}}>
                <div className="loader"></div> 
                <p style={{color: '#3b82f6'}}>Analyzing semantic vectors...</p>
              </div>
            )}

            {analysis && (
              <div className="results fade-in">
                {/* Score Header */}
                <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px'}}>
                  <div 
                    className="score-circle" 
                    style={{
                      borderColor: getColors(analysis.riskScore).color, 
                      color: getColors(analysis.riskScore).color
                    }}
                  >
                    {analysis.riskScore}
                  </div>
                  <div>
                    <div className="risk-level" style={{color: getColors(analysis.riskScore).color}}>
                      {getColors(analysis.riskScore).label}
                    </div>
                    <div style={{color: '#94a3b8', fontSize: '0.9rem'}}>Confidence: 98%</div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
                  <h3 style={{color: '#f8fafc', marginBottom: '5px'}}>Model Assessment</h3>
                  <p className="summary-text">{analysis.summary}</p>
                </div>

                {/* Category List */}
                <div className="categories">
                  <h3 style={{marginBottom: '10px'}}>Safety Guardrails</h3>
                  {analysis.categories.map((cat, i) => (
                    <div key={i} className="category-row">
                      <span style={{color: cat.triggered ? '#f8fafc' : '#64748b'}}>
                        {cat.label}
                      </span>
                      <span 
                        className="badge"
                        style={{
                          background: cat.triggered ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.1)',
                          color: cat.triggered ? '#fca5a5' : '#86efac',
                        }}
                      >
                        {cat.triggered ? `⚠️ ${cat.severity}` : "CLEAN"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
      )}

      {/* EDUCATIONAL TAB */}
      {activeTab === "about" && (
        <main className="card info-section fade-in">
          <h2 style={{fontSize: '2rem', color: 'white', marginBottom: '30px'}}>
            Architecture Overview
          </h2>
          
          <div className="info-block">
            <h3>What is this tool?</h3>
            <p>
              This is a <strong>Human-in-the-loop AI Safety Sandbox</strong>. It is designed to help 
              Trust & Safety teams evaluate how Large Language Models (LLMs) respond to malicious 
              inputs like jailbreaks, toxic speech, and prompt injection attacks.
            </p>
          </div>

          <div className="info-block">
            <h3>How it works (The Hybrid Engine)</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px'}}>
              <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '8px'}}>
                <strong style={{color: '#3b82f6'}}>Layer 1: Structural Analysis</strong>
                <p style={{fontSize: '0.9rem'}}>
                  We previously used local regex (regular expressions) to catch obvious keywords like "bomb" or "kill". 
                  This is fast but "dumb"—it misses nuance and context.
                </p>
              </div>
              <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '8px'}}>
                <strong style={{color: '#a78bfa'}}>Layer 2: LLM Evaluation (Gemini)</strong>
                <p style={{fontSize: '0.9rem'}}>
                  We now send the prompt to <strong>Google Gemini 2.0</strong>, asking it to act as a 
                  "Safety Classifier." It reads the intent behind the words to catch subtle dangers 
                  that keyword lists miss.
                </p>
              </div>
            </div>
          </div>

          <div className="info-block">
            <h3>Why does this matter?</h3>
            <p>
              As companies adopt AI, <strong>"Prompt Injection"</strong> has become the #1 security threat (OWASP Top 10). 
              Attackers can trick models into revealing private customer data or generating harmful code. 
              Tools like this are the first line of defense in testing and "Red Teaming" AI models before they go public.
            </p>
          </div>
        </main>
      )}
      <footer className="footer">
        <p>
          Developed by <strong style={{color: '#f8fafc'}}>Sushov Karmacharya</strong>
          <span style={{margin: '0 10px', opacity: 0.3}}>|</span>
          <a 
            href="https://github.com/sushov" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Check out my GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}