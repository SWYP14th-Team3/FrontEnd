import { create } from 'zustand';

type AnalysisFormState = {
  resumeFile: File | null;
  jobUrl: string;
  jobText: string;
  jobImages: File[];
  jobImagePreviews: string[];
  contentMode: 'text' | 'image';
};

type AnalysisFormActions = {
  setResumeFile: (file: File | null) => void;
  setJobUrl: (url: string) => void;
  setJobText: (text: string) => void;
  addJobImages: (files: File[], previews: string[]) => void;
  removeJobImage: (index: number) => void;
  setContentMode: (mode: 'text' | 'image') => void;
  toFormData: () => FormData | null;
  hasInput: () => boolean;
  clear: () => void;
};

type AnalysisFormStore = AnalysisFormState & AnalysisFormActions;

const INITIAL_STATE: AnalysisFormState = {
  resumeFile: null,
  jobUrl: '',
  jobText: '',
  jobImages: [],
  jobImagePreviews: [],
  contentMode: 'text',
};

const useAnalysisFormStore = create<AnalysisFormStore>((set, get) => ({
  ...INITIAL_STATE,

  setResumeFile: (file) => set({ resumeFile: file }),
  setJobUrl: (url) => set({ jobUrl: url }),
  setJobText: (text) => set({ jobText: text }),

  addJobImages: (files, previews) =>
    set((state) => ({
      jobImages: [...state.jobImages, ...files],
      jobImagePreviews: [...state.jobImagePreviews, ...previews],
    })),

  removeJobImage: (index) =>
    set((state) => {
      URL.revokeObjectURL(state.jobImagePreviews[index]);
      return {
        jobImages: state.jobImages.filter((_, i) => i !== index),
        jobImagePreviews: state.jobImagePreviews.filter((_, i) => i !== index),
      };
    }),

  setContentMode: (mode) => set({ contentMode: mode }),

  toFormData: () => {
    const { resumeFile, jobUrl, jobText, jobImages } = get();
    if (!resumeFile) return null;

    const formData = new FormData();
    formData.append('resumeFile', resumeFile);

    const hasUrlInput = jobUrl.trim() !== '';
    const hasImageInput = jobImages.length > 0;

    if (hasUrlInput) {
      formData.append('jobInputType', 'URL');
      formData.append('jobUrl', jobUrl.trim());
    } else if (hasImageInput) {
      formData.append('jobInputType', 'IMAGE');
      for (const image of jobImages) {
        formData.append('jobImages', image);
      }
    } else {
      formData.append('jobInputType', 'TEXT');
      formData.append('jobText', jobText.trim());
    }

    return formData;
  },

  hasInput: () => {
    const { resumeFile, jobUrl, jobText, jobImages } = get();
    return !!(resumeFile || jobUrl.trim() || jobText.trim() || jobImages.length > 0);
  },

  clear: () => {
    const { jobImagePreviews } = get();
    jobImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    set(INITIAL_STATE);
  },
}));

export { useAnalysisFormStore };
export type { AnalysisFormStore };
