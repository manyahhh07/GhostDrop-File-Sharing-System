const BASE = 'http://localhost:5000';

export const api = {
  // Upload a file with optional expiry
  upload: async (file, expiryMinutes, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    form.append('expiryMinutes', String(expiryMinutes));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE}/upload`);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(JSON.parse(xhr.responseText)?.error || 'Upload failed'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.send(form);
    });
  },

  // Get file metadata by shareId
  getFile: async (shareId) => {
    const res = await fetch(`${BASE}/file/${shareId}`);
    if (!res.ok) throw new Error((await res.json()).error || 'File not found');
    return res.json();
  },

  // Get all files
  listFiles: async () => {
    const res = await fetch(`${BASE}/files`);
    if (!res.ok) throw new Error('Failed to load files');
    return res.json();
  },

  // Delete a file
  deleteFile: async (shareId) => {
    const res = await fetch(`${BASE}/file/${shareId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete file');
    return res.json();
  },

  // Get download URL
  downloadUrl: (shareId) => `${BASE}/download/${shareId}`,
};