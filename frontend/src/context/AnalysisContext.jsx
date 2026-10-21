import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [analysisId, setAnalysisId] = useState(null);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState(null);
  const counter = useRef(0);

  // shows a popup next to the chat bubble and raises the unread badge
  const notify = useCallback((text) => {
    counter.current += 1;
    setToast({ id: counter.current, text });
    setUnread((count) => count + 1);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const clearUnread = useCallback(() => {
    setUnread(0);
    setToast(null);
  }, []);

  const value = useMemo(
    () => ({
      analysisId,
      setAnalysisId,
      unread,
      toast,
      notify,
      dismissToast,
      clearUnread,
    }),
    [analysisId, unread, toast, notify, dismissToast, clearUnread]
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysis must be used inside AnalysisProvider");
  }
  return context;
}