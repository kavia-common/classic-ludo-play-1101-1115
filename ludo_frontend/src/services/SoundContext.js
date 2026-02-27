import React, { createContext, useState, useContext, useCallback } from 'react';
import {
  playDiceRollSound,
  playTokenStepSound,
  playCaptureSound,
  playWinSound,
  playExitBaseSound,
  playHomeSound,
  playClickSound,
} from './soundService';

/**
 * Sound context for global sound state management.
 */
const SoundContext = createContext({
  soundEnabled: true,
  toggleSound: () => {},
  playDiceRoll: () => {},
  playTokenStep: () => {},
  playCapture: () => {},
  playWin: () => {},
  playExitBase: () => {},
  playHome: () => {},
  playClick: () => {},
});

// PUBLIC_INTERFACE
/**
 * SoundProvider component that wraps the app and provides sound functions.
 * Sound is enabled by default.
 * @param {object} props - { children }
 */
export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  const playDiceRoll = useCallback(() => {
    if (soundEnabled) playDiceRollSound();
  }, [soundEnabled]);

  const playTokenStep = useCallback(() => {
    if (soundEnabled) playTokenStepSound();
  }, [soundEnabled]);

  const playCapture = useCallback(() => {
    if (soundEnabled) playCaptureSound();
  }, [soundEnabled]);

  const playWin = useCallback(() => {
    if (soundEnabled) playWinSound();
  }, [soundEnabled]);

  const playExitBase = useCallback(() => {
    if (soundEnabled) playExitBaseSound();
  }, [soundEnabled]);

  const playHome = useCallback(() => {
    if (soundEnabled) playHomeSound();
  }, [soundEnabled]);

  const playClick = useCallback(() => {
    if (soundEnabled) playClickSound();
  }, [soundEnabled]);

  const value = {
    soundEnabled,
    toggleSound,
    playDiceRoll,
    playTokenStep,
    playCapture,
    playWin,
    playExitBase,
    playHome,
    playClick,
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
}

// PUBLIC_INTERFACE
/**
 * Hook to access sound functions and state.
 * @returns {object} Sound context value
 */
export function useSound() {
  return useContext(SoundContext);
}

export default SoundContext;
