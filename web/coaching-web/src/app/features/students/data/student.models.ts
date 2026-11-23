export interface Student {
  id: string;
  createdAt: string;
  studentNo: string;
  fullName: string;
  classLevel: number;
  guardianPhone: string;
  deviceUserId: string | null;
}

export interface CreateStudentRequest {
  studentNo: string;
  fullName: string;
  classLevel: number;
  guardianPhone: string;
  deviceUserId?: string | null;
}
