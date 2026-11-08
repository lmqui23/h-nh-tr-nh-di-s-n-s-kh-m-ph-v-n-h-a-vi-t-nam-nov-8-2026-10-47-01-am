import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'heritage-api-'));
process.env.NODE_ENV = 'test';
process.env.DATA_DIR = testDataDirectory;
process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.ADMIN_PASSWORD = crypto.randomBytes(24).toString('base64url');
process.env.ADMIN_USERNAME = 'integration_admin';

const { app, database } = await import('./index.js');

test('auth, ownership, image upload, persistence, moderation, and account controls', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const imagePath = fileURLToPath(new URL('../public/assets/heritage/cho-noi-cai-rang.jpg', import.meta.url));
  let userCookie = '';
  let adminCookie = '';
  const userPassword = 'a-secure-test-password-2026';
  let placeId = '';
  let postId = '';

  async function send(url, { cookie = '', sessionAs = '', ...init } = {}) {
    const headers = new Headers(init.headers);
    if (cookie) headers.set('Cookie', cookie);
    const response = await fetch(`${origin}${url}`, { ...init, headers });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const sessionCookie = setCookie.split(';')[0];
      if (sessionAs === 'admin') adminCookie = sessionCookie;
      if (sessionAs === 'user') userCookie = sessionCookie;
    }
    const text = response.status === 204 ? '' : await response.text();
    const body = text
      ? response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : text
      : null;
    return { response, body };
  }

  const json = (value) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });

  try {
    await t.test('server health and account creation', async () => {
      const health = await send('/api/health');
      assert.equal(health.response.status, 200);

      const registration = await send('/api/auth/register', { ...json({
        email: 'member@example.test',
        username: 'test_member',
        display_name: 'Integration Member',
        password: userPassword,
      }), sessionAs: 'user' });
      assert.equal(registration.response.status, 201);
      assert.equal(registration.body.user.role, 'user');
      assert.equal(registration.body.user.password_hash, undefined);
      assert.ok(userCookie.startsWith('heritage_session='));

      const adminLogin = await send('/api/auth/login', { ...json({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }), sessionAs: 'admin' });
      assert.equal(adminLogin.response.status, 200);
      assert.equal(adminLogin.body.user.role, 'admin');
      assert.ok(adminCookie.startsWith('heritage_session='));
    });

    await t.test('server-enforced roles and database-backed place CRUD', async () => {
      const forbidden = await send('/api/admin/places', { ...json({ place: { name: 'Unauthorized place' } }), cookie: userCookie });
      assert.equal(forbidden.response.status, 403);

      const created = await send('/api/admin/places', {
        ...json({ place: { name: 'Kiểm thử địa điểm', province_name: 'Cần Thơ', category_id: 'di-tich-lich-su', coordinates: { lat: 10, lng: 105 } } }),
        cookie: adminCookie,
      });
      assert.equal(created.response.status, 201);
      placeId = created.body.place.id;
      assert.equal(created.body.place.status, 'hidden');

      const initiallyHidden = await send('/api/places');
      assert.ok(!initiallyHidden.body.places.some((place) => place.id === placeId));
      const published = await send(`/api/admin/places/${placeId}/status`, {
        ...json({ status: 'published' }),
        method: 'PATCH',
        cookie: adminCookie,
      });
      assert.equal(published.response.status, 200);

      const edited = await send(`/api/admin/places/${placeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place: { name: 'Kiểm thử địa điểm đã sửa', province_name: 'Cần Thơ', category_id: 'di-tich-lich-su' } }),
        cookie: adminCookie,
      });
      assert.equal(edited.body.place.name, 'Kiểm thử địa điểm đã sửa');

      const publicPlaces = await send('/api/places');
      assert.ok(publicPlaces.body.places.some((place) => place.id === placeId));

      const placeImage = new FormData();
      placeImage.set('image', new Blob([fs.readFileSync(imagePath)], { type: 'image/jpeg' }), 'place.jpg');
      const uploadedPlaceImage = await send(`/api/admin/places/${placeId}/media`, { method: 'POST', body: placeImage, cookie: adminCookie });
      assert.equal(uploadedPlaceImage.response.status, 201);

      const videoForm = new FormData();
      videoForm.set('image', new Blob([Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d])], { type: 'video/mp4' }), 'heritage.mp4');
      const uploadedVideo = await send(`/api/admin/places/${placeId}/media`, { method: 'POST', body: videoForm, cookie: adminCookie });
      assert.equal(uploadedVideo.response.status, 201);
      assert.equal(uploadedVideo.body.media.media_type, 'video');
      assert.match((await send(uploadedVideo.body.media.image_url)).response.headers.get('content-type'), /video\/mp4/);

      const documentForm = new FormData();
      documentForm.set('image', new Blob([Buffer.from('%PDF-1.7\nverified heritage record')], { type: 'application/pdf' }), 'record.pdf');
      const uploadedDocument = await send(`/api/admin/places/${placeId}/media`, { method: 'POST', body: documentForm, cookie: adminCookie });
      assert.equal(uploadedDocument.response.status, 201);
      assert.equal(uploadedDocument.body.media.media_type, 'document');
      assert.match((await send(uploadedDocument.body.media.image_url)).response.headers.get('content-type'), /application\/pdf/);

      const storedMedia = await send('/api/admin/media', { cookie: adminCookie });
      assert.ok(storedMedia.body.items.some((media) => media.id === uploadedPlaceImage.body.media.id));

      const article = await send('/api/admin/editorial', {
        ...json({ item: { kind: 'article', slug: 'integration-article', title: 'Integration Article', status: 'hidden', sections: [], tags: [], source_citations: [] } }),
        cookie: adminCookie,
      });
      assert.equal(article.response.status, 201);
      assert.ok(!(await send('/api/editorial?kind=article')).body.items.some((item) => item.id === article.body.item.id));
      const updatedArticle = await send(`/api/admin/editorial/${article.body.item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: { ...article.body.item, title: 'Edited Article', status: 'published' } }),
        cookie: adminCookie,
      });
      assert.equal(updatedArticle.body.item.title, 'Edited Article');
      assert.ok((await send('/api/editorial?kind=article')).body.items.some((item) => item.id === article.body.item.id));
      assert.equal((await send(`/api/admin/editorial/${article.body.item.id}`, { method: 'DELETE', cookie: adminCookie })).response.status, 204);
    });

    await t.test('actual image upload, post persistence, and approval visibility', async () => {
      const form = new FormData();
      form.set('title', 'Bài kiểm thử có tiêu đề');
      form.set('content', 'Bài kiểm thử lưu vào cơ sở dữ liệu.');
      form.set('place_id', placeId);
      form.set('is_review', 'true');
      form.set('rating', '5');
      form.set('visit_date', '2026-11-08');
      form.set('image', new Blob([fs.readFileSync(imagePath)], { type: 'image/jpeg' }), 'market.jpg');
      const created = await send('/api/posts', { method: 'POST', body: form, cookie: userCookie });
      assert.equal(created.response.status, 201);
      assert.equal(created.body.post.moderation_status, 'pending');
      postId = created.body.post.id;

      const requestChanges = await send(`/api/admin/posts/${postId}/moderation`, {
        ...json({ status: 'pending', note: 'Bổ sung nguồn ảnh trước khi công khai.' }),
        method: 'PATCH',
        cookie: adminCookie,
      });
      assert.equal(requestChanges.response.status, 200);

      const userFeed = await send('/api/posts', { cookie: userCookie });
      assert.ok(userFeed.body.posts.some((post) => post.id === postId && post.images.length === 1 && post.moderation_note));
      const guestFeed = await send('/api/posts');
      assert.ok(!guestFeed.body.posts.some((post) => post.id === postId));

      const mediaPath = userFeed.body.posts.find((post) => post.id === postId).images[0].image_url;
      assert.equal((await send(mediaPath)).response.status, 404);
      const imageResponse = await send(mediaPath, { cookie: userCookie });
      assert.equal(imageResponse.response.status, 200);
      assert.match(imageResponse.response.headers.get('content-type'), /image\/jpeg/);

      const editedPost = await send(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Tiêu đề được Admin chỉnh sửa', content: 'Nội dung đã được Admin chỉnh sửa.', cultural_topic: 'Di sản đã biên tập' }),
        cookie: adminCookie,
      });
      assert.equal(editedPost.body.title, 'Tiêu đề được Admin chỉnh sửa');
      assert.equal(editedPost.body.content, 'Nội dung đã được Admin chỉnh sửa.');
      const replacementImage = new FormData();
      replacementImage.set('image', new Blob([fs.readFileSync(imagePath)], { type: 'image/jpeg' }), 'replacement.jpg');
      const replacement = await send(`/api/admin/posts/${postId}/media`, { method: 'POST', body: replacementImage, cookie: adminCookie });
      assert.equal(replacement.response.status, 201);
      assert.notEqual(replacement.body.image_url, mediaPath);
      assert.equal((await send(mediaPath, { cookie: userCookie })).response.status, 404);

      const approved = await send(`/api/admin/posts/${postId}/moderation`, {
        ...json({ status: 'approved' }),
        method: 'PATCH',
        cookie: adminCookie,
      });
      assert.equal(approved.response.status, 200);
      const publicFeed = await send('/api/posts');
      assert.equal(publicFeed.body.posts.find((post) => post.id === postId).content, 'Nội dung đã được Admin chỉnh sửa.');
      assert.equal((await send(replacement.body.image_url)).response.status, 200);
    });

    await t.test('comments, saved items, visits, and lockout persist', async () => {
      const comment = await send(`/api/posts/${postId}/comments`, {
        ...json({ content: 'Bình luận đang chờ duyệt.' }),
        cookie: userCookie,
      });
      assert.equal(comment.response.status, 201);
      assert.equal(comment.body.status, 'pending');

      const commentQueue = await send('/api/admin/comments', { cookie: adminCookie });
      assert.ok(commentQueue.body.comments.some((item) => item.id === comment.body.id));
      const approvedComment = await send(`/api/admin/comments/${comment.body.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
        cookie: adminCookie,
      });
      assert.equal(approvedComment.response.status, 200);

      assert.equal((await send(`/api/posts/${postId}/like`, { method: 'PUT', cookie: userCookie })).response.status, 200);
      assert.equal((await send(`/api/posts/${postId}/save`, { method: 'PUT', cookie: userCookie })).response.status, 204);
      assert.equal((await send(`/api/places/${placeId}/save`, { method: 'PUT', cookie: userCookie })).response.status, 204);
      assert.equal((await send(`/api/places/${placeId}/visited`, { method: 'PUT', cookie: userCookie })).response.status, 204);

      const library = await send('/api/me/library', { cookie: userCookie });
      assert.ok(library.body.savedPlaceIds.includes(placeId));
      assert.ok(library.body.visitedPlaceIds.includes(placeId));
      assert.ok(library.body.visitedMemories.some((memory) => memory.place_id === placeId));

      assert.equal((await send(`/api/posts/${postId}`, { method: 'DELETE', cookie: adminCookie })).response.status, 403);
      assert.equal((await send(`/api/posts/${postId}`, { method: 'DELETE', cookie: userCookie })).response.status, 204);
      assert.ok(!(await send('/api/posts')).body.posts.some((post) => post.id === postId));
      assert.equal((await send(`/api/admin/posts/${postId}`, { method: 'DELETE', cookie: adminCookie })).response.status, 204);

      const profile = await send('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: 'Member Updated', bio: 'A real profile update.', hometown: 'Cần Thơ', cultural_interests: ['Di sản'], privacy: 'public' }),
        cookie: userCookie,
      });
      assert.equal(profile.body.user.display_name, 'Member Updated');
      assert.equal(profile.body.user.privacy, 'public');

      const passwordChange = await send('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: userPassword, new_password: 'a-different-secure-password-2026' }),
        cookie: userCookie,
      });
      assert.equal(passwordChange.response.status, 204);
      assert.equal((await send('/api/auth/login', json({ email: 'member@example.test', password: userPassword }))).response.status, 401);
      const renewedLogin = await send('/api/auth/login', { ...json({ email: 'member@example.test', password: 'a-different-secure-password-2026' }), sessionAs: 'user' });
      assert.equal(renewedLogin.response.status, 200);

      const adminUsers = await send('/api/admin/users', { cookie: adminCookie });
      const member = adminUsers.body.users.find((item) => item.username === 'test_member');
      assert.ok(member);
      const locked = await send(`/api/admin/users/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'locked' }),
        cookie: adminCookie,
      });
      assert.equal(locked.body.user.status, 'locked');
      const lockedSession = await send('/api/auth/me', { cookie: userCookie });
      assert.equal(lockedSession.body.user, null);
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    database.close();
    fs.rmSync(testDataDirectory, { recursive: true, force: true });
  }
});