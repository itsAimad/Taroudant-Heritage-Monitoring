export interface AccessRequest {
  id: string;
  fullName: string;
  email: string;
  organization: string;
  role: 'inspector' | 'authority';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

const mockRequests: AccessRequest[] = [
  {
    id: 'req-001',
    fullName: 'Youssef Ait Brahim',
    email: 'y.aitbrahim@heritage-souss.ma',
    organization: 'Direction Régionale de la Culture',
    role: 'authority',
    reason:
      'Need access to monitor inspection reports for the northern rampart zone assigned to our department.',
    status: 'pending',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'req-002',
    fullName: 'Fatima Zahra Moussaoui',
    email: 'fz.moussaoui@inspectionma.com',
    organization: 'Bureau Technique Taroudant',
    role: 'inspector',
    reason:
      'Assigned to document structural cracks in Bab Zorgane and surrounding wall sections as part of a university research project.',
    status: 'pending',
    submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

export const accessRequestService = {
  submitRequest: async (
    data: Omit<AccessRequest, 'id' | 'status' | 'submittedAt'>,
  ): Promise<AccessRequest> => {
    await new Promise((res) => setTimeout(res, 1400));
    const newRequest: AccessRequest = {
      ...data,
      id: `req-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    mockRequests.push(newRequest);
    return newRequest;
  },

  getAllRequests: async (): Promise<AccessRequest[]> => {
    await new Promise((res) => setTimeout(res, 600));
    return [...mockRequests].sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() -
        new Date(a.submittedAt).getTime(),
    );
  },

  updateRequestStatus: async (
    id: string,
    status: 'approved' | 'rejected',
    reviewNote?: string,
  ): Promise<AccessRequest> => {
    await new Promise((res) => setTimeout(res, 500));
    const req = mockRequests.find((r) => r.id === id);
    if (!req) {
      throw new Error('Request not found');
    }
    req.status = status;
    req.reviewedAt = new Date().toISOString();
    req.reviewNote = reviewNote;
    return { ...req };
  },

  getPendingCount: async (): Promise<number> => {
    await new Promise((res) => setTimeout(res, 200));
    return mockRequests.filter((r) => r.status === 'pending').length;
  },
};

// TODO: replace mock implementations with real API calls when backend is ready.


