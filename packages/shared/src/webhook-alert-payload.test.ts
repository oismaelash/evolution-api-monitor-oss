import { describe, it, expect } from 'vitest';
import { getWebhookAlertPayloadExampleStrings } from './webhook-alert-payload.js';

describe('webhook-alert-payload', () => {
  it('getWebhookAlertPayloadExampleStrings returns valid JSON strings', () => {
    const examples = getWebhookAlertPayloadExampleStrings();
    expect(typeof examples.failure).toBe('string');
    expect(typeof examples.resolved).toBe('string');

    const failureObj = JSON.parse(examples.failure);
    expect(failureObj.instanceName).toBe('my-instance');
    expect(failureObj.errorType).toBe('NETWORK_ERROR');
    expect(failureObj.resolved).toBe(false);

    const resolvedObj = JSON.parse(examples.resolved);
    expect(resolvedObj.instanceName).toBe('my-instance');
    expect(resolvedObj.resolved).toBe(true);
    expect(resolvedObj.errorType).toBeUndefined();
  });
});
