import { toast } from "sonner";

export const displayPopup = (message) => {
  toast.success(message.title || message.text || "", {
    description: message.title ? message.text : undefined,
    duration: 3000,
  });
};
