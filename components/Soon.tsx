/** Pantalla de una sección que llega en una fase posterior. */
export function Soon({ eyebrow, title, phase, intro, items }: { eyebrow: string; title: string; phase: number; intro: string; items: string[] }) {
  return (
    <>
      <div className="page-head"><div><span className="tag">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div></div>
      <div className="panel panel-pad soon">
        <span className="chip" style={{ ["--c" as string]: "var(--accent-text)", justifySelf: "start" }}>Llega en la fase {phase}</span>
        <p>Esto es lo que vas a poder hacer aquí:</p>
        <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
      </div>
    </>
  );
}
