export type PaymentStatus = "open" | "broadcast" | "partial" | "paid" | "expired";

export type Payment = {
  id: string;
  merchantId: string;
  merchantName: string;
  kind: "bill" | "link";
  linkId: string | null;
  title: string;
  note: string;
  amountZatoshi: string | null;
  address: string;
  addressIndex: number | null;
  sharedAddress: boolean;
  memo: string;
  status: PaymentStatus;
  receivedZatoshi: string;
  txid: string | null;
  createdAt: string;
  expiresAt: string | null;
  paidAt: string | null;
};

export type PayLink = {
  id: string;
  merchantId: string;
  merchantName: string;
  title: string;
  note: string;
  amountZatoshi: string | null;
  active: boolean;
  maxPayments: number | null;
  createdAt: string;
};

export type StoreData = {
  payments: Payment[];
  links: PayLink[];
};
