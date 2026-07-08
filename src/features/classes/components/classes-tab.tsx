import { BookOpen, Calendar, Edit2, Trash2, Clock } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { Card, CardContent } from '#/shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'
import { Badge } from '#/shared/components/ui/badge'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { EmptyState } from '#/shared/components/ui/empty-state'

interface ClassesTabProps {
  classesList: any[]
  classesLoading: boolean
  isReadOnly: boolean
  isAdmin: boolean
  onManageSchedule: (cls: any) => void
  onEdit: (cls: any) => void
  onDelete: (classId: string) => void
}

export function ClassesTab({
  classesList,
  classesLoading,
  isReadOnly,
  isAdmin,
  onManageSchedule,
  onEdit,
  onDelete,
}: ClassesTabProps) {
  return (
    <Card className="transition-all duration-200">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Horarios</TableHead>
              {!isReadOnly && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {classesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_cell, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : classesList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-0">
                  <EmptyState
                    icon={BookOpen}
                    title="Sin clases"
                    description="No hay clases registradas."
                  />
                </TableCell>
              </TableRow>
            ) : (
              classesList.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="size-4 rounded-full shrink-0"
                        style={{ backgroundColor: cls.color }}
                      />
                      <span className="font-medium">{cls.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {cls.description || '-'}
                  </TableCell>
                  <TableCell>
                    {cls.category ? (
                      <Badge variant="secondary">{cls.category}</Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{cls.capacity} personas</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="size-3" />
                      {cls.schedules.length} horario
                      {cls.schedules.length !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onManageSchedule(cls)}
                          title="Gestionar horarios"
                        >
                          <Calendar className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(cls)}
                          title="Editar"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(cls.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
