import { Check, AlertTriangle, X } from 'lucide-react';
import { PuffLoader } from './Spinners';

/**
 * Transaction Preview Modal - shared between Swap and NFT actions
 * @param {boolean} isDark - Theme
 * @param {boolean} simulating - Show loading state
 * @param {object} preview - { status: 'success'|'warning'|'error', title, description, error, engineResult }
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm handler (optional, only for success/warning)
 * @param {string} confirmLabel - Button label (default: "Confirm")
 * @param {string} confirmColor - Button color for success (default: "#3b82f6")
 * @param {React.ReactNode} children - Additional content
 */
export default function TxPreviewModal({
  isDark,
  simulating,
  preview,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  confirmColor = '#3b82f6',
  children
}) {
  if (!simulating && !preview) return null;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.92)',
    backdropFilter: 'blur(4px)'
  };

  const modalStyle = {
    width: '100%',
    maxWidth: '340px',
    margin: '0 16px',
    padding: '20px',
    borderRadius: '16px',
    background: isDark ? '#000' : '#fff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  };

  const closeButtonStyle = {
    padding: '6px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
  };

  const iconContainerStyle = (color) => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  });

  const titleStyle = {
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 600,
    color: isDark ? '#fff' : '#111',
    marginBottom: '6px'
  };

  const descStyle = {
    textAlign: 'center',
    fontSize: '13px',
    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    marginBottom: '16px'
  };

  const errorBoxStyle = {
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '16px',
    background: 'rgba(239,68,68,0.08)'
  };

  const warningBoxStyle = {
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '16px',
    background: 'rgba(245,158,11,0.08)'
  };

  const buttonRowStyle = {
    display: 'flex',
    gap: '10px'
  };

  const cancelButtonStyle = {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    background: 'transparent',
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer'
  };

  const confirmButtonStyle = (color, disabled) => ({
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    background: disabled ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : color,
    color: disabled ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)') : '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer'
  });

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
            Preview · No funds sent yet
          </span>
          <button style={closeButtonStyle} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {simulating ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <PuffLoader size={40} color="#3b82f6" />
            <p style={{ marginTop: '12px', fontSize: '13px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              Simulating transaction...
            </p>
          </div>
        ) : preview && (
          <>
            {/* Status Icon */}
            {preview.status === 'success' && (
              <div style={iconContainerStyle('#22c55e')}>
                <Check size={24} color="#22c55e" />
              </div>
            )}
            {preview.status === 'warning' && (
              <div style={iconContainerStyle('#f59e0b')}>
                <AlertTriangle size={24} color="#f59e0b" />
              </div>
            )}
            {preview.status === 'error' && (
              <div style={iconContainerStyle('#ef4444')}>
                <AlertTriangle size={24} color="#ef4444" />
              </div>
            )}

            {/* Title */}
            <h3 style={titleStyle}>{preview.title}</h3>

            {/* Description */}
            {preview.description && <p style={descStyle}>{preview.description}</p>}

            {/* Error Box */}
            {preview.status === 'error' && preview.error && (
              <div style={errorBoxStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertTriangle size={16} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', marginBottom: '2px' }}>
                      {preview.engineResult}
                    </p>
                    <p style={{ fontSize: '11px', color: 'rgba(239,68,68,0.8)' }}>{preview.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning Box */}
            {preview.status === 'warning' && preview.warning && (
              <div style={warningBoxStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertTriangle size={16} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ fontSize: '12px', color: '#f59e0b' }}>{preview.warning}</p>
                </div>
              </div>
            )}

            {/* Custom content */}
            {children}

            {/* Buttons */}
            <div style={buttonRowStyle}>
              <button style={cancelButtonStyle} onClick={onClose}>Cancel</button>
              {preview.status !== 'error' && onConfirm && (
                <button style={confirmButtonStyle(confirmColor, false)} onClick={onConfirm}>
                  {confirmLabel}
                </button>
              )}
              {preview.status === 'error' && (
                <button style={confirmButtonStyle('#666', true)} disabled>
                  Cannot Execute
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
