'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MessageCircle, Clock, BarChart2, User, Settings, Moon, Sun, LogOut, Menu } from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [theme, setTheme] = useState('light');
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem('tomo_theme') || 'light';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('tomo_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem('tomo_device_id');
    router.push('/');
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItemStyle = {
    padding: '1rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    borderRadius: '12px',
    marginBottom: '1rem',
    transition: 'all 0.2s',
    cursor: 'pointer'
  };

  return (
    <>
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute', top: '1rem', left: '1rem', zIndex: 50,
            background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
          }}
        >
          <Menu size={24} />
        </button>
      )}

      {isMobile && isOpen && (
        <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 30 }} />
      )}

      <div 
        style={{
          position: isMobile ? 'fixed' : 'relative',
          top: 0, left: 0, bottom: 0,
          width: '80px',
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-main)',
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          zIndex: 40,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '2rem 0'
        }}
      >
        {/* Logo Icon */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'serif', fontStyle: 'italic', fontSize: '1.2rem' }}>t</div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <a href="/chat" title="Current Chat" style={navItemStyle} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--nav-hover-text)'; e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)' }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}>
            <MessageCircle size={22} strokeWidth={2} />
          </a>
          <a href="/history" title="History" style={navItemStyle} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--nav-hover-text)'; e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)' }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}>
            <Clock size={22} strokeWidth={2} />
          </a>
          <a href="/insights" title="Insights" style={navItemStyle} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--nav-hover-text)'; e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)' }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}>
            <BarChart2 size={22} strokeWidth={2} />
          </a>
        </nav>

        {/* User Menu at Bottom */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: showUserMenu ? 'var(--text-main)' : 'var(--text-muted)',
              padding: '0.5rem', borderRadius: '12px', transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
            onMouseOut={(e) => { if(!showUserMenu) e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <User size={24} strokeWidth={2} />
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute', bottom: '10px', left: '60px',
              backgroundColor: 'var(--menu-bg)', color: 'var(--menu-text)',
              borderRadius: '12px', width: '160px', padding: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 100, display: 'flex', flexDirection: 'column'
            }}>
              <a href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', color: 'var(--menu-text)', padding: '0.75rem', cursor: 'pointer', textAlign: 'left', borderRadius: '8px', fontSize: '0.9rem', textDecoration: 'none' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--menu-hover)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Settings size={16} /> settings
              </a>
              <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: 'var(--menu-text)', padding: '0.75rem', cursor: 'pointer', textAlign: 'left', borderRadius: '8px', fontSize: '0.9rem' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--menu-hover)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} 
                  theme
                </div>
              </button>
              <div style={{ height: '1px', backgroundColor: 'var(--menu-divider)', margin: '0.25rem 0' }} />
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', color: 'var(--menu-text)', padding: '0.75rem', cursor: 'pointer', textAlign: 'left', borderRadius: '8px', fontSize: '0.9rem' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--menu-hover)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <LogOut size={16} /> log out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
