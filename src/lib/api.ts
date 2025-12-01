const API_URL = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `Error ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: (rut: string, password: string) =>
      request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ rut, password }) }),
    logout: () => request<any>('/auth/logout', { method: 'POST' }),
    getUsers: () => request<any[]>('/auth/users'),
    createUser: (data: any) => request<any>('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id: number, data: any) =>
      request<any>(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteUser: (id: number) => request<any>(`/auth/users/${id}`, { method: 'DELETE' }),
    resetPassword: (id: number) =>
      request<any>(`/auth/users/${id}/reset-password`, { method: 'POST' }),
  },

  // Ingredients
  ingredients: {
    getAll: () => request<any[]>('/ingredients'),
    getById: (id: number) => request<any>(`/ingredients/${id}`),
    create: (data: any) => request<any>('/ingredients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<any>(`/ingredients/${id}`, { method: 'DELETE' }),
    restock: (id: number, data: any) => request<any>(`/ingredients/${id}/restock`, { method: 'POST', body: JSON.stringify(data) }),
    getRestocks: (id: number) => request<any[]>(`/ingredients/${id}/restocks`),
  },

  // Recipes
  recipes: {
    getAll: () => request<any[]>('/recipes'),
    getById: (id: number) => request<any>(`/recipes/${id}`),
    create: (data: any) => request<any>('/recipes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<any>(`/recipes/${id}`, { method: 'DELETE' }),
  },

  // Shifts
  shifts: {
    getAll: (params?: { date?: string; status?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/shifts${query ? `?${query}` : ''}`);
    },
    getCurrent: () => request<any>('/shifts/current'),
    create: (data: any) => request<any>('/shifts', { method: 'POST', body: JSON.stringify(data) }),
    close: (id: number) => request<any>(`/shifts/${id}/close`, { method: 'PUT' }),
    updateTask: (shiftId: number, taskId: number, completed: boolean) =>
      request<any>(`/shifts/${shiftId}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ completed }),
      }),
  },

  // Sales
  sales: {
    getAll: (params?: { shift_id?: number; date?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/sales${query ? `?${query}` : ''}`);
    },
    create: (data: any) => request<any>('/sales', { method: 'POST', body: JSON.stringify(data) }),
    getSummary: (date?: string) => {
      const query = date ? `?date=${date}` : '';
      return request<any[]>(`/sales/summary${query}`);
    },
  },

  // Alerts
  alerts: {
    getAll: (resolved?: boolean) => {
      const query = resolved !== undefined ? `?resolved=${resolved}` : '';
      return request<any[]>(`/alerts${query}`);
    },
    getCount: () => request<{ count: number }>('/alerts/count'),
    resolve: (id: number) => request<any>(`/alerts/${id}/resolve`, { method: 'PUT' }),
    createSuggestion: (message: string) => request<any>('/alerts/suggestion', { method: 'POST', body: JSON.stringify({ message }) }),
    cleanup: () => request<any>('/alerts/cleanup', { method: 'DELETE' }),
  },

  // Reports
  reports: {
    getShoppingList: (date?: string) => {
      const query = date ? `?date=${date}` : '';
      return request<any[]>(`/reports/shopping-list${query}`);
    },
    getDaily: (date?: string) => {
      const query = date ? `?date=${date}` : '';
      return request<any>(`/reports/daily${query}`);
    },
    getWeekly: (weekStart?: string) => {
      const query = weekStart ? `?week_start=${weekStart}` : '';
      return request<any>(`/reports/weekly${query}`);
    },
  },

  // Gamification
  gamification: {
    getCurrentWeek: () => request<any[]>('/gamification/current-week'),
    getLeaderboard: (limit = 10) => request<any[]>(`/gamification/leaderboard?limit=${limit}`),
    assignReward: (data: any) => request<any>('/gamification/reward', { method: 'POST', body: JSON.stringify(data) }),
    getEmployeeStats: (name: string) => request<any>(`/gamification/employee/${encodeURIComponent(name)}`),
    calculateRewards: () => request<any>('/gamification/calculate-rewards', { method: 'POST' }),
  },
};
