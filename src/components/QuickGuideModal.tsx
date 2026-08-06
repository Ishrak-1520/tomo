import React from 'react';
import { X, MessageCircle, Navigation, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuickGuideModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    },
    modal: {
      backgroundColor: 'var(--bg-color)',
      borderRadius: '24px',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      position: 'relative' as const,
    },
    header: {
      padding: '2rem 2rem 1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid var(--border-main)',
      position: 'sticky' as const,
      top: 0,
      backgroundColor: 'var(--bg-color)',
      zIndex: 10,
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: 'var(--text-main)',
      margin: 0,
      letterSpacing: '-0.02em',
    },
    closeBtn: {
      background: 'var(--bg-surface-hover)',
      border: 'none',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      padding: '0.5rem',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    content: {
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '2.5rem',
    },
    section: {
      display: 'flex',
      gap: '1.5rem',
      alignItems: 'flex-start',
    },
    iconWrapper: {
      width: '48px',
      height: '48px',
      borderRadius: '16px',
      backgroundColor: 'rgba(129, 152, 138, 0.1)', // Accent light
      color: 'var(--accent-main)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    sectionTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: 'var(--text-main)',
      marginBottom: '0.5rem',
    },
    sectionText: {
      fontSize: '0.95rem',
      color: 'var(--text-muted)',
      lineHeight: '1.6',
      margin: 0,
    },
  };

  return (
    <AnimatePresence>
      <motion.div 
        style={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          style={styles.modal}
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.header}>
            <h2 style={styles.title}>how to use tomo</h2>
            <button 
              onClick={onClose} 
              style={styles.closeBtn}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--border-main)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
            >
              <X size={20} />
            </button>
          </div>

          <div style={styles.content}>
            <div style={styles.section}>
              <div style={styles.iconWrapper}>
                <MessageCircle size={24} />
              </div>
              <div>
                <h3 style={styles.sectionTitle}>Classic Session</h3>
                <p style={styles.sectionText}>
                  An open, unstructured space. You guide the conversation. Perfect for when you just need to vent, brain-dump, or process your thoughts out loud with a non-judgmental listener.
                </p>
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.iconWrapper}>
                <Navigation size={24} />
              </div>
              <div>
                <h3 style={styles.sectionTitle}>Guided Session</h3>
                <p style={styles.sectionText}>
                  Tomo takes the wheel. If you're feeling overwhelmed but don't know where to start, Tomo will gently ask thoughtful questions to help untangle your feelings step by step.
                </p>
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.iconWrapper}>
                <Shield size={24} />
              </div>
              <div>
                <h3 style={styles.sectionTitle}>Total Privacy</h3>
                <p style={styles.sectionText}>
                  Tomo remembers details from past sessions to build meaningful context over time. However, your data is completely encrypted and is <strong>never</strong> used to train public AI models. Your quiet space belongs only to you.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
