import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_SETTINGS } from "./config";
import { createId } from "./id";
import type { Customer, StoreData, Visit } from "./types";

const globalForStore = globalThis as unknown as {
  __loyaltyStore?: StoreData;
};

function emptyStore(): StoreData {
  return {
    customers: [],
    visits: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function dataFilePath() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "gentlemen-loyalty.json");
  }
  return path.join(process.cwd(), "data", "store.json");
}

async function readFromDisk(): Promise<StoreData | null> {
  try {
    const raw = await fs.readFile(dataFilePath(), "utf8");
    return JSON.parse(raw) as StoreData;
  } catch {
    return null;
  }
}

async function writeToDisk(data: StoreData) {
  try {
    const file = dataFilePath();
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Vercel cold paths / permissions — memory still holds data for the instance
  }
}

async function getStore(): Promise<StoreData> {
  if (globalForStore.__loyaltyStore) {
    return globalForStore.__loyaltyStore;
  }
  const fromDisk = await readFromDisk();
  const store = fromDisk ?? emptyStore();
  globalForStore.__loyaltyStore = store;
  return store;
}

async function saveStore(store: StoreData) {
  globalForStore.__loyaltyStore = store;
  await writeToDisk(store);
}

function generateMemberCode(existing: Set<string>) {
  for (let i = 0; i < 30; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (!existing.has(code)) return code;
  }
  return createId(6).toUpperCase();
}

export async function getSettings() {
  const store = await getStore();
  return store.settings;
}

export async function listCustomers() {
  const store = await getStore();
  return store.customers;
}

export async function getCustomerByCode(code: string) {
  const store = await getStore();
  return (
    store.customers.find((c) => c.memberCode === code.trim()) ?? null
  );
}

export async function getCustomerByPhone(phone: string) {
  const store = await getStore();
  const normalized = phone.replace(/\s+/g, "");
  return (
    store.customers.find((c) => c.phone.replace(/\s+/g, "") === normalized) ??
    null
  );
}

export async function createCustomer(input: {
  name: string;
  phone: string;
}): Promise<Customer> {
  const store = await getStore();
  const existingPhone = store.customers.find(
    (c) => c.phone.replace(/\s+/g, "") === input.phone.replace(/\s+/g, "")
  );
  if (existingPhone) return existingPhone;

  const codes = new Set(store.customers.map((c) => c.memberCode));
  const customer: Customer = {
    id: createId(),
    memberCode: generateMemberCode(codes),
    name: input.name.trim(),
    phone: input.phone.trim(),
    stamps: 0,
    freeAvailable: false,
    createdAt: new Date().toISOString(),
    lastNotification: null,
    notificationAt: null,
  };
  store.customers.push(customer);
  await saveStore(store);
  return customer;
}

function buildStampMessage(
  stamps: number,
  required: number,
  freeAvailable: boolean
) {
  if (freeAvailable) {
    return "مبروك! استحقيت تحليقة مجانية في زيارتك الجاية.";
  }
  const remaining = required - stamps;
  if (remaining === 1) {
    return "تم تسجيل تحليقتك — باقي تحليقة واحدة على المجانية.";
  }
  return `تم تسجيل تحليقتك — تقدمك ${stamps} من ${required}. باقي ${remaining} تحليقات على المجانية.`;
}

export async function addStamp(memberCode: string): Promise<{
  customer: Customer;
  visit: Visit;
  message: string;
}> {
  const store = await getStore();
  const customer = store.customers.find((c) => c.memberCode === memberCode);
  if (!customer) throw new Error("CUSTOMER_NOT_FOUND");
  if (customer.freeAvailable) {
    throw new Error("FREE_PENDING");
  }

  const lastStamp = store.visits
    .filter((v) => v.customerId === customer.id && v.type === "stamp")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (lastStamp) {
    const diff = Date.now() - new Date(lastStamp.createdAt).getTime();
    if (diff < 60_000) throw new Error("TOO_SOON");
  }

  const required = store.settings.stampsRequired;
  customer.stamps += 1;

  if (customer.stamps >= required) {
    customer.stamps = required;
    customer.freeAvailable = true;
  }

  const message = buildStampMessage(
    customer.stamps,
    required,
    customer.freeAvailable
  );
  customer.lastNotification = message;
  customer.notificationAt = new Date().toISOString();

  const visit: Visit = {
    id: createId(),
    customerId: customer.id,
    type: "stamp",
    createdAt: new Date().toISOString(),
    message,
  };
  store.visits.unshift(visit);
  await saveStore(store);
  return { customer, visit, message };
}

export async function redeemFree(memberCode: string): Promise<{
  customer: Customer;
  visit: Visit;
  message: string;
}> {
  const store = await getStore();
  const customer = store.customers.find((c) => c.memberCode === memberCode);
  if (!customer) throw new Error("CUSTOMER_NOT_FOUND");
  if (!customer.freeAvailable) throw new Error("NO_FREE");

  customer.stamps = 0;
  customer.freeAvailable = false;
  const message = "تم استخدام التحليقة المجانية. دورة جديدة بدأت — بالتوفيق!";
  customer.lastNotification = message;
  customer.notificationAt = new Date().toISOString();

  const visit: Visit = {
    id: createId(),
    customerId: customer.id,
    type: "redeem",
    createdAt: new Date().toISOString(),
    message,
  };
  store.visits.unshift(visit);
  await saveStore(store);
  return { customer, visit, message };
}

export async function recentVisits(limit = 20) {
  const store = await getStore();
  return store.visits.slice(0, limit).map((visit) => {
    const customer = store.customers.find((c) => c.id === visit.customerId);
    return {
      ...visit,
      customerName: customer?.name ?? "—",
      memberCode: customer?.memberCode ?? "—",
    };
  });
}
