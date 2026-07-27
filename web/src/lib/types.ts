export type VisitType = "stamp" | "redeem";

export type Visit = {
  id: string;
  customerId: string;
  type: VisitType;
  createdAt: string;
  message?: string;
};

export type Customer = {
  id: string;
  memberCode: string;
  name: string;
  phone: string;
  stamps: number;
  freeAvailable: boolean;
  createdAt: string;
  lastNotification: string | null;
  notificationAt: string | null;
};

export type Settings = {
  stampsRequired: number;
  salonName: string;
  offerTitle: string;
};

export type StoreData = {
  customers: Customer[];
  visits: Visit[];
  settings: Settings;
};
