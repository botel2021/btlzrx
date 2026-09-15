import React, { useState, useEffect } from 'react';
import { 
  Church, 
  Users, 
  CalendarCheck, 
  Award, 
  Settings, 
  Clock, 
  AlertCircle,
  Sparkles,
  LogIn,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Lock,
  UserCheck
} from 'lucide-react';
import type { SystemConfig, AdminUser } from '../types';
import { checkIsWithinSundayWindow, getDayOfWeekName } from '../utils/dateUtils';

interface HeaderProps {
  config: SystemConfig;
  activeTab: 'today' | 'monthly' | 'annual' | 'settings';
  setActiveTab: (tab: 'today' | 'monthly' | 'annual' | 'settings') => void;
  onQuickToggleTestMode: () => void;
  currentUser: AdminUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeTab,
  setActiveTab,
  onQuickToggleTestMode,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const windowStatus = checkIsWithinSundayWindow(
    currentTime,
    config.checkinStartTime,
    config.checkinEndTime,
    config.testMode
  );

  const timeString = currentTime.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateString = currentTime.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white border-b border-amber-200/80 shadow-xs sticky top-0 z-30">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Bethel Church Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-amber-600 to-amber-800 flex items-center justify-center text-amber-50 shadow-md shadow-amber-900/10 shrink-0">
              <Church className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 font-serif">
                  {config.churchName}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium border border-amber-200">
                  {config.currentSemester}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="text-amber-900 font-semibold">{config.schoolTitle}</span>
                <span className="text-slate-300">•</span>
                <span className="text-amber-800">学生考勤与资料管理</span>
              </p>
            </div>
          </div>

          {/* Time, Sunday Window Status & Admin Profile */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            
            {/* Clock Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs text-slate-700">
              <Clock className="w-4 h-4 text-amber-700" />
              <div className="leading-tight">
                <span className="font-semibold text-slate-900">{timeString}</span>
                <span className="text-slate-500 ml-1.5 hidden sm:inline">{dateString} ({getDayOfWeekName(currentTime)})</span>
              </div>
            </div>

            {/* Sunday Status Badge */}
            <div 
              className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium border transition-all ${
                windowStatus.isAllowed
                  ? config.testMode
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {windowStatus.isAllowed ? (
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.testMode ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${config.testMode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                </span>
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline">
                {windowStatus.isAllowed 
                  ? (config.testMode ? '测试模式 (随时可签)' : `主日签到开放 (${config.checkinStartTime}-${config.checkinEndTime})`)
                  : '非开放时段 (只限主日)'
                }
              </span>
              <span className="sm:hidden">
                {config.testMode ? '测试开放' : '主日开放'}
              </span>
            </div>

            {/* Quick Test Mode Switch button */}
            <button
              onClick={onQuickToggleTestMode}
              title="一键切换测试模式：开启后随时随地可模拟签到，不受礼拜天限定限制"
              className={`text-xs px-2 py-1.5 rounded-lg font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
                config.testMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{config.testMode ? '测试模式' : '正式规则'}</span>
            </button>

            {/* Admin Login / Logout State Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs px-2.5 py-1.5 rounded-lg shadow-2xs">
                {currentUser.role === 'superadmin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-sky-600" />
                )}
                <span className="font-semibold truncate max-w-[120px]" title={currentUser.displayName}>
                  {currentUser.displayName}
                </span>
                {currentUser.role === 'superadmin' ? (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded" title="总管理员：具有班级/学生增删及签到全部权限">
                    总管理员
                  </span>
                ) : (
                  <span className="bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-semibold px-1.5 py-0.2 rounded flex items-center gap-0.5" title="普通同工账号：仅限管理签到，无班级/学生增删权限">
                    <Lock className="w-2.5 h-2.5" />
                    <span>仅签到权限</span>
                  </span>
                )}
                <button
                  onClick={onLogout}
                  className="ml-1 text-slate-400 hover:text-red-700 cursor-pointer p-0.5"
                  title="退出登录"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>后台管理登录</span>
              </button>
            )}

          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'today'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>今日签到看板与点名</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>月度完成进度报告</span>
          </button>

          <button
            onClick={() => setActiveTab('annual')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'annual'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>年度结业档案与证书</span>
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                onOpenLogin();
              } else {
                setActiveTab('settings');
              }
            }}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>后台班级与学生管理</span>
            {!currentUser ? (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                需登录
              </span>
            ) : currentUser.role !== 'superadmin' ? (
              <span className="text-[10px] bg-amber-100/80 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                <span>仅签到权限</span>
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
};
