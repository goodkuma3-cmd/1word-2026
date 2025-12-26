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
    "「{k}」という言葉が、頭の中で何度か向きを変えた。\n2026年は、物事が一直線に進まない年らしい。\n正しいかどうかは、まだわからない。\nだからクマノテを借りようと思った。",
    "「{k}」について考えていると、時間の進み方が少し変わる。\n時計は動いているのに、結論だけが遅れてくる。\nこういう感覚は、久しぶりだった。\n一人で抱えず、クマノテを借りるのも悪くない。",
    "「{k}」という言葉が、今日になって急に静かになった。\nそれは解決したからではない。\nたぶん、置き場所を探しているだけだ。\nクマノテを借りる、という選択肢が浮かんだ。",
    "「{k}」を考え始めたのは、些細なきっかけだった。\nでも、思ったより奥行きがある。\n2026年は、そういうものが多い。\nこの先はクマノテを借りた方がよさそうだ。",
    "「{k}」という言葉を、何度か心の中で転がしてみた。\n形はまだ定まらない。\nただ、動き出す気配はある。\nクマノテを借りる時期なのかもしれない。",
    "「{k}」を一人で考えるには、少し広すぎる気がした。\n視点を変えれば、違う輪郭が見えてきそうだ。\n2026年は、そうやって進む年だ。\nだからクマノテを借りよう。",
    "「{k}」について、まだ言葉にしていない部分が多い。\n無理にまとめる必要はない。\nただ、放っておく気にもなれなかった。\nクマノテを借りるのが自然な流れだと思った。",
    "「{k}」を考えていると、少しだけ風向きが変わる。\n何かが始まる前の、曖昧な時間だ。\nこういう瞬間は嫌いじゃない。\nクマノテを借りる、という手が見えてきた。",
    "「{k}」は、すぐに答えを出す類の言葉じゃない。\n2026年は、それを許してくれる。\n急がない代わりに、遠くまで行けそうだ。\nクマノテを借りて進むのも、ひとつの方法だ。",
    "「{k}」について考える時間が、少し増えた。\nそれは悪い兆候じゃない。\nむしろ、動く準備に近い。\nクマノテを借りよう、と思えるくらいには。",
    "「{k}」について考えていたはずなのに、\nいつの間にか全然違う景色を思い出していた。\nこういう寄り道が、2026年には多い。\nだからクマノテを借りる、という考えに落ち着いた。",
    "「{k}」は、思ったより素直じゃない。\n追いかけると止まり、放っておくと動き出す。\n扱いにくいけど、嫌いじゃない。\nクマノテを借りたら、うまく走らせられる気がした。",
    "「{k}」を考えていると、理由のない不安が混じる。\n何かを間違える予感だけが、先に来る。\n2026年は、そういう予感が外れない。\n一人で決めず、クマノテを借りるべきだと思った。",
    "「{k}」について考え始めてから、\n夢の中でも続きを探している。\n起きているのか、考えているのか、曖昧だ。\nこのあたりでクマノテを借りた方がよさそうだ。",
    "「{k}」という言葉に、特別な感情はない。\nただ、無視できない重さがある。\n今年は、そういうものだけが残る。\nクマノテを借りて整理するのが妥当だろう。",
    "「{k}」は、静かすぎて逆に気になる。\n動いていないのに、こちらを見ている感じがする。\n2026年は、沈黙が意味を持つ。\nクマノテを借りて確かめた方がいい。",
    "「{k}」について考えている時間が、思ったより長い。\nこんなに考える予定じゃなかった。\nたぶん、それだけ厄介だ。\nクマノテを借りる理由としては十分だと思う。",
    "「{k}」は、まだ形になっていない。\nそれでも、動こうとしている気配がある。\n今年は、その気配を無視しない。\nクマノテを借りて様子を見ることにした。",
    "「{k}」を考えていると、\nそれが前からそこにあった気がしてくる。\n忘れていただけなのかもしれない。\n思い出す前に、クマノテを借りようと思った。",
    "「{k}」は、正面から見ると言葉にならない。\n少し斜めに置くと、ようやく落ち着く。\n2026年は、そういう配置が必要だ。\nクマノテを借りる位置に来ている。",
    "「{k}」は、まだ走っていない。\nでも、立ち止まっているわけでもない。\nその中間が、今年の居場所だ。\nクマノテを借りて、手綱を探そう。",
    "「{k}」について考えている今も、\n本当に考えているのかは怪しい。\n2026年は、そういう曖昧さが多い。\nだからクマノテを借りる、という判断になる。",
    "「{k}」は、触ると形が変わる。\n安定する前に、少し手が必要だ。\n今年は、その加減が難しい。\nクマノテを借りて支えるのが良さそうだ。",
    "「{k}」について、今日はここまで考えた。\n続きは、また別のタイミングでいい。\n急ぐ理由はない。\nクマノテを借りる、という余白を残して。",
    "「{k}」を抱えたまま、新しい年に入った。\nそれ自体は悪くない。\n走らせ方は、これから決めればいい。\nまずはクマノテを借りよう。",
    "「{k}」について考えていると、\n近づきすぎない方がいい気がした。\n触れたら、少し面倒なことになりそうだ。\nこういうときは、クマノテを借りるのが無難だ。",
    "「{k}」は、静かなのに存在感がある。\n何もしていないのに、こちらの集中を奪う。\n2026年は、そういうものに弱い。\nクマノテを借りて距離を保とうと思った。",
    "「{k}」を考えていると、少し暑くなる。\n理由はわからない。\nたぶん、考えすぎだ。\n一度クマノテを借りて、頭を冷やした方がいい。",
    "「{k}」は、放っておくと勝手に動く。\n目を離すと、変な方向に行きがちだ。\n今年はそれを止めたい。\nクマノテを借りて見ておくことにした。",
    "「{k}」は、少し落ち着きがない。\nじっとしていればいいのに、と思う。\nでも嫌いじゃない。\nクマノテを借りて付き合ってみよう。",
    "「{k}」は、近づくと大人しくなる。\n離れると、また気になり始める。\nちょうどいい距離が難しい。\nクマノテを借りて調整するのが良さそうだ。",
    "「{k}」は、新年早々元気すぎる。\nまだ正月なのに、もう走りたがっている。\n今年は長くなりそうだ。\nクマノテを借りて、最初から一緒に走ろう。",
    "「{k}」について考えていると、\n見られている気がする。\n気のせいだとわかっているけど。\n念のため、クマノテを借りておこう。",
    "「{k}」は、意外と不安定だ。\nちゃんとしているように見えて、たまに揺れる。\n今年は支えが必要だ。\nクマノテを借りる理由には十分だと思う。",
    "「{k}」を考え終わったあと、\nしばらく何もしたくなくなった。\nこういう間は、嫌いじゃない。\nでも次に進むなら、クマノテを借りよう。",
    "「{k}」という言葉の響きに、\nなぜか少しエロティズムを感じた。\n意味とは関係ないところで。\n一人で扱うには微妙なので、クマノテを借りようと思った。",
    "「{k}」を声に出さずに、頭の中で転がしてみる。\n音だけが残って、意味が後からついてくる。\n2026年は、そういう順番が多い。\nクマノテを借りて整理するのが良さそうだ。",
    "「{k}」に、理由のわからない色気がある。\nそう感じる時点で、たぶん普通じゃない。\n今年は、それを無視しないことにした。\nクマノテを借りる、という判断になる。",
    "「{k}」という言葉とは、\n近づきすぎない方がいい気がした。\n響きが、少し強すぎる。\nクマノテを借りて距離を取ろうと思った。",
    "「{k}」を考え終わったあと、\n言葉の余韻だけが残った。\nそれが何なのかは、説明できない。\nだからクマノテを借りることにした。",
    "「{k}」という言葉に、\nどこか可愛さを感じてしまった。\n意味より先に、そう思った。\n放っておかず、クマノテを借りることにした。",
    "「{k}」は、ちょっと可愛すぎる気がする。\n真面目に扱おうとすると、少し照れる。\n今年は、そういう感覚が多い。\nクマノテを借りて向き合うのが良さそうだ。",
    "「{k}」という言葉を、\n頭の中で転がしているうちに、\nだんだん愛着が湧いてきた。\nクマノテを借りて育てるのも悪くない。",
    "「{k}」は、少し頼りない響きをしている。\nちゃんとしていないところが気になる。\n今年は、それを無視しない。\nクマノテを借りて見ておくことにした。",
    "「{k}」という言葉に、\n新年らしい可愛さを感じた。\nたぶん、始まったばかりだからだ。\nクマノテを借りて、今年を進めようと思う。",
    "「{k}」について、ここまで考えたら十分だ。\nこれ以上一人で抱えても、状況は変わらない。\n2026年は、判断を引き延ばさない年にしたい。\nこれはもう、クマノテを借りた方がいい。とりあえず連絡しよう。",
    "「{k}」について考えていると、\nなんとなく先の展開が明るい気がしてきた。\n根拠はないけど、悪くはならなさそうだ。\nクマノテに連絡したら、何か良いことが起きるかもしれない。",
    "「{k}」という言葉は、\n地図に載っていない場所みたいだ。\n行き方はわからないけど、入口は近そうだ。\n案内役として、クマノテを借りるのが良さそうだ。",
    "「{k}」を考えていると、\n少しだけ重力が弱くなる。\n2026年は、軌道を変えるには悪くない年だ。\nこの航行には、クマノテを借りた方が安心だと思った。",
    "「{k}」は、気合いだけではどうにもならない。\n準備と段取りが、結果を左右する。\n今年は、そこをちゃんとやりたい。\nクマノテを借りて、体制を整えよう。",
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
        ctx.fillStyle = isBright ? "#fff" : "#52525b";
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
