let amplitudePromise: Promise<typeof import('@amplitude/unified')> | null = null;

function getAmplitude() {
  if (!amplitudePromise) {
    amplitudePromise = import('@amplitude/unified');
  }
  return amplitudePromise;
}

export async function initAmplitude(apiKey: string) {
  const amplitude = await getAmplitude();
  await amplitude.initAll(apiKey, {
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 1 },
  });
}

export async function track(eventName: string, properties?: Record<string, unknown>) {
  const amplitude = await getAmplitude();
  void amplitude.track(eventName, properties);
}
