import { toast } from "sonner";

interface PopupMessage {
  title?: string;
  text?: string;
}

export const displayPopup = (message: PopupMessage) => {
  toast.success(message.title || message.text || "", {
    description: message.title ? message.text : undefined,
    duration: 3000,
  });
};
