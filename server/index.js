import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Pool } = pg;

// Lấy thông tin đường dẫn __dirname trong môi trường ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kết nối PostgreSQL Supabase
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Chưa cấu hình biến môi trường DATABASE_URL.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Bỏ qua xác thực SSL certificate chain để kết nối Supabase mượt mà
  },
  connectionTimeoutMillis: 10000,
});

// Kết nối Supabase SDK để quản lý Storage Bucket (Validate URL an toàn)
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'heritage-media';

let supabase = null;
if (supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Đã khởi tạo Supabase Storage Client thành công!');
  } catch (err) {
    console.error('❌ Lỗi khởi tạo Supabase Client:', err.message);
  }
} else {
  console.warn('⚠️ Cảnh báo: Thiếu SUPABASE_URL hợp lệ hoặc SUPABASE_SERVICE_ROLE_KEY.');
}

const app = express();
app.disable('x-powered-by');

// Kích hoạt compression để nén API responses và static assets giúp tải nhanh hơn
app.use(compression());

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '1mb' }));

const cookieName = 'heritage_session';
const sessionLifetime = 1000 * 60 * 60 * 24 * 14;
const isProduction = process.env.NODE_ENV === 'production';

// Danh sách các tỉnh thành thuộc ĐBSCL cần lọc bỏ
const MEKONG_DELTA_PROVINCES = [
  'Cần Thơ', 'An Giang', 'Đồng Tháp', 'Long An', 'Tiền Giang', 
  'Bến Tre', 'Vĩnh Long', 'Trà Vinh', 'Hậu Giang', 'Sóc Trăng', 
  'Bạc Liêu', 'Cà Mau', 'Kiên Giang'
];

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

function parseJson(value, fallback = {}) {
  if (typeof value === 'object' && value !== null) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
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

async function issueSession(userId, response) {
  const token = crypto.randomBytes(32).toString('base64url');
  await pool.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [hashToken(token), userId, Date.now() + sessionLifetime]
  );
  sendSessionCookie(response, token);
}

async function attachUser(request, _response, next) {
  const token = readCookie(request, cookieName);
  if (token) {
    const tokenHash = hashToken(token);
    const result = await pool.query(`
      SELECT users.*, sessions.expires_at FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1
    `, [tokenHash]);
    const session = result.rows[0];

    if (session && Number(session.expires_at) > Date.now() && session.status === 'active') {
      request.user = session;
    } else if (session) {
      await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
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

function placeFromRow(row) {
  return { ...parseJson(row.data_json), id: row.id, slug: row.slug, name: row.name, province_name: row.province_name, category_id: row.category_id, status: row.status };
}

function editorialFromRow(row) {
  return { ...parseJson(row.data_json), id: row.id, slug: row.slug, title: row.title, status: row.status };
}

// Cấu hình Multer lưu file vào RAM trước khi đẩy lên Supabase Storage
const uploadStorage = multer.memoryStorage();
const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    callback(null, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype));
  },
});

const adminMediaUpload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new Error('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.'));
    }
    callback(null, true);
  },
});

function bufferSignatureIsValid(buffer, mimetype) {
  if (buffer.length < 12) return false;
  if (mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimetype === 'image/gif') return buffer.toString('ascii', 0, 3) === 'GIF';
  return mimetype === 'image/webp' && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
}

// Hàm đẩy file lên Supabase Storage và lấy Public URL
async function uploadToSupabaseStorage(file, folderPath) {
  if (!supabase) throw new Error('Chưa cấu hình Supabase SDK.');
  const extension = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  }[file.mimetype] || '.jpg';
  
  const filename = `${crypto.randomUUID()}${extension}`;
  const fullPath = `${folderPath}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fullPath, file.buffer, { contentType: file.mimetype, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fullPath);
  return { fullPath, publicUrl: data.publicUrl };
}

// Hàm xóa file từ Supabase Storage
async function deleteFromSupabaseStorage(fullPath) {
  if (!supabase || !fullPath) return;
  await supabase.storage.from(BUCKET_NAME).remove([fullPath]);
}

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });

app.use(attachUser);

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

app.post('/api/auth/register', authLimiter, async (request, response) => {
  const email = String(request.body.email || '').trim().toLowerCase();
  const username = String(request.body.username || '').trim().toLowerCase();
  const displayName = String(request.body.display_name || '').trim();
  const password = String(request.body.password || '');
  
  if (!/^\S+@\S+\.\S+$/.test(email) || !/^[a-z0-9_]{3,30}$/.test(username) || displayName.length < 2 || displayName.length > 80 || password.length < 12) {
    return response.status(400).json({ error: 'Nhập email hợp lệ, username 3-30 ký tự, tên hiển thị và mật khẩu tối thiểu 12 ký tự.' });
  }

  const userId = crypto.randomUUID();
  const hash = passwordHash(password);

  try {
    await pool.query(
      'INSERT INTO users (id, email, username, display_name, password_hash) VALUES ($1, $2, $3, $4, $5)',
      [userId, email, username, displayName, hash]
    );
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ error: 'Email hoặc username đã được sử dụng.' });
    }
    throw error;
  }

  await issueSession(userId, response);
  const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  response.status(201).json({ user: publicUser(userResult.rows[0]) });
});

app.post('/api/auth/login', authLimiter, async (request, response) => {
  const email = String(request.body.email || '').trim().toLowerCase();
  const password = String(request.body.password || '');
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user || user.status !== 'active' || !verifyPassword(password, user.password_hash)) {
    return response.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
  }

  await issueSession(user.id, response);
  response.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', async (request, response) => {
  const token = readCookie(request, cookieName);
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
  clearSessionCookie(response);
  response.status(204).end();
});

app.get('/api/auth/me', (request, response) => response.json({ user: publicUser(request.user) }));

app.patch('/api/auth/me', requireAuth, async (request, response) => {
  const displayName = String(request.body.display_name || '').trim();
  const bio = String(request.body.bio || '').trim();
  const hometown = String(request.body.hometown || '').trim();
  const interests = Array.isArray(request.body.cultural_interests) ? request.body.cultural_interests.map((value) => String(value).trim()).filter(Boolean).slice(0, 20) : [];
  const privacy = request.body.privacy === 'public' ? 'public' : 'private';

  if (displayName.length < 2 || displayName.length > 80 || bio.length > 500 || hometown.length > 120) {
    return response.status(400).json({ error: 'Thông tin hồ sơ không hợp lệ.' });
  }

  await pool.query(`
    UPDATE users SET display_name = $1, bio = $2, hometown = $3, cultural_interests_json = $4, privacy = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6
  `, [displayName, bio, hometown, JSON.stringify(interests), privacy, request.user.id]);

  const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [request.user.id]);
  response.json({ user: publicUser(userResult.rows[0]) });
});

app.patch('/api/auth/password', requireAuth, authLimiter, async (request, response) => {
  const currentPassword = String(request.body.current_password || '');
  const newPassword = String(request.body.new_password || '');

  if (!verifyPassword(currentPassword, request.user.password_hash)) {
    return response.status(400).json({ error: 'Mật khẩu hiện tại không chính xác.' });
  }
  if (newPassword.length < 12 || newPassword.length > 200 || newPassword === currentPassword) {
    return response.status(400).json({ error: 'Mật khẩu mới cần từ 12 ký tự và phải khác mật khẩu hiện tại.' });
  }

  const currentToken = readCookie(request, cookieName);
  await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash(newPassword), request.user.id]);
  await pool.query('DELETE FROM sessions WHERE user_id = $1 AND token_hash != $2', [request.user.id, hashToken(currentToken)]);
  response.status(204).end();
});

// TỐI ƯU CÂU QUERY /api/places VÀ LỌC SẠCH DỮ LIỆU ĐỒNG BẰNG SÔNG CỬU LONG
app.get('/api/places', async (request, response) => {
  const includeHidden = request.user && ['admin', 'moderator'].includes(request.user.role);
  
  const query = `
    SELECT 
      p.*,
      COALESCE(sp.saved_count, 0) AS saved_count,
      COALESCE(vp.visited_count, 0) AS visited_count,
      COALESCE(rev.review_count, 0) AS review_count,
      COALESCE(rev.avg_rating, 0) AS avg_rating
    FROM places p
    LEFT JOIN (
      SELECT place_id, COUNT(*) AS saved_count FROM saved_places GROUP BY place_id
    ) sp ON sp.place_id = p.id
    LEFT JOIN (
      SELECT place_id, COUNT(*) AS visited_count FROM visited_places GROUP BY place_id
    ) vp ON vp.place_id = p.id
    LEFT JOIN (
      SELECT place_id, COUNT(*) AS review_count, AVG(rating) AS avg_rating 
      FROM posts 
      WHERE is_review = 1 AND rating IS NOT NULL AND moderation_status = 'approved' 
      GROUP BY place_id
    ) rev ON rev.place_id = p.id
    WHERE p.status ${includeHidden ? "!= 'deleted'" : "= 'published'"}
    ORDER BY p.name;
  `;

  const rows = (await pool.query(query)).rows;

  const places = rows
    .map((row) => {
      const place = placeFromRow(row);
      place.stats = {
        savedCount: Number(row.saved_count),
        visitedCount: Number(row.visited_count),
        reviewCount: Number(row.review_count),
        rating: Number(row.avg_rating),
      };
      return place;
    })
    // Filter loại bỏ tất cả các địa điểm thuộc Đồng bằng sông Cửu Long / Tây Nam Bộ
    .filter((place) => {
      const isMekongProvince = MEKONG_DELTA_PROVINCES.includes(place.province_name);
      const isMekongRegion = ['Đồng bằng sông Cửu Long', 'Tây Nam Bộ', 'Miền Tây'].includes(place.region || '');
      return !isMekongProvince && !isMekongRegion;
    });

  response.json({ places });
});

app.get('/api/editorial', async (request, response) => {
  const kind = String(request.query.kind || '');
  if (!['article', 'journey'].includes(kind)) return response.status(400).json({ error: 'Loại nội dung không hợp lệ.' });
  const canModerate = request.user && ['admin', 'moderator'].includes(request.user.role);
  const rows = (await pool.query(`SELECT * FROM editorial_content WHERE kind = $1 AND status ${canModerate ? "!= 'deleted'" : "= 'published'"} ORDER BY title`, [kind])).rows;
  
  // Loại bỏ bài viết liên quan ĐBSCL nếu có
  const items = rows
    .map(editorialFromRow)
    .filter(item => !item.slug.includes('dong-bang-song-cuu-long') && !item.slug.includes('mien-tay'));

  response.json({ items });
});

app.get('/api/admin/editorial', requireAuth, requireModerator, async (request, response) => {
  const kind = String(request.query.kind || '');
  if (!['article', 'journey'].includes(kind)) return response.status(400).json({ error: 'Loại nội dung không hợp lệ.' });
  const rows = (await pool.query("SELECT * FROM editorial_content WHERE kind = $1 AND status != 'deleted' ORDER BY updated_at DESC", [kind])).rows;
  response.json({ items: rows.map(editorialFromRow) });
});

app.get('/api/posts', async (request, response) => {
  const canModerate = request.user && ['admin', 'moderator'].includes(request.user.role);
  const rows = canModerate
    ? (await pool.query(`SELECT posts.*, users.username, users.display_name, users.avatar, users.role, places.name AS place_name FROM posts JOIN users ON users.id = posts.user_id LEFT JOIN places ON places.id = posts.place_id ORDER BY posts.created_at DESC`)).rows
    : (await pool.query(`SELECT posts.*, users.username, users.display_name, users.avatar, users.role, places.name AS place_name FROM posts JOIN users ON users.id = posts.user_id LEFT JOIN places ON places.id = posts.place_id WHERE posts.moderation_status = 'approved' OR posts.user_id = $1 ORDER BY posts.created_at DESC`, [request.user?.id || ''])).rows;

  const posts = await Promise.all(rows.map(async (row) => {
    const images = (await pool.query(`SELECT media.id, media.owner_id, media.original_name, media.mime_type, media.file_path AS image_url, users.display_name AS photographer FROM media JOIN users ON users.id = media.owner_id WHERE media.post_id = $1 ORDER BY media.created_at`, [row.id])).rows;
    const comments = (await pool.query(`SELECT comments.id, comments.content AS text, comments.created_at, users.id AS user_id, users.username, users.display_name, users.avatar FROM comments JOIN users ON users.id = comments.user_id WHERE comments.post_id = $1 AND comments.status = 'approved' ORDER BY comments.created_at`, [row.id])).rows;
    const likesCount = (await pool.query('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = $1', [row.id])).rows[0].count;

    let hasLiked = false;
    let saved = false;

    if (request.user) {
      hasLiked = (await pool.query('SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2', [row.id, request.user.id])).rowCount > 0;
      saved = (await pool.query('SELECT 1 FROM saved_posts WHERE post_id = $1 AND user_id = $2', [row.id, request.user.id])).rowCount > 0;
    }

    return {
      id: row.id,
      user: { id: row.user_id, username: row.username, display_name: row.display_name, avatar: row.avatar, role: row.role },
      created_at: row.created_at,
      title: row.title,
      content: row.content,
      place_id: row.place_id,
      cultural_topic: row.cultural_topic,
      images: images.map((image) => ({
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
      likes: Number(likesCount),
      has_liked: hasLiked,
      saved: saved,
      comments: comments.map((comment) => ({ ...comment, user: { id: comment.user_id, username: comment.username, display_name: comment.display_name, avatar: comment.avatar } })),
    };
  }));

  response.json({ posts });
});

app.post('/api/posts', requireAuth, upload.single('image'), async (request, response) => {
  const title = String(request.body.title || '').trim();
  const content = String(request.body.content || '').trim();
  if (!request.file) return response.status(400).json({ error: 'Bài viết bắt buộc phải có ảnh.' });

  if (!bufferSignatureIsValid(request.file.buffer, request.file.mimetype)) {
    return response.status(400).json({ error: 'Tệp tải lên không phải ảnh hợp lệ.' });
  }

  if (title.length < 2 || title.length > 160 || content.length < 3 || content.length > 5000) {
    return response.status(400).json({ error: 'Tiêu đề phải dài 2-160 ký tự và nội dung 3-5000 ký tự.' });
  }

  const placeId = request.body.place_id || null;
  if (placeId) {
    const placeCheck = await pool.query("SELECT id FROM places WHERE id = $1 AND status = 'published'", [placeId]);
    if (placeCheck.rowCount === 0) return response.status(400).json({ error: 'Địa điểm không tồn tại hoặc chưa được công khai.' });
  }

  const postId = crypto.randomUUID();
  const mediaId = crypto.randomUUID();
  const isReview = request.body.is_review === 'true';
  const rating = isReview ? Number(request.body.rating) : null;

  if (isReview && (!Number.isInteger(rating) || rating < 1 || rating > 5 || !placeId)) {
    return response.status(400).json({ error: 'Đánh giá cần địa điểm và số sao từ 1 đến 5.' });
  }

  const client = await pool.connect();
  try {
    const { publicUrl, fullPath } = await uploadToSupabaseStorage(request.file, `posts/${request.user.id}`);

    await client.query('BEGIN');
    await client.query(
      `INSERT INTO posts (id, user_id, place_id, title, content, cultural_topic, is_review, rating, visit_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [postId, request.user.id, placeId, title, content, String(request.body.cultural_topic || '').slice(0, 120), Number(isReview), rating, isReview ? String(request.body.visit_date || '').slice(0, 20) : null]
    );
    await client.query(
      `INSERT INTO media (id, owner_id, post_id, file_path, original_name, mime_type, size_bytes) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [mediaId, request.user.id, postId, publicUrl, request.file.originalname.slice(0, 180), request.file.mimetype, request.file.size]
    );
    await client.query('COMMIT');

    response.status(201).json({ post: { id: postId, moderation_status: 'pending', image_url: publicUrl } });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

app.post('/api/posts/:postId/comments', requireAuth, async (request, response) => {
  const result = await pool.query('SELECT moderation_status FROM posts WHERE id = $1', [request.params.postId]);
  const post = result.rows[0];
  const content = String(request.body.content || '').trim();

  if (!post || post.moderation_status !== 'approved') return response.status(404).json({ error: 'Không tìm thấy bài viết công khai.' });
  if (content.length < 1 || content.length > 1000) return response.status(400).json({ error: 'Bình luận phải có tối đa 1000 ký tự.' });

  const id = crypto.randomUUID();
  await pool.query('INSERT INTO comments (id, post_id, user_id, content) VALUES ($1, $2, $3, $4)', [id, request.params.postId, request.user.id, content]);
  response.status(201).json({ id, status: 'pending' });
});

app.delete('/api/posts/:postId', requireAuth, async (request, response) => {
  const result = await pool.query('SELECT id, user_id FROM posts WHERE id = $1', [request.params.postId]);
  const post = result.rows[0];

  if (!post) return response.status(404).json({ error: 'Không tìm thấy bài viết.' });
  if (post.user_id !== request.user.id) return response.status(403).json({ error: 'Bạn chỉ có thể gỡ bài viết của mình.' });

  await pool.query("UPDATE posts SET moderation_status = 'rejected', moderation_note = 'Đã gỡ theo yêu cầu của tác giả', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [post.id]);
  response.status(204).end();
});

app.put('/api/posts/:postId/like', requireAuth, async (request, response) => {
  const postResult = await pool.query("SELECT id FROM posts WHERE id = $1 AND moderation_status = 'approved'", [request.params.postId]);
  if (postResult.rowCount === 0) return response.status(404).json({ error: 'Không tìm thấy bài viết công khai.' });

  const existing = await pool.query('SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2', [request.params.postId, request.user.id]);
  if (existing.rowCount > 0) {
    await pool.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [request.params.postId, request.user.id]);
  } else {
    await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [request.params.postId, request.user.id]);
  }

  const countResult = await pool.query('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = $1', [request.params.postId]);
  response.json({ liked: existing.rowCount === 0, likes: Number(countResult.rows[0].count) });
});

app.put('/api/places/:placeId/save', requireAuth, async (request, response) => {
  const exists = await pool.query("SELECT id FROM places WHERE id = $1 AND status = 'published'", [request.params.placeId]);
  if (exists.rowCount === 0) return response.status(404).json({ error: 'Không tìm thấy địa điểm.' });

  await pool.query('INSERT INTO saved_places (place_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [exists.rows[0].id, request.user.id]);
  response.status(204).end();
});

app.delete('/api/places/:placeId/save', requireAuth, async (request, response) => {
  await pool.query('DELETE FROM saved_places WHERE place_id = $1 AND user_id = $2', [request.params.placeId, request.user.id]);
  response.status(204).end();
});

app.put('/api/places/:placeId/visited', requireAuth, async (request, response) => {
  const exists = await pool.query("SELECT id FROM places WHERE id = $1 AND status = 'published'", [request.params.placeId]);
  if (exists.rowCount === 0) return response.status(404).json({ error: 'Không tìm thấy địa điểm.' });

  await pool.query('INSERT INTO visited_places (place_id, user_id, note) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [exists.rows[0].id, request.user.id, String(request.body.note || '').slice(0, 1000)]);
  response.status(204).end();
});

app.delete('/api/places/:placeId/visited', requireAuth, async (request, response) => {
  await pool.query('DELETE FROM visited_places WHERE place_id = $1 AND user_id = $2', [request.params.placeId, request.user.id]);
  response.status(204).end();
});

app.put('/api/posts/:postId/save', requireAuth, async (request, response) => {
  const exists = await pool.query("SELECT id FROM posts WHERE id = $1 AND moderation_status = 'approved'", [request.params.postId]);
  if (exists.rowCount === 0) return response.status(404).json({ error: 'Không tìm thấy bài viết.' });

  await pool.query('INSERT INTO saved_posts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [exists.rows[0].id, request.user.id]);
  response.status(204).end();
});

app.delete('/api/posts/:postId/save', requireAuth, async (request, response) => {
  await pool.query('DELETE FROM saved_posts WHERE post_id = $1 AND user_id = $2', [request.params.postId, request.user.id]);
  response.status(204).end();
});

app.get('/api/me/library', requireAuth, async (request, response) => {
  const savedPlaces = (await pool.query('SELECT place_id FROM saved_places WHERE user_id = $1', [request.user.id])).rows.map(r => r.place_id);
  const visitedPlaces = (await pool.query('SELECT place_id FROM visited_places WHERE user_id = $1', [request.user.id])).rows.map(r => r.place_id);
  const visitedMemories = (await pool.query(`SELECT visited_places.place_id, places.name AS place_name, places.province_name, visited_places.visited_at, visited_places.note FROM visited_places JOIN places ON places.id = visited_places.place_id WHERE visited_places.user_id = $1 ORDER BY visited_places.visited_at DESC`, [request.user.id])).rows;

  response.json({ savedPlaceIds: savedPlaces, visitedPlaceIds: visitedPlaces, visitedMemories });
});

app.post('/api/admin/places', requireAuth, requireAdmin, async (request, response) => {
  const data = request.body.place || {};
  const id = crypto.randomUUID();
  const status = data.status === 'published' ? 'published' : 'hidden';
  const slug = String(data.slug || data.name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const name = String(data.name || '').trim();

  if (name.length < 2 || !slug || !String(data.province_name || '').trim() || !String(data.category_id || '').trim()) {
    return response.status(400).json({ error: 'Tên, tỉnh/thành và danh mục là bắt buộc.' });
  }

  try {
    await pool.query('INSERT INTO places (id, slug, name, province_name, category_id, data_json, status) VALUES ($1, $2, $3, $4, $5, $6, $7)', [
      id, slug, name, String(data.province_name).trim(), String(data.category_id), JSON.stringify({ ...data, id, slug, name, status }), status
    ]);
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ error: 'Slug địa điểm đã tồn tại.' });
    throw error;
  }

  const placeRes = await pool.query('SELECT * FROM places WHERE id = $1', [id]);
  response.status(201).json({ place: placeFromRow(placeRes.rows[0]) });
});

app.put('/api/admin/places/:placeId/image', requireAuth, requireAdmin, adminMediaUpload.single('image'), async (request, response) => {
  const placeRes = await pool.query('SELECT * FROM places WHERE id = $1', [request.params.placeId]);
  const place = placeRes.rows[0];

  if (!place) return response.status(404).json({ error: 'Không tìm thấy địa điểm.' });
  if (!request.file) return response.status(400).json({ error: 'Vui lòng chọn ảnh.' });
  if (!bufferSignatureIsValid(request.file.buffer, request.file.mimetype)) {
    return response.status(400).json({ error: 'File không phải ảnh hợp lệ.' });
  }

  const id = crypto.randomUUID();
  const { publicUrl, fullPath } = await uploadToSupabaseStorage(request.file, `places/${place.id}`);

  const mediaAsset = {
    id,
    image_url: publicUrl,
    media_type: 'image',
    source_url: '',
    source_name: 'Ảnh do quản trị viên cung cấp',
    photographer: request.user.display_name,
    license_type: 'User-provided',
    attribution_text: 'Ảnh do quản trị viên cung cấp; quyền sử dụng đã được xác nhận',
    verification_status: 'verified',
  };

  const data = parseJson(place.data_json);
  data.media = [mediaAsset];

  const oldMedia = (await pool.query('SELECT file_path FROM media WHERE place_id = $1', [place.id])).rows;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM media WHERE place_id = $1', [place.id]);
    await client.query(`
      INSERT INTO media (id, owner_id, place_id, file_path, original_name, mime_type, size_bytes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, request.user.id, place.id, publicUrl, request.file.originalname.slice(0, 180), request.file.mimetype, request.file.size]);

    await client.query('UPDATE places SET data_json = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [JSON.stringify(data), place.id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    await deleteFromSupabaseStorage(fullPath);
    throw error;
  } finally {
    client.release();
  }

  for (const old of oldMedia) {
    await deleteFromSupabaseStorage(old.file_path);
  }

  response.json({ media: mediaAsset });
});

app.post('/api/admin/editorial', requireAuth, requireAdmin, async (request, response) => {
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
    await pool.query('INSERT INTO editorial_content (id, kind, slug, title, data_json, status) VALUES ($1, $2, $3, $4, $5, $6)', [
      id, kind, slug, title, JSON.stringify({ ...data, id, kind, slug, title, status }), status
    ]);
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ error: 'Slug đã được sử dụng.' });
    throw error;
  }

  const result = await pool.query('SELECT * FROM editorial_content WHERE id = $1', [id]);
  response.status(201).json({ item: editorialFromRow(result.rows[0]) });
});

app.put('/api/admin/editorial/:itemId', requireAuth, requireAdmin, async (request, response) => {
  const existingRes = await pool.query('SELECT * FROM editorial_content WHERE id = $1', [request.params.itemId]);
  const existing = existingRes.rows[0];
  if (!existing) return response.status(404).json({ error: 'Không tìm thấy nội dung.' });

  const data = { ...editorialFromRow(existing), ...request.body.item, id: existing.id, kind: existing.kind };
  const title = String(data.title || '').trim();
  const slug = String(data.slug || '').trim().toLowerCase();
  const status = ['published', 'hidden'].includes(data.status) ? data.status : existing.status;

  if (title.length < 2 || !/^[a-z0-9-]{2,120}$/.test(slug)) return response.status(400).json({ error: 'Tiêu đề hoặc slug không hợp lệ.' });

  try {
    await pool.query('UPDATE editorial_content SET slug = $1, title = $2, data_json = $3, status = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5', [
      slug, title, JSON.stringify(data), status, existing.id
    ]);
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ error: 'Slug đã được sử dụng.' });
    throw error;
  }

  const result = await pool.query('SELECT * FROM editorial_content WHERE id = $1', [existing.id]);
  response.json({ item: editorialFromRow(result.rows[0]) });
});

app.delete('/api/admin/editorial/:itemId', requireAuth, requireAdmin, async (request, response) => {
  const result = await pool.query("UPDATE editorial_content SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status != 'deleted'", [request.params.itemId]);
  if (result.rowCount === 0) return response.status(404).json({ error: 'Không tìm thấy nội dung.' });
  response.status(204).end();
});

app.put('/api/admin/places/:placeId', requireAuth, requireAdmin, async (request, response) => {
  const existingRes = await pool.query('SELECT * FROM places WHERE id = $1', [request.params.placeId]);
  const existing = existingRes.rows[0];
  if (!existing) return response.status(404).json({ error: 'Không tìm thấy địa điểm.' });

  const oldData = placeFromRow(existing);
  const data = { ...oldData, ...request.body.place, id: existing.id, slug: oldData.slug, media: oldData.media || [] };

  const name = String(data.name || '').trim();
  const province = String(data.province_name || '').trim();
  const category = String(data.category_id || '').trim();

  if (name.length < 2 || name.length > 200 || !province || !category) {
    return response.status(400).json({ error: 'Tên, tỉnh/thành và danh mục không hợp lệ.' });
  }

  data.name = name;
  data.province_name = province;
  data.category_id = category;

  await pool.query(`UPDATE places SET name = $1, province_name = $2, category_id = $3, data_json = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5`, [
    name, province, category, JSON.stringify(data), existing.id
  ]);

  const updatedRes = await pool.query('SELECT * FROM places WHERE id = $1', [existing.id]);
  response.json({ place: placeFromRow(updatedRes.rows[0]) });
});

app.delete('/api/admin/places/:placeId', requireAuth, requireAdmin, async (request, response) => {
  const result = await pool.query("UPDATE places SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status != 'deleted'", [request.params.placeId]);
  if (result.rowCount === 0) return response.status(404).json({ error: 'Không tìm thấy địa điểm.' });
  response.status(204).end();
});

app.patch('/api/admin/places/:placeId/status', requireAuth, requireAdmin, async (request, response) => {
  const status = request.body.status;
  if (!['published', 'hidden', 'deleted'].includes(status)) return response.status(400).json({ error: 'Trạng thái địa điểm không hợp lệ.' });
  const result = await pool.query('UPDATE places SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, request.params.placeId]);
  if (result.rowCount === 0) return response.status(404).json({ error: 'Không tìm thấy địa điểm.' });
  response.json({ id: request.params.placeId, status });
});

app.patch('/api/admin/posts/:postId/moderation', requireAuth, requireModerator, async (request, response) => {
  const allowed = ['approved', 'rejected', 'hidden', 'pending'];
  const status = String(request.body.status || '');
  if (!allowed.includes(status)) return response.status(400).json({ error: 'Trạng thái kiểm duyệt không hợp lệ.' });

  const result = await pool.query('UPDATE posts SET moderation_status = $1, moderation_note = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [
    status, String(request.body.note || '').slice(0, 500), request.params.postId
  ]);
  if (result.rowCount === 0) return response.status(404).json({ error: 'Không tìm thấy bài viết.' });
  response.json({ id: request.params.postId, moderation_status: status });
});

app.delete('/api/admin/posts/:postId', requireAuth, requireAdmin, async (request, response) => {
  const mediaList = (await pool.query('SELECT file_path FROM media WHERE post_id = $1', [request.params.postId])).rows;
  const result = await pool.query('DELETE FROM posts WHERE id = $1', [request.params.postId]);
  if (result.rowCount === 0) return response.status(404).json({ error: 'Không tìm thấy bài viết.' });

  for (const item of mediaList) {
    await deleteFromSupabaseStorage(item.file_path);
  }
  response.status(204).end();
});

app.get('/api/admin/users', requireAuth, requireAdmin, async (_request, response) => {
  const users = (await pool.query('SELECT id, email, username, display_name, role, status, created_at FROM users ORDER BY created_at DESC')).rows;
  response.json({ users });
});

app.get('/api/admin/media', requireAuth, requireModerator, async (_request, response) => {
  const items = (await pool.query(`
    SELECT media.id, media.owner_id, media.post_id, media.place_id, media.original_name, media.mime_type, media.size_bytes, media.created_at,
      users.username, users.display_name, posts.moderation_status, places.name AS place_name,
      media.file_path AS image_url
    FROM media
    JOIN users ON users.id = media.owner_id
    LEFT JOIN posts ON posts.id = media.post_id
    LEFT JOIN places ON places.id = media.place_id
    ORDER BY media.created_at DESC
  `)).rows;
  response.json({ items });
});

app.delete('/api/admin/media/:mediaId', requireAuth, requireModerator, async (request, response) => {
  const result = await pool.query('SELECT * FROM media WHERE id = $1', [request.params.mediaId]);
  const media = result.rows[0];
  if (!media) return response.status(404).json({ error: 'Không tìm thấy media.' });

  if (media.post_id) {
    await pool.query("UPDATE posts SET moderation_status = 'hidden', moderation_note = 'Ảnh bị gỡ bởi kiểm duyệt viên', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [media.post_id]);
  }
  if (media.place_id) {
    const placeRes = await pool.query('SELECT data_json FROM places WHERE id = $1', [media.place_id]);
    if (placeRes.rowCount > 0) {
      const data = parseJson(placeRes.rows[0].data_json);
      data.media = (Array.isArray(data.media) ? data.media : []).filter((item) => item.id !== media.id);
      await pool.query('UPDATE places SET data_json = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [JSON.stringify(data), media.place_id]);
    }
  }

  await pool.query('DELETE FROM media WHERE id = $1', [media.id]);
  await deleteFromSupabaseStorage(media.file_path);
  response.status(204).end();
});

app.patch('/api/admin/users/:userId', requireAuth, requireAdmin, async (request, response) => {
  if (request.params.userId === request.user.id) return response.status(400).json({ error: 'Không thể thay đổi quyền hoặc trạng thái tài khoản đang đăng nhập.' });
  const role = request.body.role;
  const status = request.body.status;
  if (role !== undefined && !['user', 'moderator', 'admin'].includes(role)) return response.status(400).json({ error: 'Vai trò không hợp lệ.' });
  if (status !== undefined && !['active', 'locked'].includes(status)) return response.status(400).json({ error: 'Trạng thái tài khoản không hợp lệ.' });

  const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [request.params.userId]);
  const user = userRes.rows[0];
  if (!user) return response.status(404).json({ error: 'Không tìm thấy tài khoản.' });

  await pool.query('UPDATE users SET role = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [role || user.role, status || user.status, user.id]);
  if (status === 'locked') await pool.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);

  const updatedUser = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
  response.json({ user: publicUser(updatedUser.rows[0]) });
});

app.get('/api/admin/comments', requireAuth, requireModerator, async (_request, response) => {
  const comments = (await pool.query(`SELECT comments.*, users.username, users.display_name FROM comments JOIN users ON users.id = comments.user_id ORDER BY comments.created_at DESC`)).rows;
  response.json({ comments });
});

app.patch('/api/admin/comments/:commentId', requireAuth, requireModerator, async (request, response) => {
  const status = request.body.status;
  if (!['approved', 'rejected', 'hidden'].includes(status)) return response.status(400).json({ error: 'Trạng thái bình luận không hợp lệ.' });
  const result = await pool.query('UPDATE comments SET status = $1 WHERE id = $2', [status, request.params.commentId]);
  if (result.rowCount === 0) return response.status(404).json({ error: 'Không tìm thấy bình luận.' });
  response.json({ id: request.params.commentId, status });
});

// TỐI ƯU CÂU QUERY DASHBOARD TRÁNH TẠO 5 QUERY ĐỘC LẬP
app.get('/api/admin/dashboard', requireAuth, requireAdmin, async (_request, response) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM posts WHERE moderation_status = 'pending') AS pending_posts,
      (SELECT COUNT(*) FROM comments WHERE status = 'pending') AS pending_comments,
      (SELECT COUNT(*) FROM places WHERE status = 'published') AS places,
      (SELECT COUNT(*) FROM media) AS media;
  `;
  const counts = (await pool.query(query)).rows[0];

  response.json({
    users: Number(counts.users),
    pendingPosts: Number(counts.pending_posts),
    pendingComments: Number(counts.pending_comments),
    places: Number(counts.places),
    media: Number(counts.media),
  });
});

// Xử lý 404 cho các route API không tồn tại
app.use('/api', (_request, response) => response.status(404).json({ error: 'Không tìm thấy API.' }));

// =========================================================================
// PHỤC VỤ STATIC FILES TỪ THƯ MỤC DIST (REACT APP)
// =========================================================================
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath, { maxAge: '1d' }));

// Catch-all Route: Trả về index.html cho các route phía Client (React Router)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global Error Handler
app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) return response.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Ảnh tối đa 8 MB.' : 'Tệp tải lên không hợp lệ.' });
  console.error(error);
  response.status(500).json({ error: 'Lỗi máy chủ.' });
});

async function bootstrapAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  if (!email && !password) return;
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 16) {
    throw new Error('Set valid ADMIN_EMAIL and an ADMIN_PASSWORD of at least 16 characters, or leave both unset.');
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) return;

  const id = crypto.randomUUID();
  const username = String(process.env.ADMIN_USERNAME || 'site_admin').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) || 'site_admin';
  await pool.query(`INSERT INTO users (id, email, username, display_name, password_hash, role) VALUES ($1, $2, $3, $4, $5, 'admin')`, [
    id, email, username, String(process.env.ADMIN_DISPLAY_NAME || 'Quản trị viên').slice(0, 80), passwordHash(password)
  ]);
  console.log(`Initial admin account created for ${email}`);
}

async function initServer() {
  await bootstrapAdmin();
  await pool.query('DELETE FROM sessions WHERE expires_at <= $1', [Date.now()]);

  if (process.env.NODE_ENV !== 'test') {
    const port = Number(process.env.PORT || 4000);
    const server = app.listen(port, '0.0.0.0', () => console.log(`Heritage API listening on http://localhost:${port}`));

    function shutdown() {
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    }

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

initServer().catch(console.error);

export { app, pool as database };