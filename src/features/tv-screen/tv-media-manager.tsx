import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, Image, MessageSquareText, Monitor } from 'lucide-react'
import { getTvMediaAndTickers, addTvMedia, removeTvMedia, addTickerMessage, removeTickerMessage } from './media-server.ts'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/shared/components/ui/card'
import { Separator } from '#/shared/components/ui/separator'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#/shared/components/ui/tabs'

export function TvMediaManager() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('media')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newCaption, setNewCaption] = useState('')
  const [newMessage, setNewMessage] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tv-media-manager'],
    queryFn: () => getTvMediaAndTickers(),
  })

  const addMediaMutation = useMutation({
    mutationFn: addTvMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-media-manager'] })
      setNewImageUrl('')
      setNewCaption('')
      toast.success('Imagen agregada a la pantalla TV')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removeMediaMutation = useMutation({
    mutationFn: removeTvMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-media-manager'] })
      toast.success('Imagen eliminada')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const addTickerMutation = useMutation({
    mutationFn: addTickerMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-media-manager'] })
      setNewMessage('')
      toast.success('Mensaje agregado al ticker')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removeTickerMutation = useMutation({
    mutationFn: removeTickerMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-media-manager'] })
      toast.success('Mensaje eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <Monitor className="size-5 text-emerald-500" />
        </div>
        <div>
          <p className="font-bold text-sm">Pantalla TV</p>
          <p className="text-[11px] text-muted-foreground">
            Gestioná el contenido de la pantalla TV pública en <code className="text-primary">/tv</code>
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="media"><Image className="size-3 mr-1" />Galería</TabsTrigger>
          <TabsTrigger value="ticker"><MessageSquareText className="size-3 mr-1" />Ticker</TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Agregá imágenes promocionales que se mostrarán como carrusel en la pantalla TV.
            Usá URL públicas de imágenes (pueden ser alojadas en Imgur, Cloudinary, etc.).
          </p>

          <div className="flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="flex-1 rounded-2xl text-xs"
            />
            <Input
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              placeholder="Texto opcional"
              className="w-40 rounded-2xl text-xs"
            />
            <LoadingButton
              isLoading={addMediaMutation.isPending}
              disabled={!newImageUrl.trim()}
              onClick={() => addMediaMutation.mutate({ data: { imageUrl: newImageUrl.trim(), caption: newCaption.trim() || undefined } })}
              className="rounded-full shrink-0"
            >
              <Plus className="size-4 mr-1" /> Agregar
            </LoadingButton>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-accent/60" />
              ))}
            </div>
          ) : !data?.media?.length ? (
            <EmptyState
              icon={Image}
              title="Sin imágenes"
              description="Agregá imágenes promocionales para mostrar en la pantalla TV"
            />
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {data.media.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-2 rounded-xl bg-muted/30 border border-border/10 group"
                >
                  <div className="size-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img
                      src={item.imageUrl}
                      alt={item.caption ?? ''}
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>'
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{item.caption || 'Sin texto'}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.imageUrl}</p>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="mt-1 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={() => removeMediaMutation.mutate({ data: { id: item.id } })}
                    >
                      <Trash2 className="size-3 mr-1" /> Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ticker" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Mensajes que se muestran en la barra ticker inferior de la pantalla TV.
            Rotan automáticamente.
          </p>

          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ej: ¡Próximo mes: 20% OFF en membresías anuales!"
              className="flex-1 rounded-2xl text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newMessage.trim()) {
                  addTickerMutation.mutate({ data: { message: newMessage.trim() } })
                }
              }}
            />
            <LoadingButton
              isLoading={addTickerMutation.isPending}
              disabled={!newMessage.trim()}
              onClick={() => addTickerMutation.mutate({ data: { message: newMessage.trim() } })}
              className="rounded-full shrink-0"
            >
              <Plus className="size-4 mr-1" /> Agregar
            </LoadingButton>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-accent/60" />
              ))}
            </div>
          ) : !data?.tickers?.length ? (
            <EmptyState
              icon={MessageSquareText}
              title="Sin mensajes"
              description="Agregá mensajes para el ticker de la pantalla TV"
            />
          ) : (
            <div className="space-y-2">
              {data.tickers.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/10 group"
                >
                  <MessageSquareText className="size-4 text-muted-foreground shrink-0" />
                  <p className="flex-1 text-sm font-medium truncate">{msg.message}</p>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                    onClick={() => removeTickerMutation.mutate({ data: { id: msg.id } })}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
