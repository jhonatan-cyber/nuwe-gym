import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { File, FileText, Plus, X, Trash2, Download, User, FileType } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Badge } from '#/shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { createDocument, getEmployeeDocuments, deleteDocument } from '#/features/employees/documents-server.ts'
import { formatDate } from '#/shared/lib/formatters.ts'

interface DocumentsSectionProps {
  employeeId: string
}

const DOC_TYPES: Record<string, string> = {
  ID: 'Identificación',
  CONTRACT: 'Contrato',
  RESUME: 'Currículum',
  CERTIFICATE: 'Certificado',
  MEDICAL: 'Médico',
  STUDY: 'Estudio',
  PAYSLIP: 'Recibo de sueldo',
  OTHER: 'Otro',
}

const DOC_COLORS: Record<string, string> = {
  ID: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  CONTRACT: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  RESUME: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  CERTIFICATE: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  MEDICAL: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  STUDY: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  PAYSLIP: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
  OTHER: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
}

export function DocumentsSection({ employeeId }: DocumentsSectionProps) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'OTHER',
    description: '',
    fileUrl: '',
    fileName: '',
    fileSize: '',
  })

  const { data: documents = [] } = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: () => getEmployeeDocuments({ data: { employeeId } }),
  })

  const createMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] })
      toast.success('Documento registrado')
      setShowForm(false)
      setForm({ name: '', type: 'OTHER', description: '', fileUrl: '', fileName: '', fileSize: '' })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] })
      toast.success('Documento eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h4 className="font-semibold text-sm">Documentos</h4>
          {documents.length > 0 && (
            <span className="text-xs text-muted-foreground">({documents.length})</span>
          )}
        </div>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="text-xs h-7">
            <Plus className="size-3 mr-1" /> Agregar
          </Button>
        )}
      </div>

      {showForm ? (
        <div className="rounded-xl border border-border/10 bg-background/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nuevo Documento</h5>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-6 text-xs">
              <X className="size-3 mr-1" /> Cancelar
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre *</label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre del documento" className="rounded-xl h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Tipo</label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger className="rounded-xl h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Descripción</label>
            <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="rounded-xl text-xs" placeholder="Descripción del documento..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">URL del archivo</label>
              <Input value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} placeholder="https://..." className="rounded-xl h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del archivo</label>
              <Input value={form.fileName} onChange={(e) => setForm((p) => ({ ...p, fileName: e.target.value }))} placeholder="documento.pdf" className="rounded-xl h-8 text-xs" />
            </div>
          </div>

          <LoadingButton
            onClick={() => {
              if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return }
              createMutation.mutate({ data: { ...form, employeeId } })
            }}
            isLoading={createMutation.isPending}
            className="w-full text-xs rounded-full"
          >
            Registrar Documento
          </LoadingButton>
        </div>
      ) : documents.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No hay documentos registrados.</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/10 bg-background/50">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <File className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold truncate">{doc.name}</p>
                  <Badge variant="outline" className={`text-[8px] px-1 py-0 font-bold ${DOC_COLORS[doc.type] ?? DOC_COLORS.OTHER}`}>
                    {DOC_TYPES[doc.type] ?? doc.type}
                  </Badge>
                </div>
                {doc.description && <p className="text-[10px] text-muted-foreground mt-0.5">{doc.description}</p>}
                <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-1"><FileType className="size-2.5" />{doc.fileName || '—'}</span>
                  {doc.fileSize && <span>{doc.fileSize}</span>}
                  <span className="flex items-center gap-1"><User className="size-2.5" />{doc.uploadedBy?.name || '—'}</span>
                  <span>{formatDate(new Date(doc.createdAt))}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {doc.fileUrl && (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-muted-foreground hover:text-primary transition-colors">
                    <Download className="size-3.5" />
                  </a>
                )}
                <button onClick={() => deleteMutation.mutate({ data: { id: doc.id } })} className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
