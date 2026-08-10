# How react strict mode result in webrtc leaks and how i solved it.

[Read this chat last message](https://claude.ai/share/546f9dca-e047-4fe0-891c-1bd409ec8391)

below is just a overview of what i did

Render #1 (Mount A)
────────────────────
useEffect runs:
→ ignoreA = false (new variable, lives in Mount A's closure)
→ startCamera() called
→ getUserMedia() called — call goes out, JS engine moves on, doesn't wait
→ useEffect returns cleanupA function (captures ignoreA by reference)

React (StrictMode) immediately runs cleanupA:
→ ignoreA = true
→ streamRef.current is still null (promise A hasn't resolved yet!)
→ nothing to stop

Render #2 (Mount B)
────────────────────
useEffect runs again:
→ ignoreB = false (BRAND NEW variable — unrelated to ignoreA)
→ startCamera() called
→ getUserMedia() called — second call goes out
→ useEffect returns cleanupB (captures ignoreB)

[Now the two getUserMedia() promises are both pending "in the background."
The camera hardware is doing its thing, permission was already granted,
so both resolve soon after, in call order.]

Promise A resolves:
→ checks ignoreA → TRUE (cleanupA already set it)
→ stream A gets stopped immediately, never touches streamRef
→ "Discarded stale stream" logged

Promise B resolves:
→ checks ignoreB → FALSE (cleanupB hasn't run yet — Mount B is the "real" one)
→ streamRef.current = stream B
→ "Active stream tracks" logged

[... user navigates away later ...]

cleanupB finally runs for real:
→ ignoreB = true
→ streamRef.current is stream B → gets stopped properly
