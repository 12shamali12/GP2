"use client";

import { useEffect } from "react";
import { useToast } from "../components/toast-provider";

type Options = {
  message?: string | null;
  error?: string | null;
  clearMessage?: (() => void) | null;
  clearError?: (() => void) | null;
  messageTitle?: string;
  errorTitle?: string;
};

export function useFeedbackToast({
  message,
  error,
  clearMessage,
  clearError,
  messageTitle = "Saved",
  errorTitle = "Attention",
}: Options) {
  const { pushToast } = useToast();

  useEffect(() => {
    if (!message) return;
    pushToast({
      kind: "success",
      title: messageTitle,
      description: message,
    });
    clearMessage?.();
  }, [message, clearMessage, messageTitle, pushToast]);

  useEffect(() => {
    if (!error) return;
    pushToast({
      kind: "error",
      title: errorTitle,
      description: error,
    });
    clearError?.();
  }, [clearError, error, errorTitle, pushToast]);
}
