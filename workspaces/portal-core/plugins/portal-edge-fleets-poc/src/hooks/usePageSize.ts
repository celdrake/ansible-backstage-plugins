import React from 'react';

const PAGE_SIZE = 10;
const PAGE_SIZE_STORAGE_KEY = 'portal-edge-fleets-poc.page-size';

const getSavedPageSize = () => {
  if (typeof window === 'undefined') {
    return PAGE_SIZE;
  }

  try {
    const savedPageSize = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    const pageSize = savedPageSize === null ? NaN : Number(savedPageSize);
    return Number.isSafeInteger(pageSize) && pageSize > 0
      ? pageSize
      : PAGE_SIZE;
  } catch {
    return PAGE_SIZE;
  }
};

const savePageSize = (pageSize: number) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize));
  } catch {
    // Keep the in-memory preference if browser storage is unavailable.
  }
};

export const usePageSize = () => {
  const [pageSize, setPageSize] = React.useState(getSavedPageSize());

  React.useEffect(() => {
    savePageSize(pageSize);
  }, [pageSize]);

  return { pageSize, setPageSize };
};
