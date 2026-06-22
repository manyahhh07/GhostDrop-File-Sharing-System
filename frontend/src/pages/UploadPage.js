import React, { useState, useRef, useCallback } from 'react';
import { api } from '../utils/api';
import { formatSize, getFileLabel, getFileType } from '../utils/helpers';
import ExpiryBadge from '../components/ExpiryBadge';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { copyToClipboard } from '../utils/helpers';

const EXPIRY_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '24 hours', value: 1440 },
  { label: '7 days', value: 10080 },
];

// SVG icons inline for zero dependency
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    <polyline points="16 12 12 8 8 12" />
    <line x1="12" y1="8" x2="12" y2="20" />
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiry, setExpiry] = useState(60);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);
  const { toast, showToast } = useToast();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const data = await api.upload(selectedFile, expiry, setProgress);
      setResult(data);
      setSelectedFile(null);
    } catch (err) {
      showToast(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await copyToClipboard(result.shareUrl);
    setCopied(true);
    showToast('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const fileType = selectedFile ? getFileType(selectedFile.name) : '';
  const fileLabel = selectedFile ? getFileLabel(selectedFile.name) : '';

  return (
    <div className="app-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>Share files <em>securely</em></h1>
          <p>Upload, set an expiry, and share — your file self-destructs on time.</p>
        </div>

        <div className="upload-section">
          {/* Drop Zone */}
          <div
            className={`dropzone${dragging ? ' dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !selectedFile && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            <div className="drop-icon">
              <UploadIcon />
            </div>
            <div className="drop-title">
              {dragging ? 'Release to upload' : 'Drop a file here'}
            </div>
            <div className="drop-sub">
              or <span>click to browse</span> — max 50 MB
            </div>
          </div>

          {/* Selected File Preview */}
          {selectedFile && (
            <div className="selected-file-preview">
              <div className={`preview-icon ${fileType}`}>{fileLabel}</div>
              <div className="preview-info">
                <div className="preview-name">{selectedFile.name}</div>
                <div className="preview-size">{formatSize(selectedFile.size)}</div>
              </div>
              <button className="preview-remove" onClick={() => setSelectedFile(null)}>
                <CloseIcon />
              </button>
            </div>
          )}

          {/* Expiry Selector */}
          <div className="expiry-row">
            <span className="expiry-label">Expires in</span>
            <div className="expiry-options">
              {EXPIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`expiry-btn${expiry === opt.value ? ' active' : ''}`}
                  onClick={() => setExpiry(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Button */}
          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <span className="spinner" />
                Uploading…
              </>
            ) : (
              <>
                <UploadIcon />
                Upload & Generate Link
              </>
            )}
          </button>

          {/* Progress */}
          {uploading && (
            <div className="progress-wrap">
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-text">{progress}%</div>
            </div>
          )}

          {/* Success Card */}
          {result && (
            <div className="success-card">
              <div className="success-header">
                <div className="success-dot" />
                <h3>File uploaded successfully</h3>
              </div>

              <div className="link-row">
                <span className="link-text">{result.shareUrl}</span>
                <button
                  className={`copy-btn${copied ? ' copied' : ''}`}
                  onClick={handleCopy}
                >
                  {copied ? '✓ Copied' : 'Copy Link'}
                </button>
              </div>

              <div className="success-meta">
                <div className="meta-item">
                  <span className="meta-label">File</span>
                  <span className="meta-value">{result.fileName}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Expires</span>
                  <ExpiryBadge expiresAt={result.expiresAt} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="container">
          <p>GhostDrop · Secure File Sharing · Files self-destruct after expiry</p>
        </div>
      </footer>

      <Toast message={toast} />
    </div>
  );
}