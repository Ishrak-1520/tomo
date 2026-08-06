'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

type OnboardingData = {
  name: string;
  identity: string;
  dob: string;
  motherTongue: string;
  mainLanguage: string;
  relationshipStatus: string;
  supportNeeded: string;
  reasonForTomo: string;
  faith: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<OnboardingData>({
    name: '',
    identity: '',
    dob: '',
    motherTongue: '',
    mainLanguage: '',
    relationshipStatus: '',
    supportNeeded: '',
    reasonForTomo: '',
    faith: '',
  });

  const nextStep = () => {
    setStep((s) => {
      let next = s + 1;
      if (isEditMode) {
        while ([6, 8, 10, 12].includes(next)) {
          next++;
        }
      }
      return next;
    });
  };

  const updateData = (key: keyof OnboardingData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateAndNext = (key: keyof OnboardingData, value: string) => {
    updateData(key, value);
    if (!isEditMode) {
      nextStep();
    }
  };

  const finishOnboarding = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          onboarded: true,
          ...data,
        }
      });
      if (error) throw error;
      
      // Force a session refresh to ensure cookies are perfectly synced for middleware
      await supabase.auth.refreshSession();
      
      // Use a hard navigation to bypass Next.js client-side router cache which causes silent redirect loops
      window.location.href = '/chat';
    } catch (err: any) {
      console.error('Failed to save onboarding:', err);
      setErrorMsg(err.message || 'An unknown error occurred');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 13) {
      const timer = setTimeout(() => {
        finishOnboarding();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    const checkEditMode = async () => {
      if (window.location.search.includes('edit=true')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.user_metadata) {
          setIsEditMode(true);
          const meta = session.user.user_metadata;
          setData({
            name: meta.name || '',
            identity: meta.identity || '',
            dob: meta.dob || '',
            motherTongue: meta.motherTongue || '',
            mainLanguage: meta.mainLanguage || '',
            relationshipStatus: meta.relationshipStatus || '',
            supportNeeded: meta.supportNeeded || '',
            reasonForTomo: meta.reasonForTomo || '',
            faith: meta.faith || '',
          });
          setStep(1); // skip welcome screen
        }
      }
    };
    checkEditMode();
  }, []);

  const isAdult = (dobString: string) => {
    if (!dobString) return false;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 18;
  };

  // Soft vertical drift
  const slideVariants = {
    enter: { y: 20, opacity: 0 },
    center: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-main)',
      display: 'flex',
      flexDirection: 'column' as const,
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden'
    },
    progressWrap: {
      height: '2px',
      backgroundColor: 'var(--border-subtle)',
      width: '100%',
      position: 'fixed' as const,
      top: 0,
      left: 0,
      zIndex: 50
    },
    progressBar: {
      height: '100%',
      backgroundColor: 'var(--accent-main)'
    },
    mainArea: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative' as const,
      maxWidth: '700px',
      margin: '0 auto',
      width: '100%'
    },
    stepBoxCenter: {
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center' as const,
      width: '100%'
    },
    logo: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: 'var(--accent-main)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFFFF',
      fontFamily: 'serif',
      fontStyle: 'italic',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      marginBottom: '2.5rem',
      boxShadow: '0 4px 14px 0 rgba(129, 152, 138, 0.3)'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '600',
      marginBottom: '2.5rem',
      color: 'var(--text-main)',
      letterSpacing: '-0.03em',
      lineHeight: '1.1'
    },
    inputLine: {
      background: 'transparent',
      border: 'none',
      borderBottom: '2px solid var(--border-main)',
      fontSize: '1.8rem',
      paddingBottom: '0.5rem',
      color: 'var(--text-main)',
      outline: 'none',
      marginBottom: '3rem',
      width: '100%',
      textAlign: 'center' as const,
      fontWeight: '500',
      transition: 'border-color 0.3s ease'
    },
    btnPrimaryCenter: {
      backgroundColor: 'var(--accent-main)',
      color: '#FFFFFF',
      padding: '0.8rem 2.5rem',
      borderRadius: '999px',
      fontSize: '1rem',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 14px 0 rgba(129, 152, 138, 0.2)'
    },
    btnNext: {
      background: 'transparent',
      color: 'var(--text-main)',
      padding: '0.8rem 2.5rem',
      borderRadius: '999px',
      fontSize: '1rem',
      fontWeight: '500',
      border: '1px solid var(--border-main)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    optionGrid: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      justifyContent: 'center',
      gap: '0.75rem',
      maxWidth: '500px',
      margin: '0 auto'
    },
    btnPill: {
      border: '1px solid var(--border-main)',
      borderRadius: '999px',
      padding: '0.75rem 1.5rem',
      background: 'transparent',
      color: 'var(--text-main)',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'all 0.2s ease'
    },
    mutedText: {
      color: 'var(--text-muted)',
      fontSize: '1.1rem',
      marginBottom: '3rem',
      lineHeight: '1.6',
      fontWeight: '300'
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.style.borderColor = 'var(--accent-main)';
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => e.target.style.borderColor = 'var(--border-main)';
  
  const handlePillHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = 'var(--accent-main)';
    e.currentTarget.style.color = 'var(--accent-main)';
    e.currentTarget.style.backgroundColor = 'rgba(129, 152, 138, 0.05)';
  };
  const handlePillOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-main)';
    e.currentTarget.style.color = 'var(--text-main)';
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  const TomoLogo = ({ style = {} }: any) => (
    <motion.div 
      style={{...styles.logo, ...style}}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      t
    </motion.div>
  );

  const OptionPill = ({ opt, selected, onClick }: { opt: string, selected: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick} 
      style={{
        ...styles.btnPill,
        borderColor: selected ? 'var(--accent-main)' : 'var(--border-main)',
        color: selected ? 'var(--accent-main)' : 'var(--text-main)',
        backgroundColor: selected ? 'rgba(129, 152, 138, 0.05)' : 'transparent',
      }}
      onMouseOver={handlePillHover} 
      onMouseOut={(e) => {
        if (!selected) handlePillOut(e);
      }}
    >
      {opt}
    </button>
  );

  const ContinueButton = ({ disabled = false }: { disabled?: boolean }) => {
    if (!isEditMode) return null;
    return (
      <div style={{ marginTop: '2.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <button onClick={nextStep} disabled={disabled} style={{...styles.btnNext, opacity: disabled ? 0.3 : 1}}>
          Save & Continue
        </button>
      </div>
    );
  };


  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div style={styles.stepBoxCenter}>
            <TomoLogo />
            <h1 style={styles.title}>Hi. I'm Tomo.<br/>What's your name?</h1>
            <input
              type="text"
              value={data.name}
              onChange={(e) => updateData('name', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && data.name && nextStep()}
              style={styles.inputLine}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoFocus
            />
            <button 
              onClick={nextStep}
              disabled={!data.name}
              style={{...styles.btnNext, opacity: data.name ? 1 : 0.3}}
            >
              Continue
            </button>
          </div>
        );
      case 1:
        return (
          <div style={styles.stepBoxCenter}>
            <h1 style={styles.title}>Nice to meet you, {data.name}.<br/>How do you identify?</h1>
            <div style={styles.optionGrid}>
              {['she/her', 'he/him', 'they/them', 'something else'].map((opt) => (
                <OptionPill key={opt} opt={opt} selected={data.identity === opt} onClick={() => updateAndNext('identity', opt)} />
              ))}
            </div>
            <ContinueButton disabled={!data.identity} />
          </div>
        );
      case 2:
        return (
          <div style={styles.stepBoxCenter}>
            <h1 style={styles.title}>When's your birthday?</h1>
            <p style={styles.mutedText}>Just making sure you're 18+ to keep this space safe.</p>
            <input
              type="date"
              value={data.dob}
              onChange={(e) => updateData('dob', e.target.value)}
              style={{
                ...styles.inputLine,
                fontSize: '1.2rem',
                padding: '0.5rem',
                border: '1px solid var(--border-main)',
                borderRadius: '12px',
                width: 'auto'
              }}
            />
            <button 
              onClick={nextStep}
              disabled={!isAdult(data.dob)}
              style={{...styles.btnNext, opacity: isAdult(data.dob) ? 1 : 0.3}}
            >
              {isEditMode ? 'Save & Continue' : 'Continue'}
            </button>
            {data.dob && !isAdult(data.dob) && (
              <p style={{ color: 'var(--text-muted)', marginTop: '1.5rem', fontSize: '0.9rem' }}>You must be 18 or older to use Tomo.</p>
            )}
          </div>
        );
      case 3:
        return (
          <div style={styles.stepBoxCenter}>
            <h1 style={styles.title}>What language feels like home to you?</h1>
            <div style={styles.optionGrid}>
              {['hindi', 'bengali', 'urdu', 'tamil', 'telugu', 'marathi', 'gujarati', 'punjabi', 'english', 'other'].map((opt) => (
                <OptionPill key={opt} opt={opt} selected={data.motherTongue === opt} onClick={() => updateAndNext('motherTongue', opt)} />
              ))}
            </div>
            <ContinueButton disabled={!data.motherTongue} />
          </div>
        );
      case 4:
        return (
          <div style={styles.stepBoxCenter}>
            <h1 style={styles.title}>And what language do you mostly think in?</h1>
            <div style={styles.optionGrid}>
              {['hindi', 'bengali', 'urdu', 'tamil', 'telugu', 'marathi', 'gujarati', 'punjabi', 'english', 'other'].map((opt) => (
                <OptionPill key={opt} opt={opt} selected={data.mainLanguage === opt} onClick={() => updateAndNext('mainLanguage', opt)} />
              ))}
            </div>
            <ContinueButton disabled={!data.mainLanguage} />
          </div>
        );
      case 5:
        return (
          <div style={styles.stepBoxCenter}>
            <h1 style={styles.title}>What's your relationship vibe right now?</h1>
            <div style={styles.optionGrid}>
              {['single & thriving', 'it\'s complicated', 'in a situationship', 'taken', 'healing from a breakup', 'prefer not to say'].map((opt) => (
                <OptionPill key={opt} opt={opt} selected={data.relationshipStatus === opt} onClick={() => updateAndNext('relationshipStatus', opt)} />
              ))}
            </div>
            <ContinueButton disabled={!data.relationshipStatus} />
          </div>
        );
      case 6:
        return (
          <div style={styles.stepBoxCenter}>
            <TomoLogo />
            <h1 style={styles.title}>This isn't a normal AI chat.</h1>
            <p style={{...styles.mutedText, maxWidth: '400px'}}>Tomo is a quiet space built just for you. No judgment, no filters. Just a safe place to process your loud thoughts.</p>
            <button onClick={nextStep} style={styles.btnPrimaryCenter}>Understand</button>
          </div>
        );
      case 7:
        return (
          <div style={styles.stepBoxCenter}>
            <h1 style={styles.title}>What's been on your mind lately?</h1>
            <div style={styles.optionGrid}>
              {['feeling overwhelmed', 'overthinking everything', 'relationship stuff', 'feeling lonely or disconnected', 'just navigating life'].map((opt) => (
                <OptionPill key={opt} opt={opt} selected={data.supportNeeded === opt} onClick={() => updateAndNext('supportNeeded', opt)} />
              ))}
            </div>
            <ContinueButton disabled={!data.supportNeeded} />
          </div>
        );
      case 8:
        return (
          <div style={styles.stepBoxCenter}>
            <h1 style={styles.title}>You're not alone in this.</h1>
            <p style={{...styles.mutedText, maxWidth: '440px'}}>Venting to a judgment-free listener is proven to untangle your thoughts and actually lower stress.</p>
            <button onClick={nextStep} style={styles.btnPrimaryCenter}>Continue</button>
          </div>
        );
      case 9:
        return (
          <div style={styles.stepBoxCenter}>
            <h1 style={styles.title}>How can I best show up for you?</h1>
            <div style={styles.optionGrid}>
              {['help me figure myself out', 'i just need someone to listen', 'help me build better habits', 'honestly, i just need to vent', 'we\'ll figure it out together'].map((opt) => (
                <OptionPill key={opt} opt={opt} selected={data.reasonForTomo === opt} onClick={() => updateAndNext('reasonForTomo', opt)} />
              ))}
            </div>
            <ContinueButton disabled={!data.reasonForTomo} />
          </div>
        );
      case 10:
        return (
          <div style={styles.stepBoxCenter}>
            <TomoLogo />
            <h1 style={styles.title}>I actually listen.</h1>
            <p style={{...styles.mutedText, maxWidth: '400px'}}>I'll remember the little things you tell me, connect the dots, and help you notice patterns in your mood over time.</p>
            <button onClick={nextStep} style={styles.btnPrimaryCenter}>Continue</button>
          </div>
        );
      case 11:
        return (
          <div style={styles.stepBoxCenter}>
            <h1 style={styles.title}>What grounds you spiritually?</h1>
            <div style={styles.optionGrid}>
              {['i\'m religious', 'spiritual, but not religious', 'i believe in the universe', 'not really my thing', 'something else'].map((opt) => (
                <OptionPill key={opt} opt={opt} selected={data.faith === opt} onClick={() => updateAndNext('faith', opt)} />
              ))}
            </div>
            <ContinueButton disabled={!data.faith} />
          </div>
        );
      case 12:
        return (
          <div style={styles.stepBoxCenter}>
            <h1 style={styles.title}>What happens here, stays here.</h1>
            <p style={{...styles.mutedText, maxWidth: '400px', marginBottom: '1.5rem'}}>Your thoughts belong to you.</p>
            <p style={{...styles.mutedText, maxWidth: '400px', fontSize: '0.9rem', opacity: 0.7}}>Everything is encrypted. Your vents are never, ever used to train AI models. Period.</p>
            <button onClick={nextStep} style={styles.btnPrimaryCenter}>I understand</button>
          </div>
        );
      case 13:
        return (
          <div style={styles.stepBoxCenter}>
            <style>
              {`
                @keyframes pulse-ring { 
                  0% { transform: scale(1); opacity: 0.8; }
                  50% { transform: scale(1.8); opacity: 0; }
                  100% { transform: scale(1); opacity: 0; }
                }
                .loader-ring {
                  width: 44px; height: 44px;
                  border: 2px solid var(--accent-main);
                  border-radius: 50%;
                  animation: pulse-ring 2s ease-out infinite;
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  margin-top: -22px;
                  margin-left: -22px;
                }
              `}
            </style>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2.5rem', width: '60px', height: '60px' }}>
              <div className="loader-ring"></div>
              <div className="loader-ring" style={{ animationDelay: '1s' }}></div>
              <TomoLogo style={{ marginBottom: 0, position: 'relative', zIndex: 10 }} />
            </div>
            <h1 style={{...styles.title, marginBottom: 0}}>creating your quiet space...</h1>
            {errorMsg && (
              <p style={{ color: 'red', marginTop: '2rem', fontSize: '1rem', maxWidth: '400px' }}>
                Error: {errorMsg}
                <br /><br />
                Please try refreshing the page.
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.progressWrap}>
        <motion.div 
          style={styles.progressBar}
          initial={{ width: 0 }}
          animate={{ width: `${(step / 13) * 100}%` }}
          transition={{ ease: "easeInOut" }}
        />
      </div>

      <div style={styles.mainArea}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ width: '100%' }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
