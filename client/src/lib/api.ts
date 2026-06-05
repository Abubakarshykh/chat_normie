const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

export const api = {
  // World
  getNormies: () => apiFetch<{ normies: any[] }>('/api/world/normies'),
  getNormie: (id: string) => apiFetch<any>(`/api/world/normies/${id}`),
  getFeed: (limit = 30) => apiFetch<{ feed: any[] }>(`/api/world/feed?limit=${limit}`),
  getStats: () => apiFetch<any>('/api/world/stats'),
  getLeaderboard: () => apiFetch<{ leaderboard: any[] }>('/api/world/leaderboard'),

  // Chat
  sendChat: (normieId: string, message: string, sessionId: string) =>
    apiFetch<any>(`/api/chat/${normieId}`, {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    }),
  getChatHistory: (normieId: string, sessionId: string) =>
    apiFetch<{ history: any[] }>(`/api/chat/${normieId}/history?sessionId=${sessionId}`),
  clearChat: (normieId: string, sessionId: string) =>
    apiFetch<any>(`/api/chat/${normieId}/history?sessionId=${sessionId}`, { method: 'DELETE' }),

  // God Mode
  getDramaTypes: () => apiFetch<{ dramaTypes: any[] }>('/api/god/drama-types'),
  triggerDrama: (dramaType?: string) =>
    apiFetch<any>('/api/god/trigger-drama', { method: 'POST', body: JSON.stringify({ dramaType }) }),
  forceConversation: (normie1Id: string, normie2Id: string) =>
    apiFetch<any>('/api/god/force-conversation', { method: 'POST', body: JSON.stringify({ normie1Id, normie2Id }) }),
  changeMood: (normieId: string, mood: string) =>
    apiFetch<any>('/api/god/change-mood', { method: 'POST', body: JSON.stringify({ normieId, mood }) }),
  boostReputation: (normieId: string, amount: number) =>
    apiFetch<any>('/api/god/boost-reputation', { method: 'POST', body: JSON.stringify({ normieId, amount }) }),
  fastTick: () => apiFetch<any>('/api/god/fast-tick', { method: 'POST' }),
};
