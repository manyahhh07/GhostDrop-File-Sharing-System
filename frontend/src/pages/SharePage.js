import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { formatSize, formatDate } from '../utils/helpers';
import FileIcon from '../components/FileIcon';
import ExpiryBadge from '../components/ExpiryBadge';

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function SharePage() {
  const { shareId } = useParams();
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getFile(shareId);
        setFile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shareId]);

  return (
    <div className="share-page">
      <div className="share-card">
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--ink)', borderColor: 'var(--border)', width: 24, height: 24 }} />
            <p style={{ marginTop: 16, color: 'var(--ink-soft)', fontSize: 13 }}>Loading file…</p>
          </div>
        )}

        {error && (
          <div className="expired-state">
            <div className="expired-icon">
              <ClockIcon />
            </div>
            <div className="expired-title">Link unavailable</div>
            <div className="expired-sub">
              This file has expired or no longer exists.
            </div>
            <Link to="/" className="back-link">← Upload a new file</Link>
          </div>
        )}

        {file && (
          <>
            <FileIcon name={file.fileName} size="large" />

            <h2>{file.fileName}</h2>
            <p className="share-subtitle">Ready to download</p>

            <div className="share-meta-grid">
              <div className="share-meta-box">
                <div className="meta-label">Size</div>
                <div className="meta-value">{formatSize(file.size)}</div>
              </div>
              <div className="share-meta-box">
                <div className="meta-label">Downloads</div>
                <div className="meta-value">{file.downloads}</div>
              </div>
              <div className="share-meta-box">
                <div className="meta-label">Uploaded</div>
                <div className="meta-value" style={{ fontSize: 12.5 }}>{formatDate(file.uploadedAt)}</div>
              </div>
              <div className="share-meta-box">
                <div className="meta-label">Expires</div>
                <ExpiryBadge expiresAt={file.expiresAt} />
              </div>
            </div>

            <a
              href={api.downloadUrl(shareId)}
              className="download-main-btn"
              download
            >
              <DownloadIcon />
              Download File
            </a>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Link to="/" className="back-link">
                Share your own file →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}