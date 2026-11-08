import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = path.resolve(process.env.DATA_DIR || path.join(root, 'data'));
const uploadDirectory = path.join(dataDirectory, 'uploads');
const databasePath = path.join(dataDirectory, 'heritage.sqlite');
fs.mkdirSync(uploadDirectory, { recursive: true });

const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked')),
    avatar TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    hometown TEXT NOT NULL DEFAULT '',
    cultural_interests_json TEXT NOT NULL DEFAULT '[]',
    privacy TEXT NOT NULL DEFAULT 'private' CHECK (privacy IN ('public', 'private')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    province_name TEXT NOT NULL,
    category_id TEXT NOT NULL,
    data_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'deleted')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    place_id TEXT REFERENCES places(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    cultural_topic TEXT NOT NULL DEFAULT '',
    is_review INTEGER NOT NULL DEFAULT 0,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    visit_date TEXT,
    moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden')),
    moderation_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id),
    post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
    place_id TEXT REFERENCES places(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS post_likes (
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS saved_places (
    place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (place_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS saved_posts (
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS visited_places (
    place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (place_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS editorial_content (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('article', 'journey')),
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    data_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'deleted')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(kind, slug)
  );
  CREATE INDEX IF NOT EXISTS posts_status_created ON posts(moderation_status, created_at DESC);
  CREATE INDEX IF NOT EXISTS comments_status_created ON comments(status, created_at DESC);
  CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
`);
if (!database.pragma('table_info(posts)').some((column) => column.name === 'title')) {
  database.exec("ALTER TABLE posts ADD COLUMN title TEXT NOT NULL DEFAULT ''");
}

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '1mb' }));

const cookieName = 'heritage_session';
const sessionLifetime = 1000 * 60 * 60 * 24 * 14;
const isProduction = process.env.NODE_ENV === 'production';

function sendSessionCookie(response, token) {
  const secure = isProduction ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${cookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionLifetime / 1000}${secure}`);
}

function clearSessionCookie(response) {
  const secure = isProduction ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

function readCookie(request, name) {
  const cookie = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : '';
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function passwordHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function publicUser(user) {
  if (!user) return null;
  const { password_hash: _passwordHash, ...safeUser } = user;
  return {
    ...safeUser,
    avatar: user.avatar || '',
    bio: user.bio || '',
    hometown: user.hometown || '',
    cultural_interests: parseJson(user.cultural_interests_json, []),
    followers_count: 0,
    following_count: 0,
    privacy: user.privacy || 'private',
  };
}

function issueSession(userId, response) {
  const token = crypto.randomBytes(32).toString('base64url');
  database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(hashToken(token), userId, Date.now() + sessionLifetime);
  sendSessionCookie(response, token);
}

function attachUser(request, _response, next) {
  const token = readCookie(request, cookieName);
  if (token) {
    const tokenHash = hashToken(token);
    const session = database.prepare(`
      SELECT users.*, sessions.expires_at FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
    `).get(tokenHash);
    if (session && session.expires_at > Date.now() && session.status === 'active') {
      request.user = session;
    } else if (session) {
      database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    }
  }
  next();
}

function requireAuth(request, response, next) {
  if (!request.user) return response.status(401).json({ error: 'Đăng nhập để tiếp tục.' });
  next();
}

function requireModerator(request, response, next) {
  if (!request.user || !['moderator', 'admin'].includes(request.user.role)) {
    return response.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này.' });
  }
  next();
}

function requireAdmin(request, response, next) {
  if (!request.user || request.user.role !== 'admin') {
    return response.status(403).json({ error: 'Chỉ Admin mới được thực hiện thao tác này.' });
  }
  next();
}

function parseJson(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function placeFromRow(row) {
  return { ...parseJson(row.data_json), id: row.id, slug: row.slug, name: row.name, province_name: row.province_name, category_id: row.category_id, status: row.status };
}

function editorialFromRow(row) {
  return { ...parseJson(row.data_json), id: row.id, slug: row.slug, title: row.title, status: row.status };
}

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
const imageStorage = multer.diskStorage({
  destination(request, _file, callback) {
    const directory = path.join(uploadDirectory, request.user.id);
    fs.mkdirSync(directory, { recursive: true });
    callback(null, directory);
  },
  filename(_request, file, callback) {
    const extension = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
      'video/mp4': '.mp4', 'video/webm': '.webm', 'application/pdf': '.pdf',
    }[file.mimetype];
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});
const upload = multer({
  storage: imageStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    callback(null, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype));
  },
});
const adminMediaUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    callback(null, ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf'].includes(file.mimetype));
  },
});

function imageSignatureIsValid(file) {
  const bytes = Buffer.alloc(12);
  const descriptor = fs.openSync(file.path, 'r');
  try {
    fs.readSync(descriptor, bytes, 0, bytes.length, 0);
  } finally {
    fs.closeSync(descriptor);
  }
  if (file.mimetype === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimetype === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === 'image/gif') return bytes.toString('ascii', 0, 3) === 'GIF';
  return file.mimetype === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
}

function adminMediaSignatureIsValid(file) {
  if (file.mimetype.startsWith('image/')) return imageSignatureIsValid(file);
  const bytes = Buffer.alloc(12);
  const descriptor = fs.openSync(file.path, 'r');
  try {
    fs.readSync(descriptor, bytes, 0, bytes.length, 0);
  } finally {
    fs.closeSync(descriptor);
  }
  if (file.mimetype === 'video/mp4') return bytes.toString('ascii', 4, 8) === 'ftyp';
  if (file.mimetype === 'video/webm') return bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return file.mimetype === 'application/pdf' && bytes.toString('ascii', 0, 5) === '%PDF-';
}

app.use(attachUser);

app.get('/uploads/:ownerId/:filename', (request, response) => {
  const media = database.prepare(`
    SELECT media.*, posts.moderation_status, places.status AS place_status
    FROM media
    LEFT JOIN posts ON posts.id = media.post_id
    LEFT JOIN places ON places.id = media.place_id
    WHERE media.owner_id = ? AND media.file_path = ?
  `).get(request.params.ownerId, request.params.filename);
  if (!media) return response.status(404).end();
  const isOwner = request.user?.id === media.owner_id;
  const canModerate = request.user && ['admin', 'moderator'].includes(request.user.role);
  const isPublic = media.post_id
    ? media.moderation_status === 'approved'
    : media.place_id && media.place_status === 'published';
  if (!isOwner && !canModerate && !isPublic) return response.status(404).end();
  const filePath = path.resolve(uploadDirectory, media.owner_id, media.file_path);
  const userDirectory = `${path.resolve(uploadDirectory, media.owner_id)}${path.sep}`;
  if (!filePath.startsWith(userDirectory)) return response.status(404).end();
  response.type(media.mime_type).sendFile(filePath, (error) => {
    if (error && !response.headersSent) response.status(error.statusCode || 404).end();
  });
});

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

app.post('/api/auth/register', authLimiter, (request, response) => {
  const email = String(request.body.email || '').trim().toLowerCase();
  const username = String(request.body.username || '').trim().toLowerCase();
  const displayName = String(request.body.display_name || '').trim();
  const password = String(request.body.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email) || !/^[a-z0-9_]{3,30}$/.test(username) || displayName.length < 2 || displayName.length > 80 || password.length < 12) {
    return response.status(400).json({ error: 'Nhập email hợp lệ, username 3-30 ký tự, tên hiển thị và mật khẩu tối thiểu 12 ký tự.' });
  }
  const user = { id: crypto.randomUUID(), email, username, display_name: displayName, password_hash: passwordHash(password) };
  try {
    database.prepare('INSERT INTO users (id, email, username, display_name, password_hash) VALUES (@id, @email, @username, @display_name, @password_hash)').run(user);
  } catch (error) {
    if (String(error.code).startsWith('SQLITE_CONSTRAINT')) return response.status(409).json({ error: 'Email hoặc username đã được sử dụng.' });
    throw error;
  }
  issueSession(user.id, response);
  response.status(201).json({ user: publicUser(database.prepare('SELECT * FROM users WHERE id = ?').get(user.id)) });
});

app.post('/api/auth/login', authLimiter, (request, response) => {
  const email = String(request.body.email || '').trim().toLowerCase();
  const password = String(request.body.password || '');
  const user = database.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || user.status !== 'active' || !verifyPassword(password, user.password_hash)) {
    return response.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
  }
  issueSession(user.id, response);
  response.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (request, response) => {
  const token = readCookie(request, cookieName);
  if (token) database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  clearSessionCookie(response);
  response.status(204).end();
});

app.get('/api/auth/me', (request, response) => response.json({ user: publicUser(request.user) }));

app.patch('/api/auth/me', requireAuth, (request, response) => {
  const displayName = String(request.body.display_name || '').trim();
  const bio = String(request.body.bio || '').trim();
  const hometown = String(request.body.hometown || '').trim();
  const interests = Array.isArray(request.body.cultural_interests) ? request.body.cultural_interests.map((value) => String(value).trim()).filter(Boolean).slice(0, 20) : [];
  const privacy = request.body.privacy === 'public' ? 'public' : 'private';
  if (displayName.length < 2 || displayName.length > 80 || bio.length > 500 || hometown.length > 120) return response.status(400).json({ error: 'Thông tin hồ sơ không hợp lệ.' });
  database.prepare('UPDATE users SET display_name = ?, bio = ?, hometown = ?, cultural_interests_json = ?, privacy = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(displayName, bio, hometown, JSON.stringify(interests), privacy, request.user.id);
  response.json({ user: publicUser(database.prepare('SELECT * FROM users WHERE id = ?').get(request.user.id)) });
});

app.patch('/api/auth/password', requireAuth, authLimiter, (request, response) => {
  const currentPassword = String(request.body.current_password || '');
  const newPassword = String(request.body.new_password || '');
  if (!verifyPassword(currentPassword, request.user.password_hash)) return response.status(400).json({ error: 'Mật khẩu hiện tại không chính xác.' });
  if (newPassword.length < 12 || newPassword.length > 200 || newPassword === currentPassword) return response.status(400).json({ error: 'Mật khẩu mới cần từ 12 ký tự và phải khác mật khẩu hiện tại.' });
  const currentToken = readCookie(request, cookieName);
  database.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(passwordHash(newPassword), request.user.id);
  database.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(request.user.id, hashToken(currentToken));
  response.status(204).end();
});

app.get('/api/places', (request, response) => {
  const includeHidden = request.user && ['admin', 'moderator'].includes(request.user.role);
  const rows = database.prepare(`SELECT * FROM places WHERE status ${includeHidden ? "!= 'deleted'" : "= 'published'"} ORDER BY name`).all();
  const savedCount = database.prepare('SELECT COUNT(*) AS count FROM saved_places WHERE place_id = ?');
  const visitedCount = database.prepare('SELECT COUNT(*) AS count FROM visited_places WHERE place_id = ?');
  const reviewStats = database.prepare(`SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS rating FROM posts WHERE place_id = ? AND is_review = 1 AND rating IS NOT NULL AND moderation_status = 'approved'`);
  const places = rows.map((row) => {
    const place = placeFromRow(row);
    const reviews = reviewStats.get(row.id);
    place.stats = {
      savedCount: savedCount.get(row.id).count,
      visitedCount: visitedCount.get(row.id).count,
      reviewCount: reviews.count,
      rating: Number(reviews.rating),
    };
    return place;
  });
  response.json({ places });
});

app.get('/api/editorial', (request, response) => {
  const kind = String(request.query.kind || '');
  if (!['article', 'journey'].includes(kind)) return response.status(400).json({ error: 'Loại nội dung không hợp lệ.' });
  const canModerate = request.user && ['admin', 'moderator'].includes(request.user.role);
  const rows = database.prepare(`SELECT * FROM editorial_content WHERE kind = ? AND status ${canModerate ? "!= 'deleted'" : "= 'published'"} ORDER BY title`).all(kind);
  response.json({ items: rows.map(editorialFromRow) });
});

app.get('/api/admin/editorial', requireAuth, requireModerator, (request, response) => {
  const kind = String(request.query.kind || '');
  if (!['article', 'journey'].includes(kind)) return response.status(400).json({ error: 'Loại nội dung không hợp lệ.' });
  const rows = database.prepare("SELECT * FROM editorial_content WHERE kind = ? AND status != 'deleted' ORDER BY updated_at DESC").all(kind);
  response.json({ items: rows.map(editorialFromRow) });
});

app.get('/api/posts', (request, response) => {
  const canModerate = request.user && ['admin', 'moderator'].includes(request.user.role);
  const rows = canModerate
    ? database.prepare(`SELECT posts.*, users.username, users.display_name, users.avatar, users.role, places.name AS place_name FROM posts JOIN users ON users.id = posts.user_id LEFT JOIN places ON places.id = posts.place_id ORDER BY posts.created_at DESC`).all()
    : database.prepare(`SELECT posts.*, users.username, users.display_name, users.avatar, users.role, places.name AS place_name FROM posts JOIN users ON users.id = posts.user_id LEFT JOIN places ON places.id = posts.place_id WHERE posts.moderation_status = 'approved' OR posts.user_id = ? ORDER BY posts.created_at DESC`).all(request.user?.id || '');
  const mediaQuery = database.prepare(`SELECT media.id, media.owner_id, media.original_name, media.mime_type, '/uploads/' || media.owner_id || '/' || media.file_path AS image_url, users.display_name AS photographer FROM media JOIN users ON users.id = media.owner_id WHERE media.post_id = ? ORDER BY media.created_at`);
  const commentsQuery = database.prepare(`SELECT comments.id, comments.content AS text, comments.created_at, users.id AS user_id, users.username, users.display_name, users.avatar FROM comments JOIN users ON users.id = comments.user_id WHERE comments.post_id = ? AND comments.status = 'approved' ORDER BY comments.created_at`);
  const likesQuery = database.prepare('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?');
  const myLikeQuery = database.prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?');
  const mySaveQuery = database.prepare('SELECT 1 FROM saved_posts WHERE post_id = ? AND user_id = ?');
  const posts = rows.map((row) => ({
    id: row.id,
    user: { id: row.user_id, username: row.username, display_name: row.display_name, avatar: row.avatar, role: row.role },
    created_at: row.created_at,
    title: row.title,
    content: row.content,
    place_id: row.place_id,
    cultural_topic: row.cultural_topic,
    images: mediaQuery.all(row.id).map((image) => ({
      id: image.id,
      image_url: image.image_url,
      source_url: '',
      source_name: 'Ảnh do người dùng tải lên',
      photographer: image.photographer,
      license_type: 'User-provided',
      attribution_text: 'Ảnh do người dùng cung cấp; quyền tác giả thuộc người chụp',
      verification_status: row.moderation_status === 'approved' ? 'verified' : 'pending',
    })),
    is_review: Boolean(row.is_review),
    rating: row.rating,
    visit_date: row.visit_date,
    moderation_status: row.moderation_status,
    moderation_note: row.moderation_note,
    likes: likesQuery.get(row.id).count,
    has_liked: request.user ? Boolean(myLikeQuery.get(row.id, request.user.id)) : false,
    saved: request.user ? Boolean(mySaveQuery.get(row.id, request.user.id)) : false,
    comments: commentsQuery.all(row.id).map((comment) => ({ ...comment, user: { id: comment.user_id, username: comment.username, display_name: comment.display_name, avatar: comment.avatar } })),
  }));
  response.json({ posts });
});

app.post('/api/posts', requireAuth, upload.single('image'), (request, response) => {
  const title = String(request.body.title || '').trim();
  const content = String(request.body.content || '').trim();
  if (!request.file) return response.status(400).json({ error: 'Bài viết bắt buộc phải có ảnh.' });
  if (!imageSignatureIsValid(request.file)) {
    fs.unlinkSync(request.file.path);
    return response.status(400).json({ error: 'Tệp tải lên không phải ảnh hợp lệ.' });
  }
  if (title.length < 2 || title.length > 160 || content.length < 3 || content.length > 5000) {
    fs.unlinkSync(request.file.path);
    return response.status(400).json({ error: 'Tiêu đề phải dài 2-160 ký tự và nội dung 3-5000 ký tự.' });
  }
  const placeId = request.body.place_id || null;
  if (placeId && !database.prepare("SELECT id FROM places WHERE id = ? AND status = 'published'").get(placeId)) {
    fs.unlinkSync(request.file.path);
    return response.status(400).json({ error: 'Địa điểm không tồn tại hoặc chưa được công khai.' });
  }
  const postId = crypto.randomUUID();
  const mediaId = crypto.randomUUID();
  const isReview = request.body.is_review === 'true';
  const rating = isReview ? Number(request.body.rating) : null;
  if (isReview && (!Number.isInteger(rating) || rating < 1 || rating > 5 || !placeId)) {
    fs.unlinkSync(request.file.path);
    return response.status(400).json({ error: 'Đánh giá cần địa điểm và số sao từ 1 đến 5.' });
  }
  const createPost = database.transaction(() => {
    database.prepare(`INSERT INTO posts (id, user_id, place_id, title, content, cultural_topic, is_review, rating, visit_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(postId, request.user.id, placeId, title, content, String(request.body.cultural_topic || '').slice(0, 120), Number(isReview), rating, isReview ? String(request.body.visit_date || '').slice(0, 20) : null);
    database.prepare(`INSERT INTO media (id, owner_id, post_id, file_path, original_name, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(mediaId, request.user.id, postId, path.basename(request.file.path), path.basename(request.file.originalname).slice(0, 180), request.file.mimetype, request.file.size);
  });
  try {
    createPost();
  } catch (error) {
    fs.unlinkSync(request.file.path);
    throw error;
  }
  response.status(201).json({ post: { id: postId, moderation_status: 'pending', image_url: `/uploads/${request.user.id}/${path.basename(request.file.path)}` } });
});

app.post('/api/posts/:postId/comments', requireAuth, (request, response) => {
  const post = database.prepare('SELECT moderation_status FROM posts WHERE id = ?').get(request.params.postId);
  const content = String(request.body.content || '').trim();
  if (!post || post.moderation_status !== 'approved') return response.status(404).json({ error: 'Không tìm thấy bài viết công khai.' });
  if (content.length < 1 || content.length > 1000) return response.status(400).json({ error: 'Bình luận phải có tối đa 1000 ký tự.' });
  const id = crypto.randomUUID();
  database.prepare('INSERT INTO comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, request.params.postId, request.user.id, content);
  response.status(201).json({ id, status: 'pending' });
});

app.delete('/api/posts/:postId', requireAuth, (request, response) => {
  const post = database.prepare('SELECT id, user_id FROM posts WHERE id = ?').get(request.params.postId);
  if (!post) return response.status(404).json({ error: 'Không tìm thấy bài viết.' });
  if (post.user_id !== request.user.id) return response.status(403).json({ error: 'Bạn chỉ có thể gỡ bài viết của mình.' });
  database.prepare("UPDATE posts SET moderation_status = 'rejected', moderation_note = 'Đã gỡ theo yêu cầu của tác giả', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(post.id);
  response.status(204).end();
});

app.put('/api/posts/:postId/like', requireAuth, (request, response) => {
  const post = database.prepare("SELECT id FROM posts WHERE id = ? AND moderation_status = 'approved'").get(request.params.postId);
  if (!post) return response.status(404).json({ error: 'Không tìm thấy bài viết công khai.' });
  const existing = database.prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?').get(post.id, request.user.id);
  if (existing) database.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(post.id, request.user.id);
  else database.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(post.id, request.user.id);
  response.json({ liked: !existing, likes: database.prepare('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?').get(post.id).count });
});

app.put('/api/places/:placeId/save', requireAuth, (request, response) => {
  const exists = database.prepare("SELECT id FROM places WHERE id = ? AND status = 'published'").get(request.params.placeId);
  if (!exists) return response.status(404).json({ error: 'Không tìm thấy địa điểm.' });
  database.prepare('INSERT OR IGNORE INTO saved_places (place_id, user_id) VALUES (?, ?)').run(exists.id, request.user.id);
  response.status(204).end();
});

app.delete('/api/places/:placeId/save', requireAuth, (request, response) => {
  database.prepare('DELETE FROM saved_places WHERE place_id = ? AND user_id = ?').run(request.params.placeId, request.user.id);
  response.status(204).end();
});

app.put('/api/places/:placeId/visited', requireAuth, (request, response) => {
  const exists = database.prepare("SELECT id FROM places WHERE id = ? AND status = 'published'").get(request.params.placeId);
  if (!exists) return response.status(404).json({ error: 'Không tìm thấy địa điểm.' });
  database.prepare('INSERT OR IGNORE INTO visited_places (place_id, user_id, note) VALUES (?, ?, ?)')
    .run(exists.id, request.user.id, String(request.body.note || '').slice(0, 1000));
  response.status(204).end();
});

app.delete('/api/places/:placeId/visited', requireAuth, (request, response) => {
  database.prepare('DELETE FROM visited_places WHERE place_id = ? AND user_id = ?').run(request.params.placeId, request.user.id);
  response.status(204).end();
});

app.put('/api/posts/:postId/save', requireAuth, (request, response) => {
  const exists = database.prepare("SELECT id FROM posts WHERE id = ? AND moderation_status = 'approved'").get(request.params.postId);
  if (!exists) return response.status(404).json({ error: 'Không tìm thấy bài viết.' });
  database.prepare('INSERT OR IGNORE INTO saved_posts (post_id, user_id) VALUES (?, ?)').run(exists.id, request.user.id);
  response.status(204).end();
});

app.delete('/api/posts/:postId/save', requireAuth, (request, response) => {
  database.prepare('DELETE FROM saved_posts WHERE post_id = ? AND user_id = ?').run(request.params.postId, request.user.id);
  response.status(204).end();
});

app.get('/api/me/library', requireAuth, (request, response) => {
  response.json({
    savedPlaceIds: database.prepare('SELECT place_id FROM saved_places WHERE user_id = ?').all(request.user.id).map((row) => row.place_id),
    visitedPlaceIds: database.prepare('SELECT place_id FROM visited_places WHERE user_id = ?').all(request.user.id).map((row) => row.place_id),
    visitedMemories: database.prepare(`SELECT visited_places.place_id, places.name AS place_name, places.province_name, visited_places.visited_at, visited_places.note FROM visited_places JOIN places ON places.id = visited_places.place_id WHERE visited_places.user_id = ? ORDER BY visited_places.visited_at DESC`).all(request.user.id),
  });
});

app.post('/api/admin/places', requireAuth, requireAdmin, (request, response) => {
  const data = request.body.place || {};
  const id = crypto.randomUUID();
  const status = data.status === 'published' ? 'published' : 'hidden';
  const slug = String(data.slug || data.name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const name = String(data.name || '').trim();
  if (name.length < 2 || !slug || !String(data.province_name || '').trim() || !String(data.category_id || '').trim()) return response.status(400).json({ error: 'Tên, tỉnh/thành và danh mục là bắt buộc.' });
  try {
    database.prepare('INSERT INTO places (id, slug, name, province_name, category_id, data_json, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, slug, name, String(data.province_name).trim(), String(data.category_id), JSON.stringify({ ...data, id, slug, name, status }), status);
  } catch (error) {
    if (String(error.code).startsWith('SQLITE_CONSTRAINT')) return response.status(409).json({ error: 'Slug địa điểm đã tồn tại.' });
    throw error;
  }
  response.status(201).json({ place: placeFromRow(database.prepare('SELECT * FROM places WHERE id = ?').get(id)) });
});

app.post('/api/admin/places/:placeId/media', requireAuth, requireAdmin, adminMediaUpload.single('image'), (request, response) => {
  const place = database.prepare('SELECT * FROM places WHERE id = ?').get(request.params.placeId);
  if (!place) {
    if (request.file) fs.unlinkSync(request.file.path);
    return response.status(404).json({ error: 'Không tìm thấy địa điểm.' });
  }
  if (!request.file || !adminMediaSignatureIsValid(request.file)) {
    if (request.file) fs.unlinkSync(request.file.path);
    return response.status(400).json({ error: 'Tải lên tệp ảnh hợp lệ.' });
  }
  const id = crypto.randomUUID();
  const filename = path.basename(request.file.path);
  const mediaAsset = {
    id,
    image_url: `/uploads/${request.user.id}/${filename}`,
    media_type: request.file.mimetype.startsWith('image/') ? 'image' : request.file.mimetype.startsWith('video/') ? 'video' : 'document',
    source_url: '',
    source_name: 'Ảnh do quản trị viên cung cấp',
    photographer: request.user.display_name,
    license_type: 'User-provided',
    attribution_text: 'Ảnh do quản trị viên cung cấp; quyền sử dụng đã được xác nhận',
    verification_status: 'verified',
  };
  const data = parseJson(place.data_json);
  data.media = [...(Array.isArray(data.media) ? data.media : []), mediaAsset];
  const saveMedia = database.transaction(() => {
    database.prepare('INSERT INTO media (id, owner_id, place_id, file_path, original_name, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, request.user.id, place.id, filename, path.basename(request.file.originalname).slice(0, 180), request.file.mimetype, request.file.size);
    database.prepare('UPDATE places SET data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(JSON.stringify(data), place.id);
  });
  try {
    saveMedia();
  } catch (error) {
    fs.unlinkSync(request.file.path);
    throw error;
  }
  response.status(201).json({ media: mediaAsset });
});

app.post('/api/admin/editorial', requireAuth, requireAdmin, (request, response) => {
  const data = request.body.item || {};
  const kind = String(data.kind || '');
  const title = String(data.title || '').trim();
  const slug = String(data.slug || '').trim().toLowerCase();
  if (!['article', 'journey'].includes(kind) || title.length < 2 || !/^[a-z0-9-]{2,120}$/.test(slug)) {
    return response.status(400).json({ error: 'Loại nội dung, tiêu đề hoặc slug không hợp lệ.' });
  }
  const id = crypto.randomUUID();
  const status = data.status === 'published' ? 'published' : 'hidden';
  try {
    database.prepare('INSERT INTO editorial_content (id, kind, slug, title, data_json, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, kind, slug, title, JSON.stringify({ ...data, id, kind, slug, title, status }), status);
  } catch (error) {
    if (String(error.code).startsWith('SQLITE_CONSTRAINT')) return response.status(409).json({ error: 'Slug đã được sử dụng.' });
    throw error;
  }
  response.status(201).json({ item: editorialFromRow(database.prepare('SELECT * FROM editorial_content WHERE id = ?').get(id)) });
});

app.put('/api/admin/editorial/:itemId', requireAuth, requireAdmin, (request, response) => {
  const existing = database.prepare('SELECT * FROM editorial_content WHERE id = ?').get(request.params.itemId);
  if (!existing) return response.status(404).json({ error: 'Không tìm thấy nội dung.' });
  const data = { ...editorialFromRow(existing), ...request.body.item, id: existing.id, kind: existing.kind };
  const title = String(data.title || '').trim();
  const slug = String(data.slug || '').trim().toLowerCase();
  const status = ['published', 'hidden'].includes(data.status) ? data.status : existing.status;
  if (title.length < 2 || !/^[a-z0-9-]{2,120}$/.test(slug)) return response.status(400).json({ error: 'Tiêu đề hoặc slug không hợp lệ.' });
  try {
    database.prepare('UPDATE editorial_content SET slug = ?, title = ?, data_json = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(slug, title, JSON.stringify(data), status, existing.id);
  } catch (error) {
    if (String(error.code).startsWith('SQLITE_CONSTRAINT')) return response.status(409).json({ error: 'Slug đã được sử dụng.' });
    throw error;
  }
  response.json({ item: editorialFromRow(database.prepare('SELECT * FROM editorial_content WHERE id = ?').get(existing.id)) });
});

app.delete('/api/admin/editorial/:itemId', requireAuth, requireAdmin, (request, response) => {
  const result = database.prepare("UPDATE editorial_content SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'deleted'").run(request.params.itemId);
  if (!result.changes) return response.status(404).json({ error: 'Không tìm thấy nội dung.' });
  response.status(204).end();
});

app.put('/api/admin/places/:placeId', requireAuth, requireAdmin, (request, response) => {
  const existing = database.prepare('SELECT * FROM places WHERE id = ?').get(request.params.placeId);
  if (!existing) return response.status(404).json({ error: 'Không tìm thấy địa điểm.' });
  const data = { ...placeFromRow(existing), ...request.body.place, id: existing.id };
  database.prepare('UPDATE places SET name = ?, province_name = ?, category_id = ?, data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(String(data.name).trim(), String(data.province_name).trim(), String(data.category_id), JSON.stringify(data), existing.id);
  response.json({ place: placeFromRow(database.prepare('SELECT * FROM places WHERE id = ?').get(existing.id)) });
});

app.delete('/api/admin/places/:placeId', requireAuth, requireAdmin, (request, response) => {
  const result = database.prepare("UPDATE places SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'deleted'").run(request.params.placeId);
  if (!result.changes) return response.status(404).json({ error: 'Không tìm thấy địa điểm.' });
  response.status(204).end();
});

app.patch('/api/admin/places/:placeId/status', requireAuth, requireAdmin, (request, response) => {
  const status = request.body.status;
  if (!['published', 'hidden', 'deleted'].includes(status)) return response.status(400).json({ error: 'Trạng thái địa điểm không hợp lệ.' });
  const result = database.prepare('UPDATE places SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, request.params.placeId);
  if (!result.changes) return response.status(404).json({ error: 'Không tìm thấy địa điểm.' });
  response.json({ id: request.params.placeId, status });
});

app.patch('/api/admin/posts/:postId/moderation', requireAuth, requireModerator, (request, response) => {
  const allowed = ['approved', 'rejected', 'hidden', 'pending'];
  const status = String(request.body.status || '');
  if (!allowed.includes(status)) return response.status(400).json({ error: 'Trạng thái kiểm duyệt không hợp lệ.' });
  const result = database.prepare('UPDATE posts SET moderation_status = ?, moderation_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, String(request.body.note || '').slice(0, 500), request.params.postId);
  if (!result.changes) return response.status(404).json({ error: 'Không tìm thấy bài viết.' });
  response.json({ id: request.params.postId, moderation_status: status });
});

app.put('/api/admin/posts/:postId', requireAuth, requireAdmin, (request, response) => {
  const post = database.prepare('SELECT * FROM posts WHERE id = ?').get(request.params.postId);
  if (!post) return response.status(404).json({ error: 'Không tìm thấy bài viết.' });
  const title = String(request.body.title ?? post.title ?? '').trim();
  const content = String(request.body.content ?? post.content).trim();
  const placeId = request.body.place_id === undefined ? post.place_id : request.body.place_id || null;
  const culturalTopic = String(request.body.cultural_topic ?? post.cultural_topic).slice(0, 120);
  const rating = request.body.rating === undefined ? post.rating : Number(request.body.rating);
  const isReview = request.body.is_review === undefined ? Boolean(post.is_review) : Boolean(request.body.is_review);
  if (title.length < 2 || title.length > 160 || content.length < 3 || content.length > 5000 || (isReview && (!Number.isInteger(rating) || rating < 1 || rating > 5 || !placeId))) {
    return response.status(400).json({ error: 'Nội dung hoặc thông tin đánh giá không hợp lệ.' });
  }
  if (placeId && !database.prepare('SELECT id FROM places WHERE id = ?').get(placeId)) return response.status(400).json({ error: 'Địa điểm không tồn tại.' });
  database.prepare(`UPDATE posts SET title = ?, content = ?, place_id = ?, cultural_topic = ?, is_review = ?, rating = ?, visit_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(title, content, placeId, culturalTopic, Number(isReview), isReview ? rating : null, isReview ? String(request.body.visit_date ?? post.visit_date ?? '').slice(0, 20) : null, post.id);
  response.json({ id: post.id, title, content, place_id: placeId, cultural_topic: culturalTopic, is_review: isReview, rating: isReview ? rating : null });
});

app.delete('/api/admin/posts/:postId', requireAuth, requireAdmin, (request, response) => {
  const media = database.prepare('SELECT owner_id, file_path FROM media WHERE post_id = ?').all(request.params.postId);
  const result = database.prepare('DELETE FROM posts WHERE id = ?').run(request.params.postId);
  if (!result.changes) return response.status(404).json({ error: 'Không tìm thấy bài viết.' });
  for (const item of media) {
    const filePath = path.resolve(uploadDirectory, item.owner_id, item.file_path);
    const ownerDirectory = `${path.resolve(uploadDirectory, item.owner_id)}${path.sep}`;
    if (filePath.startsWith(ownerDirectory) && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  response.status(204).end();
});

app.post('/api/admin/posts/:postId/media', requireAuth, requireAdmin, upload.single('image'), (request, response) => {
  const post = database.prepare('SELECT id FROM posts WHERE id = ?').get(request.params.postId);
  if (!post) {
    if (request.file) fs.unlinkSync(request.file.path);
    return response.status(404).json({ error: 'Không tìm thấy bài viết.' });
  }
  if (!request.file || !imageSignatureIsValid(request.file)) {
    if (request.file) fs.unlinkSync(request.file.path);
    return response.status(400).json({ error: 'Tải lên tệp ảnh hợp lệ.' });
  }
  const previous = database.prepare('SELECT * FROM media WHERE post_id = ?').all(post.id);
  const id = crypto.randomUUID();
  const filename = path.basename(request.file.path);
  const replaceImage = database.transaction(() => {
    database.prepare('DELETE FROM media WHERE post_id = ?').run(post.id);
    database.prepare('INSERT INTO media (id, owner_id, post_id, file_path, original_name, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, request.user.id, post.id, filename, path.basename(request.file.originalname).slice(0, 180), request.file.mimetype, request.file.size);
  });
  try {
    replaceImage();
  } catch (error) {
    fs.unlinkSync(request.file.path);
    throw error;
  }
  for (const media of previous) {
    const oldPath = path.resolve(uploadDirectory, media.owner_id, media.file_path);
    const ownerDirectory = `${path.resolve(uploadDirectory, media.owner_id)}${path.sep}`;
    if (oldPath.startsWith(ownerDirectory) && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  response.status(201).json({ id, image_url: `/uploads/${request.user.id}/${filename}` });
});

app.get('/api/admin/users', requireAuth, requireAdmin, (_request, response) => {
  const users = database.prepare('SELECT id, email, username, display_name, role, status, created_at FROM users ORDER BY created_at DESC').all();
  response.json({ users });
});

app.get('/api/admin/media', requireAuth, requireModerator, (_request, response) => {
  const items = database.prepare(`
    SELECT media.id, media.owner_id, media.post_id, media.place_id, media.original_name, media.mime_type, media.size_bytes, media.created_at,
      users.username, users.display_name, posts.moderation_status, places.name AS place_name,
      '/uploads/' || media.owner_id || '/' || media.file_path AS image_url
    FROM media
    JOIN users ON users.id = media.owner_id
    LEFT JOIN posts ON posts.id = media.post_id
    LEFT JOIN places ON places.id = media.place_id
    ORDER BY media.created_at DESC
  `).all();
  response.json({ items });
});

app.delete('/api/admin/media/:mediaId', requireAuth, requireModerator, (request, response) => {
  const media = database.prepare('SELECT * FROM media WHERE id = ?').get(request.params.mediaId);
  if (!media) return response.status(404).json({ error: 'Không tìm thấy media.' });
  const removeMedia = database.transaction(() => {
    if (media.post_id) {
      database.prepare("UPDATE posts SET moderation_status = 'hidden', moderation_note = 'Ảnh bị gỡ bởi kiểm duyệt viên', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(media.post_id);
    }
    if (media.place_id) {
      const place = database.prepare('SELECT data_json FROM places WHERE id = ?').get(media.place_id);
      if (place) {
        const data = parseJson(place.data_json);
        data.media = (Array.isArray(data.media) ? data.media : []).filter((item) => item.id !== media.id);
        database.prepare('UPDATE places SET data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(JSON.stringify(data), media.place_id);
      }
    }
    database.prepare('DELETE FROM media WHERE id = ?').run(media.id);
  });
  removeMedia();
  const mediaPath = path.resolve(uploadDirectory, media.owner_id, media.file_path);
  const ownerDirectory = `${path.resolve(uploadDirectory, media.owner_id)}${path.sep}`;
  if (mediaPath.startsWith(ownerDirectory) && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
  response.status(204).end();
});

app.patch('/api/admin/users/:userId', requireAuth, requireAdmin, (request, response) => {
  if (request.params.userId === request.user.id) return response.status(400).json({ error: 'Không thể thay đổi quyền hoặc trạng thái tài khoản đang đăng nhập.' });
  const role = request.body.role;
  const status = request.body.status;
  if (role !== undefined && !['user', 'moderator', 'admin'].includes(role)) return response.status(400).json({ error: 'Vai trò không hợp lệ.' });
  if (status !== undefined && !['active', 'locked'].includes(status)) return response.status(400).json({ error: 'Trạng thái tài khoản không hợp lệ.' });
  const user = database.prepare('SELECT * FROM users WHERE id = ?').get(request.params.userId);
  if (!user) return response.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  database.prepare('UPDATE users SET role = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(role || user.role, status || user.status, user.id);
  if (status === 'locked') database.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
  response.json({ user: publicUser(database.prepare('SELECT * FROM users WHERE id = ?').get(user.id)) });
});

app.get('/api/admin/comments', requireAuth, requireModerator, (_request, response) => {
  response.json({ comments: database.prepare(`SELECT comments.*, users.username, users.display_name FROM comments JOIN users ON users.id = comments.user_id ORDER BY comments.created_at DESC`).all() });
});

app.patch('/api/admin/comments/:commentId', requireAuth, requireModerator, (request, response) => {
  const status = request.body.status;
  if (!['approved', 'rejected', 'hidden'].includes(status)) return response.status(400).json({ error: 'Trạng thái bình luận không hợp lệ.' });
  const result = database.prepare('UPDATE comments SET status = ? WHERE id = ?').run(status, request.params.commentId);
  if (!result.changes) return response.status(404).json({ error: 'Không tìm thấy bình luận.' });
  response.json({ id: request.params.commentId, status });
});

app.get('/api/admin/dashboard', requireAuth, requireAdmin, (_request, response) => {
  response.json({
    users: database.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    pendingPosts: database.prepare("SELECT COUNT(*) AS count FROM posts WHERE moderation_status = 'pending'").get().count,
    pendingComments: database.prepare("SELECT COUNT(*) AS count FROM comments WHERE status = 'pending'").get().count,
    places: database.prepare("SELECT COUNT(*) AS count FROM places WHERE status = 'published'").get().count,
    media: database.prepare('SELECT COUNT(*) AS count FROM media').get().count,
  });
});

app.use('/api', (_request, response) => response.status(404).json({ error: 'Không tìm thấy API.' }));
app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) return response.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Ảnh tối đa 8 MB.' : 'Tệp tải lên không hợp lệ.' });
  console.error(error);
  response.status(500).json({ error: 'Lỗi máy chủ.' });
});

const distDirectory = path.join(root, 'dist');
if (fs.existsSync(distDirectory)) {
  app.use(express.static(distDirectory, { index: false }));
  app.get('*', (_request, response) => response.sendFile(path.join(distDirectory, 'index.html')));
}

function bootstrapAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  if (!email && !password) return;
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 16) {
    throw new Error('Set valid ADMIN_EMAIL and an ADMIN_PASSWORD of at least 16 characters, or leave both unset.');
  }
  const existing = database.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return;
  const id = crypto.randomUUID();
  const username = String(process.env.ADMIN_USERNAME || 'site_admin').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) || 'site_admin';
  database.prepare(`INSERT INTO users (id, email, username, display_name, password_hash, role) VALUES (?, ?, ?, ?, ?, 'admin')`)
    .run(id, email, username, String(process.env.ADMIN_DISPLAY_NAME || 'Quản trị viên').slice(0, 80), passwordHash(password));
  console.log(`Initial admin account created for ${email}`);
}

bootstrapAdmin();
database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 4000);
  const server = app.listen(port, '0.0.0.0', () => console.log(`Heritage API listening on http://localhost:${port}`));

  function shutdown() {
    server.close(() => {
      database.close();
      process.exit(0);
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export { app, database };