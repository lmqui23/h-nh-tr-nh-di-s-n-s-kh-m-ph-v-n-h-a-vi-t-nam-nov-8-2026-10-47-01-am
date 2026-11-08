import React, { useState } from 'react';
import { X } from 'lucide-react';
import { User } from '../types';
import { api } from '../utils/api';

interface AuthDialogProps {
  onClose: () => void;
  onAuthenticated: (user: User) => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ onClose, onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = mode === 'login'
        ? await api.login(email, password)
        : await api.register({ email, username, display_name: displayName, password });
      onAuthenticated(result.user);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể xác thực tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#28231F]/70 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="w-full max-w-md rounded-xl border border-[#D8A84E]/50 bg-[#FAF6EF] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-[#D8A84E]/30 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#B8322A]">Tài khoản Di Sản Số</p>
            <h2 id="auth-title" className="mt-1 font-serif text-xl font-bold text-[#28231F]">{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded p-2 text-[#795548] hover:bg-[#EBDDCA]"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'register' && (
            <>
              <label className="block font-semibold text-[#795548]">Tên hiển thị
                <input required minLength={2} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1 w-full rounded border border-[#D8A84E]/50 bg-[#F4EBDD] p-2.5 font-normal text-[#28231F]" />
              </label>
              <label className="block font-semibold text-[#795548]">Username
                <input required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]+" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1 w-full rounded border border-[#D8A84E]/50 bg-[#F4EBDD] p-2.5 font-normal text-[#28231F]" />
              </label>
            </>
          )}
          <label className="block font-semibold text-[#795548]">Email
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded border border-[#D8A84E]/50 bg-[#F4EBDD] p-2.5 font-normal text-[#28231F]" />
          </label>
          <label className="block font-semibold text-[#795548]">Mật khẩu
            <input required type="password" minLength={12} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded border border-[#D8A84E]/50 bg-[#F4EBDD] p-2.5 font-normal text-[#28231F]" />
          </label>
          {mode === 'register' && <p className="text-[11px] leading-relaxed text-[#795548]">Mật khẩu cần ít nhất 12 ký tự. Tài khoản mới chỉ có quyền User.</p>}
          {error && <p role="alert" className="rounded border border-[#B8322A]/30 bg-[#B8322A]/5 p-2 text-[#B8322A]">{error}</p>}
          <button disabled={isSubmitting} className="w-full rounded bg-[#B8322A] px-4 py-2.5 font-semibold text-white hover:bg-[#9E2A23] disabled:opacity-60">
            {isSubmitting ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="mt-4 w-full text-center text-xs text-[#795548] hover:text-[#B8322A]">
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </section>
    </div>
  );
};