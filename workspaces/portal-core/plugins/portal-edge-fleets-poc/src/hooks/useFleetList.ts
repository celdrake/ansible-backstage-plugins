import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTable } from '@backstage/ui';
import type { Fleet, FleetList } from '@ansible/portal-edge-fleets-poc-common';
import useFetchPeriodically from './useFetchPeriodically';
import useFlightCtlApiFetch from './useFlightCtlApiFetch';
import { usePageSize } from './usePageSize';

const SEARCH_DEBOUNCE_MS = 1000;

// Adjust the type so it has an "id" and can be used on the table.
export type EdgeFleet = Fleet & { id: string };

type FleetListRequest = {
  endpoint: string;
  page: number;
  search: string;
};

type ApiFleetListResponse = {
  fleetList: FleetList;
  page: number;
  search: string;
};

type EdgeFleetListResponse = {
  fleetList: Omit<FleetList, 'items'> & { items: EdgeFleet[] };
  page: number;
  search: string;
};

// Map the response so each fleet has an "id" property and can be used on the table.
const fleetListMapper = (
  fleetListResponse: ApiFleetListResponse,
): EdgeFleetListResponse => {
  const mappedFleetListResponse = {
    ...fleetListResponse,
    fleetList: {
      ...fleetListResponse.fleetList,
      items: fleetListResponse.fleetList.items.map(fleet => ({
        ...fleet,
        id: fleet.metadata.name as string,
      })),
    },
  };
  return mappedFleetListResponse;
};

const useFleetList = () => {
  const [nameSearch, setNameSearch] = useState('');
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [continueTokens, setContinueTokens] = useState<string[]>([]);
  const flightctlFetch = useFlightCtlApiFetch();
  const { pageSize, setPageSize } = usePageSize();

  const onSearchChange = useCallback(
    (value: string) => {
      // CELIA-WIP: VALIDATE PROPERLY and fix UX of the component
      if (value.includes(' ')) {
        setSearchError('Spaces are not allowed in search');
        return;
      }
      setNameSearch(value);
      setSearchError(undefined);
      if (value !== nameSearch) {
        setCurrentPage(1);
        setContinueTokens([]);
      }
    },
    [nameSearch],
  );

  const continueToken =
    currentPage > 1 ? continueTokens[currentPage - 2] : undefined;

  const request = useMemo<FleetListRequest>(() => {
    const params = new URLSearchParams({ limit: String(pageSize) });
    if (nameSearch) {
      params.set('fieldSelector', `metadata.name contains ${nameSearch}`);
    }
    if (continueToken) {
      params.set('continue', continueToken);
    }
    return {
      endpoint: `/fleets?${params.toString()}`,
      page: currentPage,
      search: nameSearch,
    };
  }, [continueToken, currentPage, nameSearch, pageSize]);

  const [debouncedRequest, setDebouncedRequest] = useState(request);
  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedRequest(request),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [request]);

  const fetchFleetPage = useCallback(
    async (signal: AbortSignal): Promise<ApiFleetListResponse> => ({
      fleetList: await flightctlFetch<FleetList>(
        debouncedRequest.endpoint,
        signal,
      ),
      page: debouncedRequest.page,
      search: debouncedRequest.search,
    }),
    [debouncedRequest, flightctlFetch],
  );
  const periodicState = useFetchPeriodically<ApiFleetListResponse>(
    fetchFleetPage,
    {
      mapper: fleetListMapper,
    },
  );
  const response = periodicState.data;
  const fleets = response?.fleetList.items as EdgeFleet[];

  useEffect(() => {
    if (!response || response.search !== nameSearch) {
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
  }, [nameSearch, response]);

  const { tableProps, search } = useTable<EdgeFleet>({
    mode: 'complete',
    data: fleets, // the mapper added the "id" property to the items
    search: nameSearch,
    paginationOptions: {
      type: 'none',
    },
    onSearchChange,
  });

  const isDebouncing = request.endpoint !== debouncedRequest.endpoint;
  const isCurrentPageResponse = Boolean(
    response &&
      response.page === currentPage &&
      response.search === nameSearch &&
      debouncedRequest.endpoint === request.endpoint &&
      !periodicState.isUpdating,
  );
  const currentPageList = isCurrentPageResponse
    ? response?.fleetList
    : undefined;
  const hasNextPageFromResponse = Boolean(currentPageList?.metadata.continue);
  const offset = (currentPage - 1) * pageSize;
  const remainingItemCount = currentPageList?.metadata.remainingItemCount;
  const totalCount = currentPageList
    ? remainingItemCount === undefined
      ? hasNextPageFromResponse
        ? undefined
        : offset + currentPageList.items.length
      : offset + currentPageList.items.length + remainingItemCount
    : undefined;
  const [lastKnownTotalCount, setLastKnownTotalCount] = useState<number>();

  useEffect(() => {
    if (totalCount !== undefined) {
      setLastKnownTotalCount(totalCount);
    }
  }, [totalCount]);

  const displayedTotalCount = totalCount ?? lastKnownTotalCount;

  const onNextPage = useCallback(() => {
    setCurrentPage(page => page + 1);
  }, []);
  const onPreviousPage = useCallback(() => {
    setCurrentPage(page => Math.max(1, page - 1));
  }, []);

  const pagination = useMemo(
    () => ({
      type: 'page' as const,
      pageSize,
      offset,
      totalCount: displayedTotalCount,
      getLabel: () =>
        `${currentPage} of ${Math.ceil((displayedTotalCount ?? 0) / pageSize)}`,
      hasNextPage:
        isCurrentPageResponse && Boolean(continueTokens[currentPage - 1]),
      hasPreviousPage:
        currentPage > 1 && !periodicState.isUpdating && !isDebouncing,
      onNextPage,
      onPreviousPage,
      onPageSizeChange: (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1);
        setContinueTokens([]);
      },
      showPageSizeOptions: true,
      showPaginationLabel: true,
    }),
    [
      currentPage,
      continueTokens,
      displayedTotalCount,
      isDebouncing,
      isCurrentPageResponse,
      offset,
      onNextPage,
      onPreviousPage,
      pageSize,
      periodicState.isUpdating,
      totalCount,
    ],
  );

  return {
    tableProps: {
      ...tableProps,
      pagination,
    },
    search,
    searchError,
    fleets,
    isLoading: periodicState.isLoading,
    isUpdating: periodicState.isUpdating,
    isDebouncing,
    error: periodicState.error,
    refetch: periodicState.refetch,
  };
};

export type FleetListState = ReturnType<typeof useFleetList>;

export default useFleetList;
