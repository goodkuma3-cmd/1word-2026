import React, { useEffect, useMemo, useRef, useState } from "react";
import { Activity, RefreshCw, Send, Sparkles, Terminal, Loader2 } from "lucide-react";

const App = () => {
  const [phase, setPhase] = useState(0);
  const [logs, setLogs] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // ロゴ：1.2秒後に UMAだけ白、他グレー
  const [logoDimmed, setLogoDimmed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const canvasRef = useRef(null); // 馬/2026
  const logoCanvasRef = useRef(null); // KUMAnoTE
  const wordCanvasRef = useRef(null); // 1 / WORD

  // ====== “質感”基準（馬/2026に合わせる）
  const DOT_SPACING = 10; // ピッチ（基準）
  const DOT_RADIUS = 2.2; // 半径（基準）
  const BLUR = 2.6; // ちょいボケ
  const BASE_ALPHA_MIN = 0.7; // チリチリの下限
  const BASE_ALPHA_RAND = 0.3; // チリチリの幅

  // ====== ロゴ/1WORDは「表示だけ」縮小して収める
  const LOGO_CANVAS_W = 560;
  const LOGO_CANVAS_H = 160;
  const LOGO_DISPLAY_W = 360;
  const LOGO_DISPLAY_H = 110;

  const WORD_CANVAS_W = 560;
  const WORD_CANVAS_H = 260;
  const WORD_DISPLAY_W = 360;
  const WORD_DISPLAY_H = 190;

  // =========
  // 5x5 dot font patterns
  // =========
  const dotPatterns = useMemo(
    () => ({
      "0": ["01110", "10011", "10101", "11001", "01110"],
      "1": ["00100", "01100", "00100", "00100", "01110"],
      "2": ["01110", "10001", "00110", "01000", "11111"],
      "6": ["01110", "10000", "11110", "10001", "01110"],

      K: ["10001", "10010", "11100", "10010", "10001"],
      U: ["10001", "10001", "10001", "10001", "01110"],
      M: ["10001", "11011", "10101", "10001", "10001"],
      A: ["01110", "10001", "11111", "10001", "10001"],
      n: ["00000", "01110", "10001", "10001", "10001"],
      o: ["00000", "01110", "10001", "10001", "01110"],
      T: ["11111", "00100", "00100", "00100", "00100"],
      E: ["11111", "10000", "11110", "10000", "11111"],

      W: ["10001", "10001", "10101", "11011", "10001"],
      O: ["01110", "10001", "10001", "10001", "01110"],
      R: ["11110", "10001", "11110", "10010", "10001"],
      D: ["11110", "10001", "10001", "10001", "11110"],

      " ": ["00000", "00000", "00000", "00000", "00000"],
    }),
    []
  );

  // =========
  // horse + 2026 patterns
  // =========
  const horsePatterns = useMemo(
    () => [
      [
        "00001000000000000000",
        "00111100000000000000",
        "11101110000000000000",
        "11111111000000000000",
        "00001111100000000000",
        "00000111111111111100",
        "00000111111111110110",
        "00000111111111110011",
        "00001111111111110000",
        "00001010000011110000",
        "00001001000010010000",
        "00000100000100100000",
        "00000000001001000000",
      ],
      [
        "00001000000000000000",
        "00111100000000000000",
        "11101110000000000000",
        "11111111000000000000",
        "00001111100000000000",
        "00000111111111111100",
        "00000111111111110110",
        "00000111111111110011",
        "00001111111111110000",
        "00000110000001100000",
        "00000110000001100000",
        "00000011000011000000",
        "00000001100110000000",
      ],
    ],
    []
  );

  const yearPattern = useMemo(
    () => [
      "00000000000000000000",
      "11110111101111011110",
      "00010100100001010000",
      "11110100101111011110",
      "10000100101000010010",
      "11110111101111011110",
      "00000000000000000000",
    ],
    []
  );

  // =========
  // log
  // =========
  const addLog = (text) => {
    const time = new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev.slice(-4), `[${time}] ${text}`]);
  };

  // =========
  // ロゴ dim（1.2s）
  // =========
  useEffect(() => {
    if (phase === 0) {
      setLogoDimmed(false);
      const timer = setTimeout(() => {
        setLogoDimmed(true);
        addLog("LOGO: SYSTEM_DORMANT_STBY");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleLogoClick = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    addLog("SYSTEM: KERNEL_INITIALIZING");
    setTimeout(() => {
      setPhase(1);
      addLog("PHASE_1: ANIM_HORSE");
      setIsTransitioning(false);
    }, 800);
  };

  // =========
  // 物語テンプレ（API無し）
  // =========
  const templates = useMemo(
    () => [
      "丙午の2026年、僕は「{k}」という言葉をポケットに入れて歩いた。風は静かにページをめくる。最後に必要なのは、たぶんクマノテだ。",
      "「{k}」は少し湿った火花みたいに僕の中で鳴った。蹄のリズムが遠くで続いている。だったら、クマノテを借りよう。",
      "丙午の2026年、僕は「{k}」を誰にも見せない暗号にした。夜が深くなるほど手触りが増す。クマノテに預けてみる。",
      "「{k}」って小さな坂道みたいだ。僕は何度も上り下りして息を切らす。手が足りないなら、クマノテを借りよう。",
      "僕は「{k}」を口の中で転がした。妙にエロティックな響きがあって、空気が少しだけ甘くなる。こういうときは、クマノテが必要だ。",
      "「{k}」にはどこか可愛さがある。すぐ寄ってきて、すぐ逃げる。丙午の2026年、僕は追いかけるのをやめてクマノテを借りる。",
      "丙午の2026年、僕は「{k}」のせいで少し怖くなった。暗い水の底で何かが動く感じ。クマノテにライトを借りる。",
      "「{k}」は宇宙の端っこから落ちてきたネジみたいに机で転がった。拾い上げて、クマノテに渡した。",
      "体育会系の春みたいに「{k}」は汗の匂いがする。僕は靴紐を結び直す。走るなら、クマノテを借りよう。",
      "「{k}」は扉だ。開けると馬がいて、馬は黙って僕を見る。背に乗る前に、クマノテを借りた。",
    ],
    []
  );

  // ★キーワードから必ず同じテンプレを選ぶための関数
const pickTemplateByKeyword = (keyword) => {
  let hash = 0;
  for (let i = 0; i < keyword.length; i++) {
    hash += keyword.charCodeAt(i);
  }
  return templates[hash % templates.length];
};


  const generateForecast = async (keyword) => {
    if (!keyword) return;
    setIsGenerating(true);
    setAiResponse("");
    addLog(`AI: START ENGINE "${keyword.toUpperCase()}"`);

    try {
      await new Promise((r) => setTimeout(r, 420));
      const pick = pickTemplateByKeyword(keyword);
      const out = pick.replaceAll("{k}", keyword.trim());
      setAiResponse(out);
      addLog("AI: STORY_GENERATED_SUCCESS");
    } catch {
      addLog("AI: ENGINE_FAILURE");
      setAiResponse("風向きが変わったようだ。別の言葉を探してみよう。");
    } finally {
      setIsGenerating(false);
    }
  };

  // =========
  // ★追加：パターンを解像度アップ（ドットを増やす）
  // 例：factor=2 なら 5x5 → 10x10 のようにタイル化して密度を増やす
  // =========
  const expandPattern = (patternRows, factor = 2) => {
    if (!patternRows || factor <= 1) return patternRows;

    const expanded = [];
    for (const row of patternRows) {
      const expandedRow = row
        .split("")
        .map((ch) => ch.repeat(factor))
        .join("");

      for (let i = 0; i < factor; i++) {
        expanded.push(expandedRow);
      }
    }
    return expanded;
  };

  // =========
  // 共通：文字列をcanvasで描画（チリチリ＝毎フレーム再描画）
  // =========
  const drawDotTextCanvas = (ctx, text, opts) => {
  const {
    width,
    height,
    center = true,
    brightMask = () => true,
    spacingScale = 1,
    spacingOverride = null, // ★追加：ピッチを直接指定（基準値）
    offsetYRows = 0,
    clear = false,
  } = opts;

  if (clear) ctx.clearRect(0, 0, width, height);

  const matrices = text.split("").map((ch) => dotPatterns[ch] || dotPatterns[" "]);
  const rows = 5;
  const charGap = 1;
  const totalCols = text.length * 5 + (text.length - 1) * charGap;

  // ★重要：overrideは“基準ピッチ”として扱い、scaleをちゃんと効かせる
  const baseSpacing = spacingOverride ?? DOT_SPACING;
  const spacing = baseSpacing * spacingScale;

  const cols = Math.floor(width / spacing);
  const rws = Math.floor(height / spacing);

  const startX = center ? Math.floor((cols - totalCols) / 2) : 0;
  const startY = (center ? Math.floor((rws - rows) / 2) : 0) + offsetYRows;

  ctx.shadowBlur = BLUR;
  ctx.shadowColor = "rgba(255,255,255,0.35)";

  let colCursor = 0;
  for (let charIdx = 0; charIdx < matrices.length; charIdx++) {
    const pat = matrices[charIdx];
    const isBright = brightMask(charIdx);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 5; c++) {
        if (pat[r][c] !== "1") continue;

        const x = (startX + colCursor + c) * spacing + spacing / 2;
        const y = (startY + r) * spacing + spacing / 2;

        ctx.beginPath();
        ctx.globalAlpha =
          (BASE_ALPHA_MIN + Math.random() * BASE_ALPHA_RAND) * (isBright ? 1 : 0.55);
        ctx.fillStyle = isBright ? "#fff" : "#a1a1aa";
        ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    colCursor += 5;
    if (charIdx !== matrices.length - 1) colCursor += charGap;
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
};


  // =========
  // ロゴ(canvas)：毎フレーム描画（太り防止のため clear:true）
  // =========
  useEffect(() => {
    if (phase !== 0) return;
    const canvas = logoCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let raf;

    const tick = () => {
      const text = "KUMAnoTE";

      // UMA: index 1..3（U,M,A）
      const brightMask = (charIdx) => {
        if (!logoDimmed) return true;
        return charIdx >= 1 && charIdx <= 3;
      };

      drawDotTextCanvas(ctx, text, {
        width: canvas.width,
        height: canvas.height,
        brightMask,
        spacingScale: 1,
        offsetYRows: 0,
        clear: true,
      });

      raf = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(raf);
  }, [phase, logoDimmed]);

  // =========
  // 1 WORD(canvas)：2行組み
  //  - 「1」は大きさはそのまま（spacingScale:2.0）
  //  - ピッチはWORDと同じ（DOT_SPACING）に揃える
  //  - その代わり「1」のパターンだけ2倍解像度にしてドット数を増やす
  // =========
  useEffect(() => {
    if (phase !== 3) return;
    const canvas = wordCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let raf;

    const tick = () => {
  // 1行目：1（大きさは維持しつつピッチを詰める）
  drawDotTextCanvas(ctx, "1", {
    width: canvas.width,
    height: canvas.height,
    brightMask: () => true,
    spacingScale: 2.4,          // ← 大きさは「前の感じ」
    spacingOverride: 7.0,       // ← ここでピッチを詰める（7.0〜9.0で調整）
    offsetYRows: -2,
    clear: true,
  });

  // 2行目：WORD（通常）
  drawDotTextCanvas(ctx, "WORD", {
    width: canvas.width,
    height: canvas.height,
    brightMask: () => true,
    spacingScale: 1.0,
    spacingOverride: 10.0,      // ← WORDのピッチ（基準）
    offsetYRows: 5,
    clear: false,
  });

  raf = requestAnimationFrame(tick);
};


    tick();
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // =========
  // 馬/2026 canvas
  // =========
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let frame = 0;
    let lastFrameTime = 0;

    const render = (timestamp) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pattern =
        phase === 1
          ? horsePatterns[frame % horsePatterns.length]
          : phase === 2
          ? yearPattern
          : null;

      if (pattern) {
        if (phase === 1 && timestamp - lastFrameTime > 120) {
          frame++;
          lastFrameTime = timestamp;
        }

        const cols = Math.floor(canvas.width / DOT_SPACING);
        const rows = Math.floor(canvas.height / DOT_SPACING);

        const startX = Math.floor((cols - pattern[0].length) / 2);
        const startY = Math.floor((rows - pattern.length) / 2);

        ctx.shadowBlur = BLUR;
        ctx.shadowColor = "rgba(255,255,255,0.35)";

        for (let r = 0; r < pattern.length; r++) {
          for (let c = 0; c < pattern[0].length; c++) {
            if (pattern[r][c] !== "1") continue;

            const x = (startX + c) * DOT_SPACING + DOT_SPACING / 2;
            const y = (startY + r) * DOT_SPACING + DOT_SPACING / 2;

            ctx.beginPath();
            ctx.fillStyle = "#fff";
            ctx.globalAlpha = BASE_ALPHA_MIN + Math.random() * BASE_ALPHA_RAND;
            ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);
    return () => cancelAnimationFrame(animationFrameId);
  }, [phase, horsePatterns, yearPattern]);

  // =========
  // click transition
  // =========
  const handleMainClick = () => {
    if (phase === 0) return handleLogoClick();
    if (phase < 4) setPhase((p) => p + 1);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-between p-6 overflow-hidden select-none">
      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-start border-b border-zinc-800 pb-4">
        <div className="flex flex-col cursor-pointer" onClick={() => window.location.reload()}>
          <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase mb-0.5 font-bold">
            Archive // 2026
          </span>
          <div className="flex items-center w-[112px] justify-between">
            <h1 className="text-[12px] font-normal tracking-[0.12em]">KUMAnoTE</h1>
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="flex gap-2 items-center text-xs text-zinc-400 font-bold">
            <Activity size={12} className="text-zinc-600" />
            <span>SYSTEM_ACTIVE</span>
          </div>
          <span className="text-[10px] text-zinc-600 uppercase mt-1 font-bold">Unit-01 // Tokyo</span>
        </div>
      </div>

      {/* Main */}
      <div
        className={`relative flex-1 w-full flex items-center justify-center group ${phase < 4 ? "cursor-pointer" : ""}`}
        onClick={handleMainClick}
      >
        {phase === 0 ? (
          <div className="relative p-20 flex flex-col items-center justify-center rounded-[40px] border border-zinc-800/20 bg-zinc-900/5">
            {/* ロゴ(canvas) */}
            <canvas
              ref={logoCanvasRef}
              width={LOGO_CANVAS_W}
              height={LOGO_CANVAS_H}
              className="opacity-95"
              style={{
                width: LOGO_DISPLAY_W,
                height: LOGO_DISPLAY_H,
                transform: "translateY(36px)",
              }}
            />

            <div className="text-[9px] tracking-[0.8em] text-zinc-700 uppercase mt-16 animate-pulse font-bold">
              Touch to start
            </div>
          </div>
        ) : phase < 3 ? (
          <canvas ref={canvasRef} width={600} height={400} className="max-w-full opacity-90" />
        ) : phase === 3 ? (
          <canvas
            ref={wordCanvasRef}
            width={WORD_CANVAS_W}
            height={WORD_CANVAS_H}
            className="opacity-95"
            style={{ width: WORD_DISPLAY_W, height: WORD_DISPLAY_H }}
          />
        ) : (
          <div className="w-full max-w-lg space-y-6 p-8">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
              <Sparkles size={18} className="text-red-600" />
              <span className="text-[10px] tracking-[0.4em] uppercase text-zinc-500 font-bold">
                1 WORD // STORIES
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="今年走らせたいことを一言で"
                className="flex-1 bg-transparent border border-zinc-800 p-4 text-xs focus:border-zinc-500 transition-colors font-bold"
                onKeyDown={(e) => e.key === "Enter" && generateForecast(userInput)}
              />
              <button
                onClick={() => generateForecast(userInput)}
                disabled={isGenerating || !userInput}
                className="bg-white text-black px-6"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </div>

            {aiResponse && (
              <div className="p-6 border-l border-red-600 bg-zinc-950 animate-in slide-in-from-left-1">
                <p className="text-xs leading-relaxed text-zinc-200 italic font-light whitespace-pre-line">
                  {aiResponse}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => window.location.reload()}
                className="text-[9px] text-zinc-700 hover:text-red-500 transition-colors uppercase tracking-[0.4em] flex items-center gap-1 font-bold"
              >
                <RefreshCw size={10} /> Reboot
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log */}
      <div className="w-full max-w-2xl bg-zinc-950/50 border border-zinc-900 p-6 rounded-sm">
        <div className="flex items-center gap-2 mb-3 text-[9px] text-zinc-700 uppercase tracking-[0.4em] font-bold">
          <Terminal size={10} />
          <span>System Output log</span>
        </div>
        <div className="space-y-1 h-20 overflow-hidden text-[10px] font-bold">
          {logs.map((log, i) => (
            <div key={i} className={i === logs.length - 1 ? "text-zinc-300" : "text-zinc-700"}>
              {log}
            </div>
          ))}
          <div className="text-zinc-200 animate-pulse">_</div>
        </div>
      </div>
    </div>
  );
};

export default App;
