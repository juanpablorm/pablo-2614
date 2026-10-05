/**
 * Contrato de SnailPay (ver docs/snailpay-api.md, secciones 2 y 3).
 * Los esquemas de validación en tiempo de ejecución se agregan en la Fase 3.
 */

export const SNAILPAY_BASE_PATH = '/api/snailpay/v1';

export type ChargeStatus = 'approved' | 'rejected' | 'error';

export type ChargeStatusDetail =
  | 'accredited'
  | 'invalid_request'
  | 'invalid_security_code'
  | 'invalid_expiration_date'
  | 'insufficient_funds'
  | 'card_declined'
  | 'amount_exceeds_limit'
  | 'service_unavailable'
  | 'internal_error'
  | 'timeout'; // generado por el cliente, nunca por el servidor

export interface ChargeRequest {
  card_number: string;
  expiration_date: string;
  cvv: string;
  cardholder_name: string;
  amount: number;
  payer_id: string;
  payer_email: string;
}

export interface ChargeFieldError {
  field: string;
  message: string;
}

export interface ChargeResponse {
  id: string;
  status: ChargeStatus;
  status_detail: ChargeStatusDetail;
  transaction_amount: number | null;
  date_created: string;
  authorization_code: string | null;
  reference: string;
  payer_id: string | null;
  payer_email: string | null;
  card_number: string | null;
  cvv: string | null;
  errors?: ChargeFieldError[];
}
