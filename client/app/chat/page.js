"use client";

import { use, useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        t.stop();
        console.log(`Stopped track: ${t.kind} (${t.label})`);
      });
      streamRef.current = null;
    }
  };

  const getCam = async () => {
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      console.log(
        "New stream tracks:",
        stream.getTracks().map((t) => `${t.kind}:${t.id}`),
      );
    } catch (error) {
      console.log(error);
      setStatus("error");
    }
  };

  useEffect(() => {
    let ignore = false; // scoped to THIS effect invocation only

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (ignore) {
          // This effect run was already cleaned up before the promise
          // resolved (StrictMode double-invoke, or fast navigation).
          // Kill this stream immediately — don't let it leak.
          stream.getTracks().forEach((t) => t.stop());
          console.log(
            "Discarded stale stream:",
            stream.getTracks().map((t) => t.id),
          );
          return;
        }

        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setStatus("connected");
        console.log(
          "Active stream tracks:",
          stream.getTracks().map((t) => `${t.kind}:${t.id}`),
        );
      } catch (error) {
        console.log(error);
      }
    }
    startCamera();

    return () => {
      ignore = true;
      console.log("cleanup: unmounting, stopping camera");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          t.stop();
          console.log(`Stopped track: ${t.kind} (${t.label})`);
        });
        streamRef.current = null;
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-[1085px]">
        <h1 className="text-4xl font-bold tracking-tight sm:text-[40px]">
          Omegle Clone
        </h1>
        <p className="mt-6 text-lg leading-7 sm:text-xl">
          Status: <span className="font-bold">{"connecting"}</span>
        </p>

        <section
          aria-label="Video chat"
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <div className="aspect-video overflow-hidden rounded-lg bg-neutral-200">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          </div>
          <div className="aspect-video overflow-hidden rounded-lg">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <button
          type="button"
          className="mt-5 rounded-lg bg-neutral-950 px-6 py-2.5 text-base text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950 cursor-pointer"
        >
          Next
        </button>
      </div>
    </main>
  );
}
