import React, { useState } from 'react';
import { healthCheck, uploadCSV, cleanCSV, downloadCSV, CleaningRules, DataProfile } from './api';

interface CsvRow {
  [key: string]: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState<number>(0);
  const [cleaningRules, setCleaningRules] = useState<CleaningRules>({
    removeDuplicates: false,
    removeEmptyRows: false,
    trimWhitespace: false,
    handleMissing: 'keep',
  });
  const [originalProfile, setOriginalProfile] = useState<DataProfile | null>(null);
  const [cleanedProfile, setCleanedProfile] = useState<DataProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const testBackendConnection = async () => {
    try {
      const result = await healthCheck();
      alert(`Backend connection successful! ${result.message}`);
    } catch (error) {
      alert('Backend connection failed. Make sure backend is running on port 3000');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setFile(uploadedFile);
    setIsUploading(true);
    setOriginalProfile(null);
    setCleanedProfile(null);

    try {
      const response = await uploadCSV(uploadedFile);
      setFileId(response.fileId);
      setHeaders(response.headers);
      setRowCount(response.rowCount);
    } catch (error) {
      alert('Upload failed: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCleanData = async () => {
    if (!fileId) {
      alert('Please upload a file first');
      return;
    }

    setIsCleaning(true);

    try {
      const response = await cleanCSV(fileId, cleaningRules);
      setOriginalProfile(response.originalProfile);
      setCleanedProfile(response.cleanedProfile);
    } catch (error) {
      alert('Cleaning failed: ' + (error as Error).message);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleDownload = () => {
    if (!fileId) {
      alert('Please upload and clean a file first');
      return;
    }
    downloadCSV(fileId);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      fontFamily: '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#f1f5f9',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px),
          linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'slideGrid 20s linear infinite',
        pointerEvents: 'none'
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');
        
        @keyframes slideGrid {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .card {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(6, 182, 212, 0.2);
          borderRadius: 16px;
          padding: 32px;
          boxShadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          transition: all 0.3s ease;
        }
        
        .card:hover {
          borderColor: rgba(6, 182, 212, 0.4);
          boxShadow: 0 20px 60px rgba(6, 182, 212, 0.1);
        }
        
        .btn {
          padding: 14px 32px;
          borderRadius: 8px;
          border: none;
          fontWeight: 600;
          fontSize: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          textTransform: uppercase;
          letterSpacing: 0.5px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: #0f172a;
          boxShadow: 0 4px 20px rgba(6, 182, 212, 0.3);
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          boxShadow: 0 6px 30px rgba(6, 182, 212, 0.5);
        }
        
        .btn-secondary {
          background: transparent;
          border: 2px solid #06b6d4;
          color: #06b6d4;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background: rgba(6, 182, 212, 0.1);
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .checkbox-label {
          display: flex;
          alignItems: center;
          gap: 12px;
          padding: 12px;
          borderRadius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .checkbox-label:hover {
          background: rgba(6, 182, 212, 0.05);
        }
        
        input[type="checkbox"] {
          width: 20px;
          height: 20px;
          accentColor: #06b6d4;
          cursor: pointer;
        }
        
        .upload-zone {
          border: 2px dashed rgba(6, 182, 212, 0.3);
          borderRadius: 12px;
          padding: 48px 32px;
          textAlign: center;
          transition: all 0.3s ease;
          background: rgba(6, 182, 212, 0.02);
        }
        
        .upload-zone:hover {
          borderColor: #06b6d4;
          background: rgba(6, 182, 212, 0.05);
        }
        
        .stat-card {
          background: rgba(6, 182, 212, 0.1);
          borderLeft: 4px solid #06b6d4;
          padding: 20px;
          borderRadius: 8px;
        }
      `}</style>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 24px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div className="fade-in-up" style={{ marginBottom: '60px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '64px',
            fontWeight: 700,
            margin: 0,
            background: 'linear-gradient(135deg, #06b6d4 0%, #67e8f9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-2px'
          }}>
            TINY ETL STUDIO
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#94a3b8',
            marginTop: '16px',
            fontWeight: 400
          }}>
            Data Cleaning & Transformation Platform
          </p>
          
          <button 
            onClick={testBackendConnection}
            className="btn btn-secondary"
            style={{ marginTop: '24px' }}
          >
            🔌 Test Connection
          </button>
        </div>

        {/* File Upload */}
        <div className="card fade-in-up" style={{ marginBottom: '32px', animationDelay: '0.1s' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 600, 
            marginTop: 0, 
            marginBottom: '24px',
            color: '#06b6d4'
          }}>
            1. Upload Data
          </h2>
          
          <div className="upload-zone">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                {isUploading ? 'Uploading...' : 'Click or drag CSV file here'}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                Support for CSV files up to 10MB
              </div>
            </label>
          </div>

          {file && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(6, 182, 212, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{file.name}</div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  {rowCount} rows × {headers.length} columns
                </div>
              </div>
              <div style={{
                background: '#06b6d4',
                color: '#0f172a',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600
              }}>
                ✓ Ready
              </div>
            </div>
          )}
        </div>

        {/* Cleaning Rules */}
        {fileId && (
          <div className="card fade-in-up" style={{ marginBottom: '32px', animationDelay: '0.2s' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 600, 
              marginTop: 0, 
              marginBottom: '24px',
              color: '#06b6d4'
            }}>
              2. Configure Cleaning Rules
            </h2>
            
            <div style={{ display: 'grid', gap: '8px', marginBottom: '32px' }}>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={cleaningRules.removeDuplicates}
                  onChange={(e) => setCleaningRules({...cleaningRules, removeDuplicates: e.target.checked})}
                />
                <span style={{ fontSize: '16px' }}>Remove duplicate rows</span>
              </label>
              
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={cleaningRules.removeEmptyRows}
                  onChange={(e) => setCleaningRules({...cleaningRules, removeEmptyRows: e.target.checked})}
                />
                <span style={{ fontSize: '16px' }}>Remove empty rows</span>
              </label>
              
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={cleaningRules.trimWhitespace}
                  onChange={(e) => setCleaningRules({...cleaningRules, trimWhitespace: e.target.checked})}
                />
                <span style={{ fontSize: '16px' }}>Trim whitespace</span>
              </label>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>Handle missing values:</span>
                <select 
                  value={cleaningRules.handleMissing}
                  onChange={(e) => setCleaningRules({...cleaningRules, handleMissing: e.target.value as 'keep' | 'drop' | 'fill'})}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    background: 'rgba(6, 182, 212, 0.05)',
                    color: '#f1f5f9',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="keep">Keep as empty</option>
                  <option value="drop">Drop rows with missing values</option>
                  <option value="fill">Fill with "N/A"</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={handleCleanData}
                disabled={isCleaning}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {isCleaning ? '⚙️ Cleaning...' : '✨ Clean Data'}
              </button>

              <button 
                onClick={handleDownload}
                disabled={!cleanedProfile}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                📥 Download Cleaned CSV
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {originalProfile && cleanedProfile && (
          <div className="card fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 600, 
              marginTop: 0, 
              marginBottom: '24px',
              color: '#06b6d4'
            }}>
              3. Cleaning Results
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginTop: 0, 
                  marginBottom: '16px',
                  color: '#94a3b8'
                }}>
                  Original Data
                </h3>
                <div className="stat-card" style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#06b6d4' }}>
                    {originalProfile.rowCount}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Total Rows</div>
                </div>
                <div className="stat-card" style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#f87171' }}>
                    {originalProfile.duplicates}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Duplicate Rows</div>
                </div>
                <div className="stat-card">
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#fbbf24' }}>
                    {originalProfile.emptyRows}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Empty Rows</div>
                </div>
              </div>

              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginTop: 0, 
                  marginBottom: '16px',
                  color: '#94a3b8'
                }}>
                  Cleaned Data
                </h3>
                <div className="stat-card" style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>
                    {cleanedProfile.rowCount}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Total Rows</div>
                </div>
                <div className="stat-card" style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#10b981' }}>
                    {cleanedProfile.duplicates}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Duplicate Rows</div>
                </div>
                <div className="stat-card">
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#10b981' }}>
                    {cleanedProfile.emptyRows}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Empty Rows</div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', fontWeight: 700, color: '#10b981', marginBottom: '8px' }}>
                {originalProfile.rowCount - cleanedProfile.rowCount}
              </div>
              <div style={{ fontSize: '18px', color: '#94a3b8' }}>
                Rows Cleaned Successfully
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
