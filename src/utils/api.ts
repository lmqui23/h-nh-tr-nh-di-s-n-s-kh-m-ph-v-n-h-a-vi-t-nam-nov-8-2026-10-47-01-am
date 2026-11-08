import { CulturalArticle, Journey, Place, Post, User } from '../types';

type ApiError = { error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: init?.body instanceof FormData
      ? init.headers
      : { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (response.status === 204) return undefined as T;
  const result = await response.json() as T & ApiError;
  if (!response.ok) throw new Error(result.error || 'Không thể hoàn tất yêu cầu.');
  return result;
}

export const api = {
  me: () => request<{ user: User | null }>('/auth/me'),
  login: (email: string, password: string) => request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: { email: string; username: string; display_name: string; password: string }) => request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  updateProfile: (data: Pick<User, 'display_name' | 'bio' | 'hometown' | 'cultural_interests' | 'privacy'>) => request<{ user: User }>('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
  updatePassword: (currentPassword: string, newPassword: string) => request<void>('/auth/password', { method: 'PATCH', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }),
  listPlaces: () => request<{ places: Place[] }>('/places'),
  listPosts: () => request<{ posts: Post[] }>('/posts'),
  listArticles: () => request<{ items: CulturalArticle[] }>('/editorial?kind=article'),
  listJourneys: () => request<{ items: Journey[] }>('/editorial?kind=journey'),
  createPost: (data: FormData) => request<{ post: { id: string; moderation_status: string; image_url: string } }>('/posts', { method: 'POST', body: data }),
  comment: (postId: string, content: string) => request<{ id: string; status: string }>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  like: (postId: string) => request<{ liked: boolean; likes: number }>(`/posts/${postId}/like`, { method: 'PUT' }),
  savePlace: (placeId: string, saved: boolean) => request<void>(`/places/${placeId}/save`, { method: saved ? 'PUT' : 'DELETE' }),
  visitPlace: (placeId: string, visited: boolean) => request<void>(`/places/${placeId}/visited`, { method: visited ? 'PUT' : 'DELETE' }),
  savePost: (postId: string, saved: boolean) => request<void>(`/posts/${postId}/save`, { method: saved ? 'PUT' : 'DELETE' }),
  visitedPlaces: () => request<{ savedPlaceIds: string[]; visitedPlaceIds: string[]; visitedMemories: Array<{ place_id: string; place_name: string; province_name: string; visited_at: string; note: string }> }>('/me/library'),
  moderatePost: (postId: string, status: 'approved' | 'rejected' | 'hidden' | 'pending', note = '') => request(`/admin/posts/${postId}/moderation`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
  editPost: (postId: string, changes: Partial<Pick<Post, 'title' | 'content' | 'place_id' | 'cultural_topic' | 'is_review' | 'rating' | 'visit_date'>>) => request(`/admin/posts/${postId}`, { method: 'PUT', body: JSON.stringify(changes) }),
  deleteOwnPost: (postId: string) => request<void>(`/posts/${postId}`, { method: 'DELETE' }),
  deleteAdminPost: (postId: string) => request<void>(`/admin/posts/${postId}`, { method: 'DELETE' }),
  replacePostImage: (postId: string, image: File) => {
    const body = new FormData();
    body.set('image', image);
    return request<{ id: string; image_url: string }>(`/admin/posts/${postId}/media`, { method: 'POST', body });
  },
  createPlace: (place: Partial<Place>) => request<{ place: Place }>('/admin/places', { method: 'POST', body: JSON.stringify({ place }) }),
  updatePlace: (placeId: string, place: Partial<Place>) => request<{ place: Place }>(`/admin/places/${placeId}`, { method: 'PUT', body: JSON.stringify({ place }) }),
  deletePlace: (placeId: string) => request<void>(`/admin/places/${placeId}`, { method: 'DELETE' }),
  setPlaceStatus: (placeId: string, status: 'published' | 'hidden' | 'deleted') => request(`/admin/places/${placeId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  saveEditorial: (item: Partial<CulturalArticle | Journey> & { kind: 'article' | 'journey' }, id?: string) => request<{ item: CulturalArticle | Journey }>(id ? `/admin/editorial/${id}` : '/admin/editorial', { method: id ? 'PUT' : 'POST', body: JSON.stringify({ item }) }),
  deleteEditorial: (id: string) => request<void>(`/admin/editorial/${id}`, { method: 'DELETE' }),
  adminEditorial: (kind: 'article' | 'journey') => request<{ items: Array<CulturalArticle | Journey> }>(`/admin/editorial?kind=${kind}`),
  replacePlaceImage: (placeId: string, image: File) => {
  const body = new FormData();
  body.set('image', image);

  return request<{
    media: {
      id: string;
      image_url: string;
    };
  }>(
    `/admin/places/${placeId}/image`,
    {
      method: 'PUT',
      body,
    }
  );
},
  adminMedia: () => request<{ items: Array<{ id: string; owner_id: string; post_id: string | null; place_id: string | null; image_url: string; original_name: string; mime_type: string; size_bytes: number; username: string; display_name: string; moderation_status: string | null; place_name: string | null }> }>('/admin/media'),
  deleteMedia: (mediaId: string) => request<void>(`/admin/media/${mediaId}`, { method: 'DELETE' }),
  adminUsers: () => request<{ users: Array<Pick<User, 'id' | 'email' | 'username' | 'display_name' | 'role' | 'status'>> }>('/admin/users'),
  updateUser: (userId: string, changes: { role?: User['role']; status?: 'active' | 'locked' }) => request(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  adminComments: () => request<{ comments: Array<{ id: string; content: string; status: string; display_name: string; username: string; created_at: string }> }>('/admin/comments'),
  moderateComment: (commentId: string, status: 'approved' | 'rejected' | 'hidden') => request(`/admin/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  dashboard: () => request<{ users: number; pendingPosts: number; pendingComments: number; places: number; media: number }>('/admin/dashboard'),
};