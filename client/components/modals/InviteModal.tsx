import React, { useState } from 'react';
import { apiFetch } from '../../utils/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { loadState } from '../../store/localStorage';

interface InviteModalProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteModal({ boardId, isOpen, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const router = useRouter();
  const tokenFromRedux = useSelector((state: RootState) => state.auth.token);
  const token = tokenFromRedux ?? loadState()?.auth?.token ?? null;

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (!token) {
      toast.error("Please log in to invite members.");
      onClose();
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/invite', {
        method: 'POST',
        body: JSON.stringify({ email, boardId }),
        token
      });

      if (response && response.link) {
        setInviteLink(response.link);
        toast.success(response.message || 'Invite generated!');
      } else {
        toast.error('Failed to generate invite');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error generating invite');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
        <button className="modalClose" onClick={onClose}>✕</button>
        <div className="modalHeader">
          <h2 className="modalTitle">Invite to Workspace</h2>
          <p className="modalSubtitle">Share this workspace with others.</p>
        </div>
        
        <div className="modalBody">
          {!inviteLink ? (
            <form onSubmit={handleInvite}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>User Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#007bff', color: 'white' }}>
                  {loading ? 'Sending...' : 'Invite'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p>Invitation sent/created successfully!</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={inviteLink} 
                  style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
                />
                <button onClick={handleCopy} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#28a745', color: 'white' }}>
                  Copy
                </button>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
