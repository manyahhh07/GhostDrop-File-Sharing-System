import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { formatSize, formatDate, copyToClipboard } from '../utils/helpers';
import FileIcon from '../components/FileIcon';
import ExpiryBadge from '../components/ExpiryBadge';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

// Icons
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const InboxIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
  </svg>
);

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();

  const loadFiles = useCallback(async () => {
    try {
      const data = await api.listFiles();
      setFiles(data);
    } catch {
      showToast('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadFiles();
    // Refresh every 30s
    const id = setInterval(loadFiles, 30000);
    return () => clearInterval(id);
  }, [loadFiles]);

  const handleDelete = async (shareId, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteFile(shareId);
      setFiles((prev) => prev.filter((f) => f.shareId !== shareId));
      showToast('File deleted');
    } catch {
      showToast('Failed to delete file');
    }
  };

  const handleCopyLink = async (shareId) => {
    const url = `http://localhost:3000/share/${shareId}`;
    await copyToClipboard(url);
    showToast('Link copied to clipboard');
  };

  return (
    <div className="app-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>Your <em>files</em></h1>
          <p>All active uploads — auto-refreshes every 30 seconds.</p>
        </div>

        <div className="files-section">
          <div className="section-title">
            Active Files
            <span className="section-count">
              {loading ? '…' : `${files.length} file${files.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>Loading files…</p>
            </div>
          ) : files.length === 0 ? (
            <div className="empty-state">
              <InboxIcon />
              <p>No active files — upload something to get started.</p>
            </div>
          ) : (
            <div className="files-grid">
              {files.map((file) => (
                <div className="file-card" key={file.shareId}>
                  <FileIcon name={file.fileName} />

                  <div className="file-info">
                    <div className="file-name">{file.fileName}</div>
                    <div className="file-meta-row">
                      <span className="file-size">{formatSize(file.size)}</span>
                      <span className="file-downloads">↓ {file.downloads}</span>
                      <ExpiryBadge expiresAt={file.expiresAt} />
                    </div>
                  </div>

                  <div className="file-actions">
                    <a
                      href={api.downloadUrl(file.shareId)}
                      className="action-btn download"
                      title="Download"
                      download
                    >
                      <DownloadIcon />
                    </a>

                    <button
                      className="action-btn copy-link"
                      title="Copy shareable link"
                      onClick={() => handleCopyLink(file.shareId)}
                    >
                      <LinkIcon />
                    </button>

                    <button
                      className="action-btn delete"
                      title="Delete file"
                      onClick={() => handleDelete(file.shareId, file.fileName)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
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