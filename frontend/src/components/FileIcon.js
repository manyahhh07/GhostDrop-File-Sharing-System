import React from 'react';
import { getFileType, getFileLabel } from '../utils/helpers';

export default function FileIcon({ name, size = 'normal' }) {
  const type = getFileType(name);
  const label = getFileLabel(name);
  const cls = size === 'large' ? 'file-icon-large' : 'file-icon';

  return (
    <div className={`${cls} ${type}`}>
      {label}
    </div>
  );
}