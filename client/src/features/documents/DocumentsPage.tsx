import { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface DocItem {
  id: string;
  name: string;
  type: string;
  fileSize: number | null;
  mimeType: string | null;
  verified: boolean;
  uploadedAt: string;
}

const DOC_TYPES = [
  { value: 'ID_PROOF', label: 'ID Proof' },
  { value: 'ADDRESS_PROOF', label: 'Address Proof' },
  { value: 'EDUCATION', label: 'Education Certificate' },
  { value: 'OFFER_LETTER', label: 'Offer Letter' },
  { value: 'EXPERIENCE_LETTER', label: 'Experience Letter' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'AADHAR_CARD', label: 'Aadhar Card' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'OTHER', label: 'Other' },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('ID_PROOF');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = async () => {
    try {
      const empId = user?.employee?.id;
      if (!empId) return;
      const res = await api.get(`/documents`);
      setDocuments(res.data.data || []);
    } catch {
      console.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !docName) {
      setMessage('Please provide document name and select a file');
      return;
    }

    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', docName);
      formData.append('type', docType);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('Document uploaded successfully!');
      setDocName('');
      setDocType('ID_PROOF');
      setShowUpload(false);
      if (fileRef.current) fileRef.current.value = '';
      await loadDocuments();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div><p>Loading documents...</p></div>;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>My Documents</h1>
          <p>Upload and manage your identity and employment documents</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? '✕ Cancel' : '📁 Upload Document'}
        </button>
      </div>

      {message && <p className={message.includes('failed') || message.includes('Please') ? 'error-message' : 'success-message'} style={{ marginBottom: 'var(--space-4)' }}>{message}</p>}

      {showUpload && (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="card-header">
            <div>
              <div className="eyebrow">Upload</div>
              <div className="card-header-title">New Document</div>
            </div>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Document Name</label>
                <input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. Aadhar Card Front" />
              </div>
              <div className="form-group">
                <label className="form-label">Document Type</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Select File</label>
              <input type="file" ref={fileRef} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              <div className="form-hint">Accepted: PDF, JPG, PNG, DOC (max 5MB)</div>
            </div>
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : '⬆️ Upload'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="eyebrow">Files</div>
            <div className="card-header-title">Uploaded Documents ({documents.length})</div>
          </div>
        </div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          {documents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <h3>No documents uploaded</h3>
              <p>Click "Upload Document" to add your ID proofs, certificates, and other documents.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600 }}>📄 {doc.name}</td>
                    <td><span className="badge badge-neutral">{doc.type.replace(/_/g, ' ')}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{formatSize(doc.fileSize)}</td>
                    <td>
                      <span className={`badge ${doc.verified ? 'badge-success badge-dot' : 'badge-warning badge-dot'}`}>
                        {doc.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
