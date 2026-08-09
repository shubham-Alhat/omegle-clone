"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  function findNext() {
    setStatus("searching");
    window.setTimeout(() => setStatus("idle"), 900);
  }

  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-[1085px]">
        <h1 className="text-4xl font-bold tracking-tight sm:text-[40px]">
          Omegle Clone
        </h1>
        <p className="mt-6 text-lg leading-7 sm:text-xl">
          Status: <span className="font-bold">{status}</span>
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
          onClick={findNext}
          className="mt-5 rounded-lg bg-neutral-950 px-6 py-2.5 text-base text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950 cursor-pointer"
        >
          Next
        </button>
      </div>
    </main>
  );
}
