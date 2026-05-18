declare module "paynowqr" {
  // Minimal shape — paynowqr is plain CommonJS, no upstream types.
  // We construct one with PayNow proxy + optional amount/reference and call
  // .output() to get the EMVCo TLV payload string.
  interface PaynowQROptions {
    uen?: string;
    mobile?: string;
    amount?: number;
    editable?: boolean;
    refNumber?: string;
    company?: string;
    expiry?: string;
  }
  class PaynowQR {
    constructor(opts: PaynowQROptions);
    output(): string;
  }
  export = PaynowQR;
}
