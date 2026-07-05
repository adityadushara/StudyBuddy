'use client'
import { useRouter } from 'next/navigation'
import { FileText, MessageCircle, Radio, Layers, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotesSidebar({ docName, activeSection }: {
    docName: string
    activeSection: string
}) {
    const router = useRouter()
    const navItems = [
        { id: 'document', label: 'Summaries', icon: FileText, route: `/notes/${docName}` },
        { id: 'chat', label: 'Chat Bot', icon: MessageCircle, route: `/notes/${docName}/chat` },
        { id: 'flashcards', label: 'Flashcards', icon: Layers, route: `/notes/${docName}/flashcards` },
        { id: 'quiz', label: 'Quiz', icon: BookOpen, route: `/notes/${docName}/quiz` },
    ]

    return (
        <div className="w-[140px] flex-shrink-0 flex flex-col bg-white/90 backdrop-blur-xl border-r border-slate-200/80 h-full z-10">
            {/* Logo */}
            <button 
                onClick={() => router.push('/dashboard')}
                className="px-3 pt-6 pb-5 border-b border-slate-100 flex flex-col items-center gap-3 w-full hover:bg-slate-50 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                    <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 text-center leading-tight">Study Buddy</span>
            </button>
            {/* Nav items */}
            <nav className="flex-1 p-2 space-y-1.5">
                {navItems.map(({ id, label, icon: Icon, route }) => (
                    <button
                        key={id}
                        onClick={() => router.push(route)}
                        className={cn(
                            'w-full flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500',
                            activeSection === id
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </nav>
        </div>
    )
}
