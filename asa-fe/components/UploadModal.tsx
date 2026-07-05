import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useDropzone } from 'react-dropzone'
import { documentsApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export default function UploadModal({ open, onOpenChange, onSuccess }: UploadModalProps) {
    const [uploading, setUploading] = useState(false)
    const { toast } = useToast()

    const onDrop = useCallback(async (accepted: File[]) => {
        if (!accepted.length) return
        setUploading(true)
        const results = await Promise.allSettled(accepted.map(f => documentsApi.upload(f)))
        const succeeded = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length
        
        if (succeeded > 0) {
            toast({ title: `${succeeded} file${succeeded > 1 ? 's' : ''} uploaded successfully!` })
            onSuccess()
            onOpenChange(false)
        }
        if (failed > 0) {
            toast({ title: `${failed} file${failed > 1 ? 's' : ''} failed to upload`, variant: 'destructive' })
        }
        setUploading(false)
    }, [onSuccess, onOpenChange, toast])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] }
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white border-slate-200 rounded-3xl p-6 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-900">Upload Study Materials</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 font-medium mt-1">
                        Upload your PDF textbook, notes, or TXT documents to generate AI study materials.
                    </DialogDescription>
                </DialogHeader>
                <div
                    {...getRootProps()}
                    className={cn(
                        "mt-4 relative group rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden p-8 text-center",
                        isDragActive
                            ? "border-indigo-500 bg-indigo-50/50 shadow-inner"
                            : "border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-sm group-hover:scale-110",
                            isDragActive && "scale-110 bg-indigo-600 text-white"
                        )}>
                            {uploading ? (
                                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <Upload className="h-6 w-6" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900 mb-1">{isDragActive ? 'Drop files here' : uploading ? 'Processing upload...' : 'Choose or Drag Files'}</h2>
                            <p className="text-xs text-slate-500 font-medium">Supports PDF or TXT files up to 50MB</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
