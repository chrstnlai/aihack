"use client"
import * as Toast from '@radix-ui/react-toast';
import { useDreamStore } from '../lib/dreamStore';
import { useState, useEffect } from 'react';

export default function Toasts() {
  const { videoJob, clearVideoJob } = useDreamStore();
  const [showProcessingToast, setShowProcessingToast] = useState(false);
  const [showDoneToast, setShowDoneToast] = useState(false);

  useEffect(() => {
    if (videoJob.status === 'processing') setShowProcessingToast(true);
    else setShowProcessingToast(false);
  }, [videoJob.status]);

  useEffect(() => {
    if (videoJob.status === 'done') setShowDoneToast(true);
    else setShowDoneToast(false);
  }, [videoJob.status]);

  return (
    <>
      <Toast.Root
        open={showProcessingToast}
        duration={9999999}
        onOpenChange={setShowProcessingToast}
        className="bg-gray-100 border border-black/20 rounded-xs shadow-lg px-4 py-3 flex flex-col gap-1 min-w-[280px] max-w-full"
      >
        <Toast.Title className="text-black font-semibold">Dream video is being generated…</Toast.Title>
        <Toast.Description className="text-black/80 text-sm">Your dream is being processed in the background. You can continue using the app.</Toast.Description>
      </Toast.Root>
      <Toast.Root
        open={showDoneToast}
        duration={6000}
        onOpenChange={setShowDoneToast}
        className="bg-gray-100 border border-black/20 rounded-xs shadow-lg px-4 py-3 flex flex-col gap-1 min-w-[280px] max-w-full"
      >
        <Toast.Title className="text-black font-semibold">Dream video is ready!</Toast.Title>
        <Toast.Description className="text-black/80 text-sm">Your dream video is now in the Archive.</Toast.Description>
        <a
          href="#archive"
          className="mt-2 underline text-blue-700 hover:text-blue-900 text-left"
          onClick={() => {
            setShowDoneToast(false);
            clearVideoJob();
            // Optionally, trigger navigation to Archive here if you want global navigation
          }}
        >
          Go to archive ↗
        </a>
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-0 right-0 flex flex-col p-4 gap-2 w-96 max-w-full z-[100]" />
    </>
  );
} 