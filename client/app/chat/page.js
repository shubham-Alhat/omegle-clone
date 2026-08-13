"use client";

import { ICE_SERVERS } from "@/lib/webrtc";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const [status, setStatus] = useState("idle");
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const send = useCallback((data) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
  }, []);

  const createPeerConnection = useCallback(() => {
    console.log("PC callback runs", Date.now());
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate)
        send({ type: "ice-candidate", candidate: event.candidate });
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setStatus("connected");
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        setStatus("partner-left");
      }
    };

    return pc;
  }, [send]);

  // initialize the ws connection
  const connectToSignalingServer = useCallback(() => {
    if (wsRef.current) {
      console.log("already connected..");
      return;
    }
    const socket = new WebSocket("ws://localhost:8000/ws");
    wsRef.current = socket;

    socket.onclose = () => {
      console.log("connection closed..");
      wsRef.current = null;
    };

    socket.onerror = (e) => {
      console.log("ws error : ", e);
    };

    socket.onopen = (e) => {
      console.log("connection opened : ", e);
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log("ws data on client : ", data);

      switch (data.type) {
        case "waiting":
          setStatus("waiting for partner");
          break;
        case "matched":
          setStatus("match found, trying to connect..");

          const pc = createPeerConnection();
          if (data.initiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            send({ type: "offer", sdp: offer });
          }
          break;

        case "offer":
          const pc2 = pcRef.current;
          if (!pc2) {
            console.log("pc2 undefined or null");
            break;
          }
          await pc2.setRemoteDescription(new RTCSessionDescription(data.sdp));
          for (const c of pendingCandidatesRef.current)
            await pc2.addIceCandidate(c);
          pendingCandidatesRef.current = [];

          const answer = await pc2.createAnswer();
          await pc2.setLocalDescription(answer);
          send({ type: "answer", sdp: answer });

          break;

        default:
          break;
      }
    };
  }, []);

  // initialized the access of mic/camera
  useEffect(() => {
    let ignore = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (ignore) {
          stream.getTracks().forEach((t) => t.stop());
          console.log(
            "Discarded stale stream:",
            stream.getTracks().map((t) => t.id),
          );
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        console.log(
          "Active stream tracks:",
          stream.getTracks().map((t) => `${t.kind}:${t.id}`),
        );
        // connecting to ws server at very last to avoid incomplete sdp generation
        connectToSignalingServer();
      } catch (error) {
        console.log(error);
      }
    }
    startCamera();

    return () => {
      ignore = true;
      console.log("cleanup: unmounting, stopping camera");
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          t.stop();
          console.log(`Stopped track: ${t.kind} (${t.label})`);
        });
        localStreamRef.current = null;
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
          className="mt-5 rounded-lg bg-neutral-950 px-6 py-2.5 text-base text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950 cursor-pointer"
        >
          Next
        </button>
      </div>
    </main>
  );
}
