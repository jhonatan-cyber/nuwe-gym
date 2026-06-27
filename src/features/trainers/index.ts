export { TrainersPage } from './trainers-page.tsx'
export {
  getTrainers,
  getTrainer,
  createTrainer,
  updateTrainer,
  assignMember,
  unassignMember,
  setAvailability,
  getMyMembers,
  getTrainerDashboard,
  getTrainerUsers,
} from './server.ts'
export type { TrainerWithDetails, ViewMode } from './types.ts'
