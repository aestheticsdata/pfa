import { create } from "zustand";

interface Blur {
  isBlurActive: boolean;
  toggleBlur: () => void;
}

const useBlur = create<Blur>()((set) => ({
  isBlurActive: false,
  toggleBlur: () => set((state) => ({ isBlurActive: !state.isBlurActive })),
}));

export default useBlur;
