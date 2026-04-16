import type { Visit } from '../types';
import {
  HA_PROTOCOL_TEMPLATES, INITIAL_TEMPLATE, FITTING_EXTRA_TEMPLATE,
  SERVICE_TEMPLATE, REFUND_EXCHANGE_TEMPLATE, type ChecklistItem,
} from '../data/haProtocolTemplates';
import { AFTERCARE_TEMPLATES } from '../lib/templates/aftercare';
import { deriveAftercareBucket } from './visitPurposeLabel';

export function resolveTemplate(v: Visit): ChecklistItem[] {
  switch (v.visit_purpose) {
    case 'INITIAL': return INITIAL_TEMPLATE;
    case 'FITTING': {
      const n = v.fitting_session_no ?? 1;
      if (n === 1) return HA_PROTOCOL_TEMPLATES.HA_1;
      if (n === 2) return HA_PROTOCOL_TEMPLATES.HA_2;
      if (n === 3) return HA_PROTOCOL_TEMPLATES.HA_3;
      return FITTING_EXTRA_TEMPLATE;
    }
    case 'AFTERCARE': {
      const bucket = v.aftercare_bucket ?? deriveAftercareBucket(v.aftercare_month ?? 3);
      return AFTERCARE_TEMPLATES[bucket];
    }
    case 'SERVICE': return SERVICE_TEMPLATE;
    case 'REFUND_EXCHANGE': return REFUND_EXCHANGE_TEMPLATE;
  }
}
