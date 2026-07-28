import { create } from 'zustand';

type AnalysisFormStore = {
  formData: FormData | null;
  setFormData: (fd: FormData) => void;
  clear: () => void;
};

const useAnalysisFormStore = create<AnalysisFormStore>((set) => ({
  formData: null,
  setFormData: (fd: FormData) => set({ formData: fd }),
  clear: () => set({ formData: null }),
}));

export { useAnalysisFormStore };
