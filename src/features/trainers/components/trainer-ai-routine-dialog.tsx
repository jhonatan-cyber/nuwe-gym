import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/shared/components/ui/dialog.tsx'
import { Button } from '#/shared/components/ui/button.tsx'
import { Input } from '#/shared/components/ui/input.tsx'
import { Label } from '#/shared/components/ui/label.tsx'
import { Textarea } from '#/shared/components/ui/textarea.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select.tsx'
import { toast } from 'sonner'
import { Dumbbell, Sparkles, Copy, Save, Loader2, Check } from 'lucide-react'
import { generateAIRoutine, createTrainerObservation } from '../server.ts'
import type { RoutineProposal } from '../routine-generator.ts'

interface TrainerAIRoutineDialogProps {
  member: {
    id: string
    fullName: string
    birthDate?: string | Date | null
    gender?: string | null
  }
}

export function TrainerAIRoutineDialog({ member }: TrainerAIRoutineDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  
  // Parámetros de entrada inicializados dinámicamente según la ficha del socio
  const [age, setAge] = useState(() => {
    if (!member.birthDate) return 25
    const birthYear = new Date(member.birthDate).getFullYear()
    return new Date().getFullYear() - birthYear
  })
  const [gender, setGender] = useState(() => {
    if (member.gender === 'MALE') return 'Masculino'
    if (member.gender === 'FEMALE') return 'Femenino'
    return 'Otro'
  })
  const [objectives, setObjectives] = useState('Ganancia de masa muscular / Hipertrofia')
  const [experienceLevel, setExperienceLevel] = useState('Intermedio')
  const [weeklyDays, setWeeklyDays] = useState(3)
  const [limitations, setLimitations] = useState('')

  // Rutina generada
  const [routine, setRoutine] = useState<RoutineProposal | null>(null)
  const [copied, setCopied] = useState(false)

  const saveMutation = useMutation({
    mutationFn: createTrainerObservation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trainer-observations', member.id],
      })
      toast.success(`Rutina de ${member.fullName} guardada con éxito en su ficha virtual.`)
      setOpen(false)
    },
    onError: (err) => {
      console.error(err)
      toast.error('Error al guardar la rutina en la ficha del socio.')
    },
  })

  const handleGenerate = async () => {
    setLoading(true)
    setRoutine(null)
    try {
      const data = await generateAIRoutine({
        data: {
          age: Number(age),
          gender,
          objectives,
          experienceLevel,
          weeklyDays: Number(weeklyDays),
          limitations: limitations || undefined,
        }
      })
      setRoutine(data)
      toast.success('¡Rutina generada con éxito por la IA!')
    } catch (error) {
      console.error(error)
      toast.error('Error al generar la rutina con IA. Revisá las variables de entorno.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!routine) return
    
    let text = `🏋️‍♂️ PLAN DE ENTRENAMIENTO PERSONALIZADO: ${routine.title}\n`
    text += `👤 Socio: ${member.fullName}\n`
    text += `📝 Recomendaciones: ${routine.notes}\n\n`
    
    routine.days.forEach((day) => {
      text += `📅 ${day.dayName}\n`
      day.exercises.forEach((ex) => {
        text += `- ${ex.name}: ${ex.sets}x${ex.reps} (Descanso: ${ex.rest})${ex.notes ? ` [Nota: ${ex.notes}]` : ''}\n`
      })
      text += '\n'
    })

    text += `⚠️ Nota: Este plan fue generado por IA y debe ser supervisado por tu entrenador.`

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Rutina copiada al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    if (!routine) return
    
    let text = `🏋️‍♂️ PLAN DE ENTRENAMIENTO PERSONALIZADO: ${routine.title}\n`
    text += `👤 Socio: ${member.fullName}\n`
    text += `📝 Recomendaciones: ${routine.notes}\n\n`
    
    routine.days.forEach((day) => {
      text += `📅 ${day.dayName}\n`
      day.exercises.forEach((ex) => {
        text += `- ${ex.name}: ${ex.sets}x${ex.reps} (Descanso: ${ex.rest})${ex.notes ? ` [Nota: ${ex.notes}]` : ''}\n`
      })
      text += '\n'
    })

    text += `⚠️ Nota: Este plan fue generado por IA y debe ser supervisado por tu entrenador.`

    saveMutation.mutate({
      data: {
        memberId: member.id,
        note: text,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 hover:bg-primary/5 active:scale-95 transition-all duration-150">
          <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
          <span>Rutina IA</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl border border-zinc-200/80 shadow-2xl bg-white p-6">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-zinc-900">
            <Dumbbell className="w-6 h-6 text-violet-600" />
            <span>Generador de Rutinas con IA</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Diseñá una rutina deportiva personalizada para <strong className="text-zinc-800 font-semibold">{member.fullName}</strong> en segundos usando inteligencia artificial.
          </DialogDescription>
        </DialogHeader>

        {!routine && !loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-zinc-700 font-medium">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="rounded-lg border-zinc-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-zinc-700 font-medium">Género</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="rounded-lg border-zinc-200">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro / No especifica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level" className="text-zinc-700 font-medium">Nivel de Experiencia</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger id="level" className="rounded-lg border-zinc-200">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Principiante">Principiante (menos de 6 meses)</SelectItem>
                    <SelectItem value="Intermedio">Intermedio (6 meses a 2 años)</SelectItem>
                    <SelectItem value="Avanzado">Avanzado (más de 2 años)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="days" className="text-zinc-700 font-medium">Días por Semana</Label>
                <Select value={String(weeklyDays)} onValueChange={(val) => setWeeklyDays(Number(val))}>
                  <SelectTrigger id="days" className="rounded-lg border-zinc-200">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Días (Cuerpo completo)</SelectItem>
                    <SelectItem value="3">3 Días (Empuje/Tirón/Pierna)</SelectItem>
                    <SelectItem value="4">4 Días (Torso/Pierna x2)</SelectItem>
                    <SelectItem value="5">5 Días (Weider / Arnold)</SelectItem>
                    <SelectItem value="6">6 Días (Frecuencia 2 avanzada)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectives" className="text-zinc-700 font-medium">Objetivos de Entrenamiento</Label>
                <Input
                  id="objectives"
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="Ej: Aumentar masa muscular, bajar porcentaje de grasa..."
                  className="rounded-lg border-zinc-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="limitations" className="text-zinc-700 font-medium">Lesiones, dolores o limitaciones</Label>
                <Textarea
                  id="limitations"
                  value={limitations}
                  onChange={(e) => setLimitations(e.target.value)}
                  placeholder="Ej: Hernia de disco L4-L5, dolor en hombro izquierdo al empujar. Si no hay, dejar vacío."
                  className="rounded-lg border-zinc-200 h-20 resize-none"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-4">
              <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-lg">
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-2 shadow-md shadow-violet-500/10 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generar Rutina</span>
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 text-violet-600 animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-zinc-800 font-semibold text-lg">Diseñando plan deportivo óptimo...</p>
              <p className="text-zinc-400 text-sm">Nuestra IA está calculando los volúmenes de entrenamiento más adecuados.</p>
            </div>
          </div>
        ) : routine ? (
          <div className="py-4 space-y-6">
            <div className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-xl space-y-2 shadow-inner">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Título de la propuesta</h3>
                  <Input
                    value={routine.title}
                    onChange={(e) => setRoutine({ ...routine, title: e.target.value })}
                    className="font-bold text-xl text-zinc-950 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-violet-500 p-0 h-auto rounded-none focus-visible:ring-0 focus-visible:border-b-2"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-lg flex items-center gap-1.5 hover:bg-zinc-100">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </Button>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200/50">
                <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Notas del Entrenador & Consejos</h4>
                <Textarea
                  value={routine.notes}
                  onChange={(e) => setRoutine({ ...routine, notes: e.target.value })}
                  className="text-zinc-600 text-sm mt-1 bg-transparent border-transparent hover:border-zinc-300 focus:border-violet-500 p-0 h-16 resize-none rounded-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="space-y-6">
              {routine.days.map((day, dIdx) => (
                <div key={dIdx} className="border rounded-xl border-zinc-200/80 overflow-hidden shadow-sm">
                  <div className="bg-zinc-100/80 px-4 py-2 border-b border-zinc-200/80 flex justify-between items-center">
                    <Input
                      value={day.dayName}
                      onChange={(e) => {
                        const newDays = [...routine.days]
                        newDays[dIdx].dayName = e.target.value
                        setRoutine({ ...routine, days: newDays })
                      }}
                      className="font-semibold text-zinc-800 bg-transparent border-transparent hover:border-zinc-300 focus:border-violet-500 p-0 h-auto rounded-none focus-visible:ring-0 w-full"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b text-zinc-500 font-semibold uppercase text-xs">
                          <th className="p-3">Ejercicio</th>
                          <th className="p-3 w-20 text-center">Series</th>
                          <th className="p-3 w-28 text-center">Reps</th>
                          <th className="p-3 w-28 text-center">Descanso</th>
                          <th className="p-3">Instrucciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.exercises.map((ex, eIdx) => (
                          <tr key={eIdx} className="border-b last:border-0 hover:bg-zinc-50/50">
                            <td className="p-3">
                              <Input
                                value={ex.name}
                                onChange={(e) => {
                                  const newDays = [...routine.days]
                                  newDays[dIdx].exercises[eIdx].name = e.target.value
                                  setRoutine({ ...routine, days: newDays })
                                }}
                                className="bg-transparent border-transparent hover:border-zinc-300 focus:border-violet-500 p-0 h-auto rounded-none focus-visible:ring-0 font-medium text-zinc-800 w-full"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Input
                                type="number"
                                value={ex.sets}
                                onChange={(e) => {
                                  const newDays = [...routine.days]
                                  newDays[dIdx].exercises[eIdx].sets = Number(e.target.value)
                                  setRoutine({ ...routine, days: newDays })
                                }}
                                className="bg-transparent border-transparent hover:border-zinc-300 focus:border-violet-500 p-0 h-auto rounded-none focus-visible:ring-0 text-center w-full"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Input
                                value={ex.reps}
                                onChange={(e) => {
                                  const newDays = [...routine.days]
                                  newDays[dIdx].exercises[eIdx].reps = e.target.value
                                  setRoutine({ ...routine, days: newDays })
                                }}
                                className="bg-transparent border-transparent hover:border-zinc-300 focus:border-violet-500 p-0 h-auto rounded-none focus-visible:ring-0 text-center w-full"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Input
                                value={ex.rest}
                                onChange={(e) => {
                                  const newDays = [...routine.days]
                                  newDays[dIdx].exercises[eIdx].rest = e.target.value
                                  setRoutine({ ...routine, days: newDays })
                                }}
                                className="bg-transparent border-transparent hover:border-zinc-300 focus:border-violet-500 p-0 h-auto rounded-none focus-visible:ring-0 text-center w-full"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                value={ex.notes || ''}
                                onChange={(e) => {
                                  const newDays = [...routine.days]
                                  newDays[dIdx].exercises[eIdx].notes = e.target.value
                                  setRoutine({ ...routine, days: newDays })
                                }}
                                className="bg-transparent border-transparent hover:border-zinc-300 focus:border-violet-500 p-0 h-auto rounded-none focus-visible:ring-0 text-zinc-500 w-full"
                                placeholder="Agregar instrucción..."
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-lg flex items-start gap-2 shadow-sm">
              <span className="font-bold">⚠️ ADVERTENCIA LEGAL:</span>
              <p>Este plan de entrenamiento fue propuesto por un sistema automatizado de inteligencia artificial. Debe ser revisado, validado y aprobado formalmente por un preparador físico antes de su puesta en marcha.</p>
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <Button variant="ghost" onClick={() => setRoutine(null)} className="rounded-lg">
                ← Volver a Configurar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopy} className="rounded-lg flex items-center gap-1.5">
                  <Copy className="w-4 h-4" />
                  <span>Copiar Rutina</span>
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1.5 shadow-md active:scale-95 transition-all">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saveMutation.isPending ? 'Guardando...' : 'Guardar y Asignar'}</span>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
