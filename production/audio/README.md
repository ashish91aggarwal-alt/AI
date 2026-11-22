# Local audio: carols and worship pieces (no GPU)

**Samples:** VCSL, the Versilian Community Sample Library (CC0), from github.com/sgossner/VCSL.
Sparse checkout only:
- (`Chordophones/Zithers/Grand Piano, Steinway B` is NOT used for the worship piano: only 2–3 velocity layers and 1 round robin, too static for exposed soft playing.)
- `Chordophones/Composite Chordophones/Folk Harp`: F1 carols, worship harp colour.
- `Aerophones/Edge-blown Aerophones/Baroque Alto Recorder/Sustain` and `.../Baroque Tenor Recorder/Sustain`: F1 carol melodies.
- VCSL has no bowed strings.

**Worship piano:** Salamander Grand Piano (Yamaha C5, 16 velocity layers), CC BY 3.0 by Alexander Holm,
github.com/sfzinstruments/SalamanderGrandPiano (reachable via git from the workspace, checked 17 Nov).
Credit line in every worship description: "Piano samples: Salamander Grand Piano by Alexander Holm (CC BY 3.0)".

**Strings:** VSCO-2 CE (Versilian Studios, CC0), github.com/sgossner/VSCO-2-CE (reachable, checked 17 Nov):
violin, viola, cello sustains for soft pads and cello lines. Courtesy credit to Versilian Studios.

**Synth pads:** our own local synth (detuned saw/sine stacks, slow attack, low-pass, chorus).

**Humanising (needed because VCSL has 1 round robin):** release tails from the recordings (or a measured
exponential fade, never a hard cut), ±8 velocity, ±12 ms timing, ±3 cents drift between repeated notes,
breath-shaped swells on held recorder notes, no identical sample restart within 200 ms.

**Melody sources (accuracy is gated):** every carol melody is taken from a public-domain printed
edition, never from memory or a modern arrangement:
- In Dulci Jubilo, Coventry Carol, Wexford Carol: The Oxford Book of Carols (1928; Grattan Flood's Wexford transcription).
- O Holy Night: Adam (1847). Silent Night: Gruber (1818).
- O Come O Come Emmanuel: Helmore, *Hymnal Noted* (1856). O Little Town of Bethlehem: Redner (1868).

Each melody is entered as ABC/MusicXML and **cross-checked note by note against two independent
transcriptions** before arranging. The G3 reviewer checks the result against the printed source.

**Renderer** (`render.py`, built 17 Nov; `SAMPLES=~/samples python3 render.py --selftest` renders a soft pedalled piano test and checks for clicks):
- MIDI note → nearest sample, resampled to pitch.
- Velocity → sample layer plus gain. Release envelope at note-off. Sustain-pedal model for piano.
- Convolution reverb from a generated impulse response, with RT60 and EQ matched to the neighbouring ACE-Step tracks (F1 rule: ±15% RT60, ±1.5 dB per octave band).
- Output: 48 kHz 24-bit WAV.
- Mastered with the shared loudness step: −17 LUFS for fantasy, −19 LUFS for worship, ≤ −1 dBTP.

**Sample checkout (outside the repo):** `git clone --filter=blob:none --no-checkout` then `git checkout HEAD -- <paths>`
into `~/samples/<repo>`. Salamander: `Samples Data "Salamander Grand Piano V3.sfz"` (715 MB FLAC).
Never run `git ls-tree -l` on a blobless clone (it downloads every blob to report sizes).
