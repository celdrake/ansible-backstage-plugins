import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTable } from '@backstage/ui';
import type { Fleet, FleetList } from '@ansible/portal-edge-fleets-poc-common';
import useFetchPeriodically from './useFetchPeriodically';
import useFlightCtlApiFetch from './useFlightCtlApiFetch';

// Keep the page size aligned with the Flight Control fleet list.
const PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 1000;

// Adjust the type so it has an "id" and can be used on the table.
export type EdgeFleet = Fleet & { id: string };

type FleetListRequest = {
  endpoint: string;
  page: number;
  search: string;
};

type FleetListResponse = {
  fleetList: FleetList;
  page: number;
  search: string;
};

const useFleetList = () => {
  const flightctlFetch = useFlightCtlApiFetch();
  const [nameSearch, setNameSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [continueTokens, setContinueTokens] = useState<string[]>([]);

  const onSearchChange = useCallback(
    (value: string) => {
      const searchChanged = value.trim() !== nameSearch.trim();
      setNameSearch(value);
      if (searchChanged) {
        setCurrentPage(1);
        setContinueTokens([]);
      }
    },
    [nameSearch],
  );

  const normalizedSearch = nameSearch.trim();
  const continueToken =
    currentPage > 1 ? continueTokens[currentPage - 2] : undefined;

  const request = useMemo<FleetListRequest>(() => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (normalizedSearch) {
      params.set('fieldSelector', `metadata.name contains ${normalizedSearch}`);
    }
    if (continueToken) {
      params.set('continue', continueToken);
    }
    return {
      endpoint: `/fleets?${params.toString()}`,
      page: currentPage,
      search: normalizedSearch,
    };
  }, [continueToken, currentPage, normalizedSearch]);

  const [debouncedRequest, setDebouncedRequest] = useState(request);
  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedRequest(request),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [request]);

  const fetchFleetPage = useCallback(
    async (signal: AbortSignal): Promise<FleetListResponse> => ({
      fleetList: await flightctlFetch<FleetList>(
        debouncedRequest.endpoint,
        signal,
      ),
      page: debouncedRequest.page,
      search: debouncedRequest.search,
    }),
    [debouncedRequest, flightctlFetch],
  );
  const periodicState = useFetchPeriodically(fetchFleetPage);
  const response = periodicState.data;

  useEffect(() => {
    if (!response || response.search !== normalizedSearch) {
      return;
    }

    const token = response.fleetList.metadata.continue ?? '';
    setContinueTokens(previousTokens => {
      const pageIndex = response.page - 1;
      if (previousTokens[pageIndex] === token) {
        return previousTokens;
      }

      const nextTokens = previousTokens.slice(0, response.page);
      nextTokens[pageIndex] = token;
      return nextTokens;
    });
  }, [normalizedSearch, response]);

  const fleets = useMemo(
    () =>
      response?.fleetList.items.map(fleet => ({
        ...fleet,
        id: fleet.metadata.name as string,
      })),
    [response],
  );

  const { tableProps, search } = useTable<EdgeFleet>({
    mode: 'complete',
    data: fleets,
    search: nameSearch,
    onSearchChange,
    paginationOptions: { type: 'none' },
  });

  const isDebouncing = request.endpoint !== debouncedRequest.endpoint;
  const isCurrentPageResponse = Boolean(
    response &&
      response.page === currentPage &&
      response.search === normalizedSearch &&
      debouncedRequest.endpoint === request.endpoint &&
      !periodicState.isUpdating,
  );
  const currentPageList = isCurrentPageResponse
    ? response?.fleetList
    : undefined;
  const hasNextPageFromResponse = Boolean(currentPageList?.metadata.continue);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const remainingItemCount = currentPageList?.metadata.remainingItemCount;
  const totalCount = currentPageList
    ? remainingItemCount === undefined
      ? hasNextPageFromResponse
        ? undefined
        : offset + currentPageList.items.length
      : offset + currentPageList.items.length + remainingItemCount
    : undefined;

  const onNextPage = useCallback(() => {
    setCurrentPage(page => page + 1);
  }, []);
  const onPreviousPage = useCallback(() => {
    setCurrentPage(page => Math.max(1, page - 1));
  }, []);

  const pagination = useMemo(
    () => ({
      type: 'page' as const,
      pageSize: PAGE_SIZE,
      offset,
      totalCount,
      hasNextPage:
        isCurrentPageResponse && Boolean(continueTokens[currentPage - 1]),
      hasPreviousPage:
        currentPage > 1 && !periodicState.isUpdating && !isDebouncing,
      onNextPage,
      onPreviousPage,
      showPageSizeOptions: false,
      showPaginationLabel: false,
    }),
    [
      currentPage,
      continueTokens,
      isDebouncing,
      isCurrentPageResponse,
      offset,
      onNextPage,
      onPreviousPage,
      periodicState.isUpdating,
      totalCount,
    ],
  );

  return {
    tableProps,
    search,
    fleets,
    pagination,
    isLoading: periodicState.isLoading,
    isUpdating: periodicState.isUpdating,
    isDebouncing,
    error: periodicState.error,
    refetch: periodicState.refetch,
  };
};

export type FleetListState = ReturnType<typeof useFleetList>;

export default useFleetList;
