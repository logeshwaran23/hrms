import { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/auth/me').then(r => { setProfile(r.data.user); setForm(r.data.user.employee || {}); });
  }, []);

  const handleSave = async () => {
    try {
      await api.patch('/employees/profile', { phone: form.phone, address: form.address, city: form.city, state: form.state, pincode: form.pincode, emergencyContact: form.emergencyContact, emergencyPhone: form.emergencyPhone, bankName: form.bankName, bankAccount: form.bankAccount, ifscCode: form.ifscCode });
      setMessage('Profile updated!'); setEditing(false);
      api.get('/auth/me').then(r => {
        setProfile(r.data.user);
        useAuthStore.getState().updateUser(r.data.user);
      });
    } catch { setMessage('Failed to update'); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploading(true);
    try {
      const res = await api.post('/employees/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Profile photo updated!');
      api.get('/auth/me').then(r => {
        setProfile(r.data.user);
        useAuthStore.getState().updateUser(r.data.user);
      });
    } catch {
      setMessage('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  if (!profile) return <div className="loading-page"><div className="spinner"></div></div>;

  const emp = profile.employee;
  const Field = ({ label, value }: { label: string; value: any }) => (
    <div style={{ marginBottom: 'var(--space-4)' }}><div className="form-label">{label}</div><div style={{ fontSize: '0.9rem' }}>{value || '—'}</div></div>
  );

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header"><h1>My Profile</h1><p>View and manage your personal information</p></div>
        <button className={`btn ${editing ? 'btn-success' : 'btn-primary'}`} onClick={editing ? handleSave : () => setEditing(true)}>{editing ? 'Save Changes' : 'Edit Profile'}</button>
      </div>
      {message && <p className="success-message" style={{ marginBottom: 'var(--space-4)' }}>{message}</p>}
      <div className="two-col-grid">
        <div className="card"><div className="card-header"><div><div className="eyebrow">Personal</div><div className="card-header-title">Basic Information</div></div></div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div 
                className="topbar-avatar" 
                style={{ 
                  width: 64, height: 64, fontSize: '1.5rem', 
                  cursor: 'pointer', position: 'relative', overflow: 'hidden'
                }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload new photo"
              >
                {isUploading ? (
                  <div className="spinner" style={{ width: 24, height: 24, borderLeftColor: '#fff' }}></div>
                ) : emp?.avatar ? (
                  <img src={emp.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  emp?.firstName?.charAt(0)
                )}
                {/* Hover overlay hint (optional, but good UX) */}
                <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.5)', width: '100%', textAlign: 'center', padding: '2px 0', fontSize: '10px', color: '#fff' }}>
                  Edit
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleAvatarChange} 
              />
              <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{emp?.firstName} {emp?.lastName}</div><div style={{ color: 'var(--text-secondary)' }}>{emp?.employeeCode}</div></div>
            </div>
            <Field label="Email" value={emp?.email} />
            <Field label="Department" value={emp?.department?.name} />
            <Field label="Designation" value={emp?.designation?.name} />
            <Field label="Date of Joining" value={emp?.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : null} />
            <Field label="Manager" value={emp?.manager?.name} />
            <Field label="Role" value={profile.role?.name} />
          </div>
        </div>
        <div className="card"><div className="card-header"><div><div className="eyebrow">Contact</div><div className="card-header-title">Contact & Bank Details</div></div></div>
          <div className="card-body">
            {editing ? (
              <>
                <div className="form-group"><label className="form-label">Phone</label><input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Address</label><input value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})} /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">City</label><input value={form.city||''} onChange={e=>setForm({...form,city:e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">State</label><input value={form.state||''} onChange={e=>setForm({...form,state:e.target.value})} /></div>
                </div>
                <div className="form-group"><label className="form-label">Emergency Contact</label><input value={form.emergencyContact||''} onChange={e=>setForm({...form,emergencyContact:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Bank Name</label><input value={form.bankName||''} onChange={e=>setForm({...form,bankName:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Bank Account</label><input value={form.bankAccount||''} onChange={e=>setForm({...form,bankAccount:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">IFSC Code</label><input value={form.ifscCode||''} onChange={e=>setForm({...form,ifscCode:e.target.value})} /></div>
              </>
            ) : (
              <>
                <Field label="Phone" value={emp?.phone} />
                <Field label="Address" value={[emp?.address, emp?.city, emp?.state, emp?.pincode].filter(Boolean).join(', ') || null} />
                <Field label="Emergency Contact" value={emp?.emergencyContact} />
                <Field label="Bank Name" value={emp?.bankName} />
                <Field label="Bank Account" value={emp?.bankAccount} />
                <Field label="IFSC Code" value={emp?.ifscCode} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
