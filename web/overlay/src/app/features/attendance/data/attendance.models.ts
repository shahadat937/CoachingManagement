export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Excused';

export interface AttendanceRow {
  studentId: string;
  status: AttendanceStatus;
  source: 'Device' | 'Manual';
  markedAt: string;
}

export interface CreateSessionRequest {
  classLevel: number; // 1..12
  subjectId: string;
  subjectName: string;
  roomCode: string;
  startsAt: string;
  endsAt: string;
}
