import React, { useState } from 'react';
import { 
  Church, 
  Lock, 
  User, 
  KeyRound, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  Check
} from 'lucide-react';
import type { AdminUser } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('bethel2026');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '登录失败，请检查账号密码');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '网络连接或密码错误');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-amber-200/90 shadow-2xl max-w-md w-full overflow-hidden relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Top Header Banner */}
        <div className="bg-linear-to-r from-amber-700 via-amber-800 to-amber-900 text-white p-6 text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-amber-200 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Church className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-serif tracking-tight">
            伯特利教会 • 后台管理系统
          </h2>
          <p className="text-xs text-amber-200/90 mt-1">
            主日学班级与团契管理 • 规则权限配置
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                管理员 / 老师账号
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="例如: admin 或 teacher"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>登录密码</span>
                <span className="text-[10px] text-amber-800 font-mono">默认: bethel2026</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="请输入后台密码"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              {loading ? (
                <span>正在验证登录...</span>
              ) : (
                <>
                  <span>立即登入管理后台</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Accounts */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center justify-between">
              <span>快捷免输入测试账号：</span>
              <span className="text-[10px] text-emerald-700 font-medium">点击一键填入并测试权限</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'bethel2026')}
                className="p-2.5 text-left rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                  <span className="text-[11px] font-bold text-amber-950 truncate">总管理员</span>
                </div>
                <div className="text-[10px] text-amber-800 font-mono mt-0.5">admin</div>
                <div className="text-[9px] text-amber-700/90 mt-1 font-medium bg-amber-100 px-1 py-0.2 rounded inline-block">
                  全部权限 (增删+签到)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('teacher', 'bethel123')}
                className="p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-sky-600" />
                  <span className="text-[11px] font-bold text-slate-800 truncate">主日学教务</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">teacher</div>
                <div className="text-[9px] text-sky-700 mt-1 font-medium bg-sky-50 px-1 py-0.2 rounded inline-block">
                  仅限管理签到
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('fellowship', 'fellowship123')}
                className="p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-sky-600" />
                  <span className="text-[11px] font-bold text-slate-800 truncate">团契带领同工</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">fellowship</div>
                <div className="text-[9px] text-sky-700 mt-1 font-medium bg-sky-50 px-1 py-0.2 rounded inline-block">
                  仅限管理签到
                </div>
              </button>
            </div>

            <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">🔒 系统权限规则：</span>
              除了<strong>总管理员（admin）</strong>之外，其他账号<strong>只有管理签到权限</strong>，没有添加/删除班级与学生的权限。
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
