import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_SETTINGS } from "./config";
import { createId } from "./id";
import { getRedis, hasRedis, isVercelRuntime } from "./redis";
import type { Customer, Settings, StoreData, Visit } from "./types";

const PREFIX = "gentlemen:";

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
  return path.join(process.cwd(), "data", "store.json");
}

async function readFileStore(): Promise<StoreData> {
  if (globalForStore.__loyaltyStore) return globalForStore.__loyaltyStore;
  try {
    const raw = await fs.readFile(dataFilePath(), "utf8");
    const parsed = JSON.parse(raw) as StoreData;
    globalForStore.__loyaltyStore = parsed;
    return parsed;
  } catch {
    const store = emptyStore();
    globalForStore.__loyaltyStore = store;
    return store;
  }
}

async function writeFileStore(store: StoreData) {
  globalForStore.__loyaltyStore = store;
  const file = dataFilePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(store, null, 2), "utf8");
}

function assertStorageAvailable() {
  if (isVercelRuntime() && !hasRedis()) {
    throw new Error("REDIS_REQUIRED");
  }
}

function generateMemberCode(existing: Set<string>) {
  for (let i = 0; i < 30; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (!existing.has(code)) return code;
  }
  return createId(6).toUpperCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "");
}

async function saveCustomerRedis(customer: Customer) {
  const r = getRedis();
  await r.set(`${PREFIX}customer:${customer.memberCode}`, customer);
  await r.set(
    `${PREFIX}phone:${normalizePhone(customer.phone)}`,
    customer.memberCode
  );
  await r.sadd(`${PREFIX}customer-codes`, customer.memberCode);
}

export async function getSettings(): Promise<Settings> {
  if (hasRedis()) {
    const settings = await getRedis().get<Settings>(`${PREFIX}settings`);
    return settings ?? { ...DEFAULT_SETTINGS };
  }
  if (isVercelRuntime()) return { ...DEFAULT_SETTINGS };
  const store = await readFileStore();
  return store.settings;
}

export async function getCustomerByCode(code: string) {
  const memberCode = code.trim();
  if (!memberCode) return null;

  if (hasRedis()) {
    return (
      (await getRedis().get<Customer>(`${PREFIX}customer:${memberCode}`)) ??
      null
    );
  }

  if (isVercelRuntime()) return null;

  const store = await readFileStore();
  return store.customers.find((c) => c.memberCode === memberCode) ?? null;
}

export async function getCustomerByPhone(phone: string) {
  const normalized = normalizePhone(phone);

  if (hasRedis()) {
    const code = await getRedis().get<string>(`${PREFIX}phone:${normalized}`);
    if (!code) return null;
    return getCustomerByCode(code);
  }

  if (isVercelRuntime()) return null;

  const store = await readFileStore();
  return (
    store.customers.find((c) => normalizePhone(c.phone) === normalized) ?? null
  );
}

export async function createCustomer(input: {
  name: string;
  phone: string;
}): Promise<Customer> {
  assertStorageAvailable();

  const existing = await getCustomerByPhone(input.phone);
  if (existing) return existing;

  if (hasRedis()) {
    const r = getRedis();
    const codes = (await r.smembers(`${PREFIX}customer-codes`)) as string[];
    const customer: Customer = {
      id: createId(),
      memberCode: generateMemberCode(new Set(codes)),
      name: input.name.trim(),
      phone: input.phone.trim(),
      stamps: 0,
      freeAvailable: false,
      createdAt: new Date().toISOString(),
      lastNotification: null,
      notificationAt: null,
    };
    await saveCustomerRedis(customer);
    return customer;
  }

  const store = await readFileStore();
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
  await writeFileStore(store);
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
  assertStorageAvailable();

  const customer = await getCustomerByCode(memberCode);
  if (!customer) throw new Error("CUSTOMER_NOT_FOUND");
  if (customer.freeAvailable) throw new Error("FREE_PENDING");

  const settings = await getSettings();
  const required = settings.stampsRequired;

  if (hasRedis()) {
    const r = getRedis();
    const lastAt = await r.get<string>(`${PREFIX}last-stamp:${customer.id}`);
    if (lastAt && Date.now() - new Date(lastAt).getTime() < 60_000) {
      throw new Error("TOO_SOON");
    }

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

    const visit = {
      id: createId(),
      customerId: customer.id,
      type: "stamp" as const,
      createdAt: new Date().toISOString(),
      message,
      customerName: customer.name,
      memberCode: customer.memberCode,
    };

    await saveCustomerRedis(customer);
    await r.set(`${PREFIX}last-stamp:${customer.id}`, visit.createdAt);
    await r.lpush(`${PREFIX}visits`, JSON.stringify(visit));
    await r.ltrim(`${PREFIX}visits`, 0, 99);
    return { customer, visit, message };
  }

  const store = await readFileStore();
  const row = store.customers.find((c) => c.memberCode === memberCode);
  if (!row) throw new Error("CUSTOMER_NOT_FOUND");
  if (row.freeAvailable) throw new Error("FREE_PENDING");

  const lastStamp = store.visits
    .filter((v) => v.customerId === row.id && v.type === "stamp")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (
    lastStamp &&
    Date.now() - new Date(lastStamp.createdAt).getTime() < 60_000
  ) {
    throw new Error("TOO_SOON");
  }

  row.stamps += 1;
  if (row.stamps >= required) {
    row.stamps = required;
    row.freeAvailable = true;
  }
  const message = buildStampMessage(row.stamps, required, row.freeAvailable);
  row.lastNotification = message;
  row.notificationAt = new Date().toISOString();
  const visit: Visit = {
    id: createId(),
    customerId: row.id,
    type: "stamp",
    createdAt: new Date().toISOString(),
    message,
  };
  store.visits.unshift(visit);
  await writeFileStore(store);
  return { customer: row, visit, message };
}

export async function redeemFree(memberCode: string): Promise<{
  customer: Customer;
  visit: Visit;
  message: string;
}> {
  assertStorageAvailable();

  const customer = await getCustomerByCode(memberCode);
  if (!customer) throw new Error("CUSTOMER_NOT_FOUND");
  if (!customer.freeAvailable) throw new Error("NO_FREE");

  customer.stamps = 0;
  customer.freeAvailable = false;
  const message = "تم استخدام التحليقة المجانية. دورة جديدة بدأت — بالتوفيق!";
  customer.lastNotification = message;
  customer.notificationAt = new Date().toISOString();

  const visit = {
    id: createId(),
    customerId: customer.id,
    type: "redeem" as const,
    createdAt: new Date().toISOString(),
    message,
    customerName: customer.name,
    memberCode: customer.memberCode,
  };

  if (hasRedis()) {
    const r = getRedis();
    await saveCustomerRedis(customer);
    await r.lpush(`${PREFIX}visits`, JSON.stringify(visit));
    await r.ltrim(`${PREFIX}visits`, 0, 99);
    return { customer, visit, message };
  }

  const store = await readFileStore();
  const row = store.customers.find((c) => c.memberCode === memberCode);
  if (!row) throw new Error("CUSTOMER_NOT_FOUND");
  Object.assign(row, customer);
  store.visits.unshift(visit);
  await writeFileStore(store);
  return { customer: row, visit, message };
}

export async function recentVisits(limit = 20) {
  if (hasRedis()) {
    const raw = await getRedis().lrange(`${PREFIX}visits`, 0, limit - 1);
    return raw.map((item) => {
      const visit =
        typeof item === "string"
          ? (JSON.parse(item) as Visit & {
              customerName?: string;
              memberCode?: string;
            })
          : (item as Visit & { customerName?: string; memberCode?: string });
      return {
        ...visit,
        customerName: visit.customerName ?? "—",
        memberCode: visit.memberCode ?? "—",
      };
    });
  }

  if (isVercelRuntime()) return [];

  const store = await readFileStore();
  return store.visits.slice(0, limit).map((visit) => {
    const customer = store.customers.find((c) => c.id === visit.customerId);
    return {
      ...visit,
      customerName: customer?.name ?? "—",
      memberCode: customer?.memberCode ?? "—",
    };
  });
}

export { hasRedis, isVercelRuntime };
