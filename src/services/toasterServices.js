import { Bounce, toast } from "react-toastify";

export const notifyMessage = (notifyMode, message, time, theme, position) => {
  // Create a toast ID based on message content to prevent duplicate toasts
  const toastId = `${notifyMode}-${message.replace(/\s+/g, "-").toLowerCase()}`;

  toast[notifyMode](<div style={{ whiteSpace: "pre-line" }}>{message}</div>, {
    toastId: toastId,
    position: position,
    autoClose: time, // takes time in milli seconds
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: theme,
    transition: Bounce,
  });
  return;
};
