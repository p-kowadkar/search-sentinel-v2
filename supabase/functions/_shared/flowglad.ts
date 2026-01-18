// Flowglad rate limiting utilities for edge functions

const FLOWGLAD_API_URL = 'https://api.flowglad.com';

// Demo user ID that bypasses rate limiting
export const DEMO_USER_ID = 'demo-user-12345';

interface UsageBalance {
  availableBalance: number;
  usedBalance: number;
  totalBalance: number;
}

interface FlowgladBilling {
  checkFeatureAccess: (featureSlug: string) => boolean;
  checkUsageBalance: (usageMeterSlug: string) => UsageBalance | null;
  features: Record<string, boolean>;
  usageMeters: Record<string, UsageBalance>;
}

interface FlowgladError {
  code: string;
  message: string;
}

// Check if this is a demo user (bypasses rate limiting)
export function isDemoUser(userId: string): boolean {
  return userId === DEMO_USER_ID;
}

export async function getFlowgladBilling(customerExternalId: string): Promise<{ billing: FlowgladBilling | null; error: FlowgladError | null }> {
  const apiKey = Deno.env.get('FLOWGLAD_SECRET_KEY');
  
  if (!apiKey) {
    console.warn('FLOWGLAD_SECRET_KEY not configured, skipping rate limiting');
    return { 
      billing: {
        checkFeatureAccess: () => true,
        checkUsageBalance: () => ({ availableBalance: 999, usedBalance: 0, totalBalance: 999 }),
        features: {},
        usageMeters: {},
      }, 
      error: null 
    };
  }

  try {
    const response = await fetch(`${FLOWGLAD_API_URL}/v1/customers/external/${customerExternalId}/billing`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Customer not found - allow access for new users
        return { 
          billing: {
            checkFeatureAccess: () => true,
            checkUsageBalance: () => ({ availableBalance: 10, usedBalance: 0, totalBalance: 10 }),
            features: {},
            usageMeters: {},
          }, 
          error: null 
        };
      }
      
      const errorText = await response.text();
      console.error('Flowglad API error:', response.status, errorText);
      return { billing: null, error: { code: 'API_ERROR', message: 'Failed to check billing status' } };
    }

    const data = await response.json();
    
    const billing: FlowgladBilling = {
      features: data.features || {},
      usageMeters: data.usageMeters || {},
      checkFeatureAccess: (featureSlug: string) => {
        return data.features?.[featureSlug]?.hasAccess ?? false;
      },
      checkUsageBalance: (usageMeterSlug: string) => {
        const meter = data.usageMeters?.[usageMeterSlug];
        if (!meter) return null;
        return {
          availableBalance: meter.availableBalance ?? 0,
          usedBalance: meter.usedBalance ?? 0,
          totalBalance: meter.totalBalance ?? 0,
        };
      },
    };

    return { billing, error: null };
  } catch (error) {
    console.error('Flowglad error:', error);
    return { billing: null, error: { code: 'NETWORK_ERROR', message: 'Failed to connect to billing service' } };
  }
}

export async function recordUsageEvent(
  customerExternalId: string, 
  usageMeterSlug: string, 
  amount: number = 1
): Promise<{ success: boolean; error: FlowgladError | null }> {
  const apiKey = Deno.env.get('FLOWGLAD_SECRET_KEY');
  
  if (!apiKey) {
    console.warn('FLOWGLAD_SECRET_KEY not configured, skipping usage tracking');
    return { success: true, error: null };
  }

  try {
    const response = await fetch(`${FLOWGLAD_API_URL}/v1/usage-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerExternalId,
        usageMeterSlug,
        amount,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Flowglad usage event error:', response.status, errorText);
      return { success: false, error: { code: 'API_ERROR', message: 'Failed to record usage' } };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Flowglad usage error:', error);
    return { success: false, error: { code: 'NETWORK_ERROR', message: 'Failed to record usage' } };
  }
}

// Check if user has sufficient API credits
export async function checkApiRateLimit(
  customerExternalId: string,
  usageMeterSlug: string = 'api-requests'
): Promise<{ allowed: boolean; remaining: number; error: FlowgladError | null; isDemo: boolean }> {
  // Demo users bypass rate limiting with a limited quota
  if (isDemoUser(customerExternalId)) {
    console.log('Demo user detected, allowing with demo quota');
    return { allowed: true, remaining: 3, error: null, isDemo: true };
  }

  const { billing, error } = await getFlowgladBilling(customerExternalId);
  
  if (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: -1, error, isDemo: false };
  }

  if (!billing) {
    return { allowed: true, remaining: -1, error: null, isDemo: false };
  }

  const usage = billing.checkUsageBalance(usageMeterSlug);
  
  if (!usage) {
    return { allowed: true, remaining: -1, error: null, isDemo: false };
  }

  const allowed = usage.availableBalance > 0;
  
  return { 
    allowed, 
    remaining: usage.availableBalance,
    error: allowed ? null : { code: 'RATE_LIMIT_EXCEEDED', message: 'API rate limit exceeded. Please upgrade your plan.' },
    isDemo: false
  };
}
