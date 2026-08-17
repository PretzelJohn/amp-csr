import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type SetStateAction,
} from "react";
import type {
  CustomerDetailRecord,
  CustomerRecord,
  NoteRecord,
  PurchaseRecord,
  SubscriptionRecord,
} from "@amp/shared";
import { apiFetch } from "@/lib/auth";

export type {
  CustomerDetailRecord,
  CustomerRecord,
  NoteRecord,
  PurchaseRecord,
  SubscriptionRecord,
};

const normalizeCustomerDetail = (
  payload: unknown,
): CustomerDetailRecord | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const baseCustomer =
    record.customer && typeof record.customer === "object"
      ? (record.customer as CustomerRecord)
      : (record as CustomerRecord);

  if (!baseCustomer || typeof baseCustomer !== "object") {
    return null;
  }

  return {
    ...baseCustomer,
    subscriptions: Array.isArray(record.subscriptions)
      ? (record.subscriptions as SubscriptionRecord[])
      : [],
    purchaseHistory: Array.isArray(record.purchaseHistory)
      ? (record.purchaseHistory as PurchaseRecord[])
      : [],
    notes: Array.isArray(record.notes)
      ? (record.notes as NoteRecord[])
      : [],
  };
};

type CustomerContextValue = {
  customers: CustomerRecord[];
  selectedCustomerId: string | number;
  selectedCustomer: CustomerDetailRecord | null;
  search: string;
  setSearch: (value: string) => void;
  setSelectedCustomerId: (value: string | number) => void;
  setSelectedCustomer: (
    value: SetStateAction<CustomerDetailRecord | null>,
  ) => void;
  refreshCustomers: (query?: string) => Promise<void>;
  refreshSelectedCustomer: (customerId?: string | number) => Promise<void>;
  updateCustomerInList: (customer: CustomerRecord) => void;
};

const CustomerContext = createContext<CustomerContextValue | undefined>(
  undefined,
);

const normalizeCustomers = (payload: unknown): CustomerRecord[] => {
  if (Array.isArray(payload)) {
    return payload as CustomerRecord[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "items" in payload &&
    Array.isArray((payload as { items?: unknown[] }).items)
  ) {
    return (payload as { items: CustomerRecord[] }).items;
  }

  return [];
};

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | number>(
    "",
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetailRecord | null>(null);
  const [search, setSearch] = useState("");

  const updateCustomerInList = useCallback((customer: CustomerRecord) => {
    setCustomers((current) =>
      current.map((item) =>
        item.id === customer.id ? { ...item, ...customer } : item,
      ),
    );
  }, []);

  const refreshCustomers = useCallback(
    async (query = search) => {
      const url =
        query.trim() !== ""
          ? `/customers?search=${encodeURIComponent(query)}`
          : "/customers";

      const response = await apiFetch(url);
      const nextCustomers = normalizeCustomers(response.data);
      setCustomers(nextCustomers);

      if (
        !nextCustomers.some((customer) => customer.id === selectedCustomerId)
      ) {
        setSelectedCustomerId(nextCustomers[0]?.id ?? "");
      }
    },
    [search, selectedCustomerId],
  );

  const refreshSelectedCustomer = useCallback(
    async (customerId = selectedCustomerId) => {
      if (!customerId) {
        setSelectedCustomer(null);
        return;
      }

      try {
        const response = await apiFetch(`/customers/${customerId}`);
        setSelectedCustomer(normalizeCustomerDetail(response.data) ?? null);
      } catch {
        setSelectedCustomer(null);
      }
    },
    [selectedCustomerId],
  );

  useEffect(() => {
    refreshCustomers(search).catch(() => undefined);
  }, [refreshCustomers, search]);

  useEffect(() => {
    if (selectedCustomerId) {
      refreshSelectedCustomer(selectedCustomerId).catch(() => undefined);
    }
  }, [refreshSelectedCustomer, selectedCustomerId]);

  const value = useMemo<CustomerContextValue>(
    () => ({
      customers,
      selectedCustomerId,
      selectedCustomer,
      search,
      setSearch,
      setSelectedCustomerId,
      setSelectedCustomer,
      refreshCustomers,
      refreshSelectedCustomer,
      updateCustomerInList,
    }),
    [
      customers,
      refreshCustomers,
      refreshSelectedCustomer,
      search,
      selectedCustomer,
      selectedCustomerId,
      updateCustomerInList,
    ],
  );

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomerContext() {
  const context = useContext(CustomerContext);

  if (!context) {
    throw new Error(
      "useCustomerContext must be used inside a CustomerProvider",
    );
  }

  return context;
}
