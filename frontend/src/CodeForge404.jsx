import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Noise = () => (
  <div
    className="absolute inset-0 pointer-events-none z-[1] opacity-[0.035]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundSize: "128px",
    }}
  />
);

const Scanline = () => (
  <div className="absolute left-0 right-0 h-0.5 pointer-events-none z-10 bg-[linear-gradient(90deg,transparent,rgba(192,74,26,0.18),transparent)] [animation:scan_4s_linear_infinite]" />
);

const Logo = () => (
  <div className="flex items-center gap-2 mb-8">
    <div className="w-[30px] h-[30px] flex items-center justify-center bg-[#C04A1A] shadow-[2px_2px_0_#8C3310]">
      <span className="font-['Spectral',serif] font-bold italic text-[#FAF7F0] text-[0.9rem]">C</span>
    </div>
    <span className="font-['DM_Mono',monospace] text-[10px] uppercase tracking-[0.12em] text-[#7A6E5A]">
      CodeForge
    </span>
  </div>
);

const LeftPanel = () => (
  <div className="hidden md:flex w-80 flex-shrink-0 flex-col justify-between p-9 relative overflow-hidden z-[2] bg-[#FAF7F0] border-r border-[#E0D8CA]">
    <div className="absolute top-0 left-[18px] w-px h-full bg-[linear-gradient(to_bottom,transparent,#E0D8CA_20%,#E0D8CA_80%,transparent)]" />
    <div className="absolute pointer-events-none -top-20 -right-16 w-[200px] h-[200px] bg-[radial-gradient(ellipse_at_top_right,rgba(192,74,26,0.09),transparent_70%)]" />
    <div className="absolute pointer-events-none bottom-0 left-0 w-[200px] h-[200px] bg-[radial-gradient(ellipse_at_bottom_left,rgba(192,74,26,0.07),transparent_70%)]" />

    <div>
      <Logo />

      <div className="font-['DM_Mono',monospace] text-[9px] uppercase tracking-[0.18em] flex items-center gap-2 mb-3.5 text-[#C04A1A]">
        <span className="block w-4 h-px bg-[#C04A1A]" />
        Error encountered
      </div>

      <h1 className="font-['Spectral',serif] font-light leading-[0.92] mb-4 text-[2.6rem] text-[#1A1208]">
        Lost in
        <br />
        <em className="font-bold not-italic text-[#C04A1A]">the</em>
        <br />
        void.
      </h1>

      <p className="font-['Spectral',serif] text-[0.85rem] italic leading-[1.7] mb-7 max-w-[200px] text-[#7A6E5A]">
        This path doesn't resolve to anything on our servers. It may have moved, expired, or never existed.
      </p>

      <div className="flex flex-col gap-2.5 pt-4 border-t border-[#E0D8CA]">
        {["Route not matched in manifest", "No redirect rule found", "Request terminated at edge"].map((text, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="font-['DM_Mono',monospace] text-[9px] tracking-[0.06em] mt-0.5 flex-shrink-0 text-[#C04A1A]">0{i + 1}</span>
            <span className="font-['DM_Mono',monospace] text-[10px] leading-[1.5] text-[#7A6E5A]">{text}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-4 border-t border-[#E0D8CA]">
      {[["HTTP Status", "404 Not Found"], ["Protocol", "HTTPS / H2"], ["Runtime", "v2.4.0"], ["Edge Node", "IN-MUM-01"]].map(([k, v]) => (
        <div key={k}>
          <div className="font-['DM_Mono',monospace] text-[8px] uppercase tracking-[0.14em] mb-0.5 text-[#C4B8A4]">{k}</div>
          <div className="font-['DM_Mono',monospace] text-[10px] text-[#7A6E5A]">{v}</div>
        </div>
      ))}
    </div>
  </div>
);

const RightPanel = ({ onHome }) => {
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setCursor((c) => !c), 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center px-7 z-[2]">
      <div className="w-full max-w-[300px]">
        <div className="font-['DM_Mono',monospace] text-[9px] uppercase tracking-[0.14em] inline-flex items-center gap-1.5 mb-5 text-[#C04A1A]">
          <span className="block w-4 h-px bg-[#C04A1A]" />
          404 Error
        </div>

        <div className="flex items-center gap-1 flex-wrap mb-4">
          {["codeforge.dev", "/", "workspace", "/"].map((seg, i) => (
            <span key={i} className={`font-['DM_Mono',monospace] text-[9px] tracking-[0.04em] ${i % 2 === 1 ? "text-[#D0C8BC]" : "text-[#A0917E]"}`}>{seg}</span>
          ))}
          <span className="font-['DM_Mono',monospace] text-[9px] tracking-[0.04em] text-[#C04A1A]">unknown-route</span>
        </div>

        <div className="font-['Spectral',serif] font-bold italic inline-flex items-end mb-1 text-[6.5rem] leading-none text-[#1A1208]">
          4<span className="text-[#C04A1A]">0</span>4
          <span
            className="inline-block ml-1 w-[3px] h-[4.5rem] bg-[#C04A1A] mb-[0.3rem] transition-none"
            style={{ opacity: cursor ? 1 : 0 }}
          />
        </div>

        <div className="relative overflow-hidden mb-5 w-full h-[2px] bg-[#C04A1A] shadow-[3px_3px_0_#8C3310]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] bg-[length:200%_100%] [animation:shine-line_2.8s_linear_infinite]" />
        </div>

        <h2 className="font-['Spectral',serif] font-light leading-[1.1] mb-2 text-[1.5rem] text-[#1A1208]">
          Page <strong className="font-bold italic">not found.</strong>
        </h2>

        <p className="font-['DM_Mono',monospace] text-[10px] tracking-[0.02em] leading-[1.7] mb-6 max-w-[240px] text-[#A0917E]">
          The route you're looking for doesn't exist in this session. Check the URL or return to safety.
        </p>

        <div className="p-3 mb-6 bg-[#F0EAE0] border border-[#E0D8CA] border-l-[3px] border-l-[#C04A1A]">
          {[["Code", "ERR_ROUTE_NOT_FOUND", true], ["Path", "/workspace/unknown-route", false], ["Method", "GET", false]].map(([k, v, accent]) => (
            <div key={k} className="flex gap-3 items-start mb-1 last:mb-0">
              <span className="font-['DM_Mono',monospace] text-[9px] uppercase tracking-[0.1em] pt-px min-w-[52px] text-[#A0917E]">{k}</span>
              <span className={`font-['DM_Mono',monospace] text-[10px] break-all ${accent ? "text-[#C04A1A]" : "text-[#4A3E30]"}`}>{v}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onHome}
          className="relative overflow-hidden w-full h-[42px] flex items-center justify-center gap-2.5 text-white font-['DM_Mono',monospace] text-[11px] uppercase tracking-[0.08em] cursor-pointer transition-all duration-100 bg-[linear-gradient(135deg,#E8501E,#C04A1A_60%,#A53D12)] border border-[#C04A1A] shadow-[3px_3px_0_#8C3310] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_#8C3310] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.12)_50%,transparent_60%)] bg-[length:200%_100%] [animation:shine_3.5s_linear_infinite]"
          />
          ← Go back home
        </button>

        <div className="flex items-center gap-1.5 mt-5 pt-4 border-t border-[#E0D8CA]">
          <span className="w-[5px] h-[5px] rounded-full flex-shrink-0 bg-[#DC2626] [animation:pulse-dot_2s_ease-out_infinite]" />
          <span className="font-['DM_Mono',monospace] text-[9px] uppercase tracking-[0.07em] text-[#A0917E]">
            System operational — routing error only
          </span>
        </div>
      </div>
    </div>
  );
};

export default function CodeForge404() {
  const navigate = useNavigate();
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap');
        @keyframes shine      { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes shine-line { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes scan       { from{top:0} to{top:100%} }
        @keyframes pulse-dot  { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:.2;transform:scale(2.2)} }
      `}</style>
      <div className="min-h-screen bg-[#F8F4ED] flex items-start md:items-center justify-center p-4 md:p-8">
        <div className="flex flex-col md:flex-row relative overflow-hidden w-full max-w-4xl md:min-h-[600px] border border-[#E0D8CA] shadow-[6px_6px_0_#E0D8CA]">
          <Noise />
          <Scanline />
          <LeftPanel />
          <RightPanel onHome={() => navigate("/")} />
        </div>
      </div>
    </>
  );
}