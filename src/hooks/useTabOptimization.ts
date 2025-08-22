import { useState, useCallback, useRef } from "react";

interface TabState<T> {
  [tabId: string]: T;
}

interface UseTabOptimizationOptions {
  initialTab: string;
  dataFetchingEnabled?: boolean;
  cacheTimeout?: number;
}

export const useTabOptimization = <T>({
  initialTab,
  dataFetchingEnabled = true,
  cacheTimeout = 30000, // 30 seconds
}: UseTabOptimizationOptions) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [tabStates, setTabStates] = useState<TabState<T>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const lastFetchTimeRef = useRef<{ [tabId: string]: number }>({});
  const dataCacheRef = useRef<{
    [tabId: string]: { data: T; timestamp: number };
  }>({});

  // Check if data is stale for a tab
  const isDataStale = useCallback(
    (tabId: string): boolean => {
      const lastFetch = lastFetchTimeRef.current[tabId];
      if (!lastFetch) return true;
      return Date.now() - lastFetch > cacheTimeout;
    },
    [cacheTimeout],
  );

  // Get cached data for a tab
  const getCachedData = useCallback(
    (tabId: string): T | null => {
      const cached = dataCacheRef.current[tabId];
      if (cached && !isDataStale(tabId)) {
        return cached.data;
      }
      return null;
    },
    [isDataStale],
  );

  // Set cached data for a tab
  const setCachedData = useCallback((tabId: string, data: T) => {
    dataCacheRef.current[tabId] = {
      data,
      timestamp: Date.now(),
    };
    lastFetchTimeRef.current[tabId] = Date.now();
  }, []);

  // Switch tabs with optimization
  const switchTab = useCallback(
    (newTab: string) => {
      if (newTab === activeTab) return;

      // Check if we have fresh cached data for the new tab
      const cachedData = getCachedData(newTab);

      if (cachedData) {
        // Use cached data immediately
        setTabStates((prev) => ({
          ...prev,
          [newTab]: cachedData,
        }));
        setActiveTab(newTab);
        setIsLoading(false);
      } else {
        // Set loading state and switch tab
        setIsLoading(true);
        setActiveTab(newTab);

        // If data fetching is disabled, just switch without loading
        if (!dataFetchingEnabled) {
          setIsLoading(false);
        }
      }
    },
    [activeTab, getCachedData, dataFetchingEnabled],
  );

  // Update tab data
  const updateTabData = useCallback(
    (tabId: string, data: T) => {
      setTabStates((prev) => ({
        ...prev,
        [tabId]: data,
      }));
      setCachedData(tabId, data);
      setIsLoading(false);
    },
    [setCachedData],
  );

  // Force refresh for a specific tab
  const refreshTab = useCallback((tabId: string) => {
    lastFetchTimeRef.current[tabId] = 0; // Force stale
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete dataCacheRef.current[tabId];
    setIsLoading(true);
  }, []);

  // Force refresh all tabs
  const refreshAllTabs = useCallback(() => {
    lastFetchTimeRef.current = {};
    dataCacheRef.current = {};
    setIsLoading(true);
  }, []);

  // Get current tab data
  const getCurrentTabData = useCallback((): T | undefined => {
    return tabStates[activeTab];
  }, [activeTab, tabStates]);

  // Check if current tab needs data fetching
  const needsDataFetch = useCallback((): boolean => {
    return (
      dataFetchingEnabled &&
      (isDataStale(activeTab) || !getCachedData(activeTab))
    );
  }, [dataFetchingEnabled, activeTab, isDataStale, getCachedData]);

  return {
    activeTab,
    currentTabData: getCurrentTabData(),
    isLoading,
    tabStates,
    switchTab,
    updateTabData,
    refreshTab,
    refreshAllTabs,
    needsDataFetch,
    isDataStale,
    getCachedData,
  };
};
