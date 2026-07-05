'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { documentsApi, Document } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, BookOpen, ChevronRight, Upload, Library, Sparkles } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'
import UploadModal from '@/components/UploadModal'

export default function NotesIndexPage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const router = useRouter()

    const fetchDocs = async () => {
        setLoading(true)
        try {
            const docs = await documentsApi.list()
            setDocuments(docs)
        } catch {
            setDocuments([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDocs()
    }, [])

    const openDoc = (doc: Document) => {
        const titleOrName = encodeURIComponent(doc.title || doc.filename)
        router.push(`/notes/${titleOrName}`)
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-10 px-6">
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                {/* Header Nav */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform">
                            <BookOpen className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">Study Workspace</h1>
                            <p className="text-sm text-slate-500 font-medium">Select a document to view, summarize, or quiz yourself</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <Button variant="outline" className="rounded-xl font-bold">Back to Dashboard</Button>
                        </Link>
                        <Button onClick={() => setIsUploadOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2 btn-premium">
                            <Upload className="h-4 w-4" /> Upload Document
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-44 bg-slate-200/60 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : documents.length === 0 ? (
                    <Card className="bg-white border-slate-200 shadow-sm rounded-3xl p-12 text-center max-w-xl mx-auto">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
                            <Sparkles className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 mb-2">No documents available</h2>
                        <p className="text-slate-500 font-medium mb-6 text-sm">Upload your first PDF or text document to unlock AI summaries, flashcards, and interactive study chat.</p>
                        <Button onClick={() => setIsUploadOpen(true)} className="bg-indigo-600 text-white font-bold rounded-xl px-6 h-12 btn-premium">
                            Upload Document
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Library className="h-4 w-4 text-indigo-500" /> All Documents ({documents.length})
                            </h2>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {documents.map(doc => (
                                <Card
                                    key={doc.id}
                                    onClick={() => openDoc(doc)}
                                    className="bg-white border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 rounded-3xl p-6 cursor-pointer group hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 text-indigo-600 group-hover:scale-110 transition-transform">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-extrabold text-slate-900 text-base truncate group-hover:text-indigo-600 transition-colors mb-1">
                                                {doc.title || doc.filename}
                                            </h3>
                                            <p className="text-xs font-semibold text-slate-500">
                                                {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                                        Open Study Notes →
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <UploadModal open={isUploadOpen} onOpenChange={setIsUploadOpen} onSuccess={fetchDocs} />
        </div>
    )
}
