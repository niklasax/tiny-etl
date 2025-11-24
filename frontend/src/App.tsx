import React, { useState } from 'react';
import './App.css';
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
      alert(`File uploaded! ${response.rowCount} rows detected.`);
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
      alert(`Cleaned! ${response.originalProfile.rowCount} rows → ${response.cleanedRowCount} rows`);
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎯 Tiny ETL Studio</h1>
      
      <button 
        onClick={testBackendConnection}
        style={{ 
          padding: '8px 16px', 
          backgroundColor: '#6c757d', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        🔌 Test Backend Connection
      </button>

      {/* File Upload */}
      <div style={{ marginBottom: '20px', padding: '20px', border: '2px dashed #ccc', borderRadius: '8px' }}>
        <input 
          type="file" 
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        {file && <p style={{ marginTop: '10px', color: 'green' }}>
          ✓ Uploaded: {file.name} ({rowCount} rows, {headers.length} columns)
        </p>}
        {isUploading && <p style={{ color: 'blue' }}>Uploading...</p>}
      </div>

      {/* Cleaning Rules */}
      {fileId && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h2>🧹 Cleaning Rules</h2>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input 
                type="checkbox" 
                checked={cleaningRules.removeDuplicates}
                onChange={(e) => setCleaningRules({...cleaningRules, removeDuplicates: e.target.checked})}
              />
              {' '}Remove duplicate rows
            </label>
            
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input 
                type="checkbox" 
                checked={cleaningRules.removeEmptyRows}
                onChange={(e) => setCleaningRules({...cleaningRules, removeEmptyRows: e.target.checked})}
              />
              {' '}Remove empty rows
            </label>
            
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input 
                type="checkbox" 
                checked={cleaningRules.trimWhitespace}
                onChange={(e) => setCleaningRules({...cleaningRules, trimWhitespace: e.target.checked})}
              />
              {' '}Trim whitespace
            </label>
            
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Handle missing values:{' '}
              <select 
                value={cleaningRules.handleMissing}
                onChange={(e) => setCleaningRules({...cleaningRules, handleMissing: e.target.value as 'keep' | 'drop' | 'fill'})}
                style={{ marginLeft: '10px', padding: '4px' }}
              >
                <option value="keep">Keep as empty</option>
                <option value="drop">Drop rows with missing values</option>
                <option value="fill">Fill with "N/A"</option>
              </select>
            </label>
          </div>

          <button 
            onClick={handleCleanData}
            disabled={isCleaning}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: isCleaning ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginTop: '10px',
              opacity: isCleaning ? 0.6 : 1
            }}
          >
            {isCleaning ? 'Cleaning...' : 'Clean Data'}
          </button>

          <button 
            onClick={handleDownload}
            disabled={!cleanedProfile}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: !cleanedProfile ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginTop: '10px',
              marginLeft: '10px',
              opacity: !cleanedProfile ? 0.5 : 1
            }}
          >
            📥 Download Cleaned CSV
          </button>

          {/* Profiling Results */}
          {originalProfile && cleanedProfile && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
              <h3>📊 Cleaning Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4>Original Data:</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li>• Rows: {originalProfile.rowCount}</li>
                    <li>• Duplicates: {originalProfile.duplicates}</li>
                    <li>• Empty rows: {originalProfile.emptyRows}</li>
                    <li>• Missing values:
                      <ul style={{ marginLeft: '20px' }}>
                        {Object.entries(originalProfile.missingValues).map(([col, count]) => (
                          count > 0 && <li key={col}>{col}: {count}</li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4>Cleaned Data:</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li>• Rows: {cleanedProfile.rowCount}</li>
                    <li>• Duplicates: {cleanedProfile.duplicates}</li>
                    <li>• Empty rows: {cleanedProfile.emptyRows}</li>
                    <li>• Missing values:
                      <ul style={{ marginLeft: '20px' }}>
                        {Object.entries(cleanedProfile.missingValues).map(([col, count]) => (
                          count > 0 && <li key={col}>{col}: {count}</li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
