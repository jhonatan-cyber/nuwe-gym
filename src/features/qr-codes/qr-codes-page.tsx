import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QrCode, Printer, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  generateMemberQR,
  getMembersWithQR,
} from '#/features/qr-codes/server.ts'
import QRCode from 'qrcode'

import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import { PageHeader } from '#/shared/components/page-header'
import { SearchInput } from '#/shared/components/search-input'
import { DataTable } from '#/shared/components/data-table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '#/shared/components/ui/dialog'

interface QRCodesPageProps {
  userRole: string
}

export function QRCodesPage({ userRole }: QRCodesPageProps) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setTimeout(() => setDebouncedSearch(e.target.value), 300)
  }

  const { data: membersList = [], isLoading } = useQuery({
    queryKey: ['members-qr', debouncedSearch],
    queryFn: () => getMembersWithQR({ data: { search: debouncedSearch } }),
  })

  const [selectedMember, setSelectedMember] = useState<
    (typeof membersList)[number] | null
  >(null)

  const generateMutation = useMutation({
    mutationFn: generateMemberQR,
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['members-qr'] })
      const dataUrl = await QRCode.toDataURL(result.qrCode, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
      setQrDataUrl(dataUrl)
      toast.success('Código QR generado')
    },
    onError: () => toast.error('Error al generar código QR'),
  })

  const handleGenerateQR = async (member: (typeof membersList)[number]) => {
    setSelectedMember(member)
    if (member.qrCode) {
      const dataUrl = await QRCode.toDataURL(member.qrCode, {
        width: 300,
        margin: 2,
      })
      setQrDataUrl(dataUrl)
    } else {
      setQrDataUrl(null)
      generateMutation.mutate({ data: { memberId: member.id } })
    }
    setIsQrDialogOpen(true)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !selectedMember || !qrDataUrl) return

    const gymName = 'GymManager'
    const memberName = selectedMember.fullName.toUpperCase()

    printWindow.document.write(`
      <html>
        <head>
          <title>Credencial - ${selectedMember.fullName}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .card { width: 320px; border: 2px solid #000; border-radius: 12px; padding: 20px; text-align: center; }
            h1 { font-size: 18px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 2px; }
            h2 { font-size: 14px; margin: 8px 0; text-transform: uppercase; }
            .gym { font-size: 10px; color: #666; margin-bottom: 12px; }
            .qr { margin: 12px 0; }
            .qr img { width: 200px; height: 200px; }
            .footer { font-size: 8px; color: #999; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${gymName}</h1>
            <div class="gym">POS System</div>
            <hr style="border: 0; border-top: 1px dashed #ccc;" />
            <h2>${memberName}</h2>
            <div class="qr"><img src="${qrDataUrl}" alt="QR Code" /></div>
            <hr style="border: 0; border-top: 1px dashed #ccc;" />
            <div class="footer">Presentá este código en recepción para registrar tu ingreso</div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Códigos QR"
        description="Generá y administrá códigos QR de acceso para los socios."
      />

      <div className="mb-4">
        <SearchInput
          placeholder="Buscar por nombre o documento..."
          value={search}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
      </div>

      <DataTable
        columns={[
          {
            key: 'member',
            label: 'Socio',
            render: (member: (typeof membersList)[number]) => (
              <div className="flex items-center gap-2">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt=""
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs uppercase">
                    {member.fullName.substring(0, 2)}
                  </div>
                )}
                <span className="font-medium">{member.fullName}</span>
              </div>
            ),
          },
          {
            key: 'document',
            label: 'Documento',
            render: (member: (typeof membersList)[number]) => (
              <span className="text-muted-foreground">
                {member.documentNumber || '—'}
              </span>
            ),
          },
          {
            key: 'qr',
            label: 'QR',
            render: (member: (typeof membersList)[number]) =>
              member.qrCode ? (
                <Badge
                  variant="default"
                  className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20"
                >
                  Generado
                </Badge>
              ) : (
                <Badge variant="secondary">Pendiente</Badge>
              ),
          },
          {
            key: 'actions',
            label: 'Acciones',
            className: 'text-right',
            render: (member: (typeof membersList)[number]) =>
              !isReadOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateQR(member)}
                >
                  <QrCode className="size-4 mr-1" />
                  {member.qrCode ? 'Ver QR' : 'Generar'}
                </Button>
              ),
          },
        ]}
        data={membersList}
        isLoading={isLoading}
        emptyMessage="No se encontraron socios."
        keyExtractor={(member: (typeof membersList)[number]) => member.id}
      />

      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Código QR</DialogTitle>
            <DialogDescription>{selectedMember?.fullName}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-64 h-64 border rounded-lg p-2"
              />
            ) : (
              <div className="w-64 h-64 border rounded-lg flex items-center justify-center text-muted-foreground">
                Generando...
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setIsQrDialogOpen(false)}>
              <X className="size-4 mr-1" />
              Cerrar
            </Button>
            <Button onClick={handlePrint} disabled={!qrDataUrl}>
              <Printer className="size-4 mr-1" />
              Imprimir Credencial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
