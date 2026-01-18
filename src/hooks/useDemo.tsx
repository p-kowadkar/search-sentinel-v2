import { createContext, useContext, useState, ReactNode } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  demoUserId: string;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DEMO_USER_ID = 'demo-user-12345';

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Check localStorage for persisted demo mode
    if (typeof window !== 'undefined') {
      return localStorage.getItem('demo_mode') === 'true';
    }
    return false;
  });

  const enableDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem('demo_mode', 'true');
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem('demo_mode');
  };

  return (
    <DemoContext.Provider value={{ 
      isDemoMode, 
      enableDemoMode, 
      disableDemoMode,
      demoUserId: DEMO_USER_ID 
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
