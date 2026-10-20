"use client";

import useMutationErrorToast from "@components/shared/hooks/useMutationErrorToast";

/** Mounts the app-wide failed-mutation toast inside the query and locale providers (PFA-242). */
const MutationErrorToaster = () => {
  useMutationErrorToast();
  return null;
};

export default MutationErrorToaster;
