'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { BookOpen, Bell, Menu, CheckCircle2, Info, AlertTriangle, XCircle, Trash2, CheckCircle } from 'lucide-react'
import { useState, useMemo } from 'react'
import { authApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useNotifications, NotificationType } from '@/contexts/NotificationContext'

export default function Navbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [showDropdown, setShowDropdown] = useState<boolean>(false)
    const [showNotifs, setShowNotifs] = useState<boolean>(false)
    const { notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification, clearAll } = useNotifications()

    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'SB'

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />
            case 'error': return <XCircle className="h-4 w-4 text-destructive" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    const formatTime = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h ago`
        return date.toLocaleDateString()
    }

    return (
        <header className="sticky top-0 z-40 h-16 flex items-center border-b bg-background/80 backdrop-blur-sm px-4 gap-4">
            {onMenuToggle && (
                <button onClick={onMenuToggle} className="lg:hidden p-2 hover:bg-accent rounded-lg">
                    <Menu className="h-5 w-5" />
                </button>
            )}

            <Link href="/dashboard" className="flex items-center gap-2 mr-auto lg:hidden">
                <Avatar className="h-8 w-8 rounded-lg shadow-sm border-0">
                    {user?.avatar && <AvatarImage src={authApi.getAvatarUrl(user.avatar)} alt={user.name} />}
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white text-[10px] font-bold border-0">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <span className="font-bold text-gradient">Study Buddy</span>
            </Link>

            <div className="ml-auto flex items-center gap-2">
                {(showNotifs || showDropdown) && (
                    <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => { setShowNotifs(false); setShowDropdown(false); }} 
                    />
                )}

                <div className="relative z-50">
                    <button 
                        onClick={() => { setShowNotifs(v => !v); setShowDropdown(false); }}
                        aria-label="Toggle notifications"
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors relative group focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        <Bell className="h-5 w-5 text-slate-600" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse border-2 border-white" />
                        )}
                    </button>

                    {showNotifs && (
                        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl py-0 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-extrabold text-sm text-slate-900">Notifications</h3>
                                <div className="flex items-center gap-3">
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={markAllAsRead}
                                            className="text-[10px] text-indigo-600 hover:underline font-extrabold uppercase tracking-wider"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button 
                                            onClick={clearAll}
                                            className="text-[10px] text-slate-400 hover:text-red-600 font-extrabold uppercase tracking-wider"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center flex flex-col items-center">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                                            <Bell className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">No new notifications</p>
                                        <p className="text-xs text-slate-400 mt-1">We'll alert you when study actions occur.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {notifications.map(n => (
                                            <div 
                                                key={n.id} 
                                                onClick={() => markAsRead(n.id)}
                                                className={cn(
                                                    "p-4 flex gap-3 hover:bg-slate-50 transition-all cursor-pointer group/notif relative",
                                                    !n.read && "bg-indigo-50/30"
                                                )}
                                            >
                                                {!n.read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-full" />}
                                                <div className="mt-0.5 flex-shrink-0">
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <p className={cn("text-xs font-bold text-slate-900 mb-0.5", !n.read && "text-indigo-600")}>{n.title}</p>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{n.message}</p>
                                                    <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wider">{formatTime(n.time)}</p>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                                                    className="opacity-0 group-hover/notif:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all h-fit"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative z-50">
                    <button
                        onClick={() => { setShowDropdown(d => !d); setShowNotifs(false); }}
                        aria-label="User menu"
                        className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        <Avatar className="h-9 w-9 border-2 border-indigo-100 shadow-sm">
                            {user?.avatar && <AvatarImage src={authApi.getAvatarUrl(user.avatar)} alt={user.name} />}
                            <AvatarFallback className="text-xs font-black bg-gradient-to-br from-indigo-600 to-blue-600 text-white">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:block text-sm font-bold text-slate-800 max-w-[120px] truncate">{user?.name || 'User'}</span>
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-3 border-b border-slate-100">
                                <p className="text-sm font-extrabold text-slate-900 truncate">{user?.name}</p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                            </div>
                            <Link href="/dashboard/profile" onClick={() => setShowDropdown(false)}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                                Profile Settings
                            </Link>
                            <button onClick={handleLogout}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
