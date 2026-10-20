import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
type Layout = 'auto' | 'mobile' | 'desktop';
const LayoutContext = createContext({ compact: false, layout: 'auto' as Layout, setLayout: (_value: Layout) => {} });
export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<Layout>(() => {
    const query = new URLSearchParams(location.search).get('view');
    let saved = 'auto'; try { saved = localStorage.getItem('nobet-layout-v1') || 'auto'; } catch {}
    const value = query || saved; return value === 'mobile' || value === 'desktop' ? value : 'auto';
  });
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width: 800px)').matches);
  const phone = /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent);
  const compact = layout === 'mobile' || (layout === 'auto' && (narrow || phone));
  useEffect(() => { const media = matchMedia('(max-width: 800px)'); const update = () => setNarrow(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => { document.documentElement.dataset.layout = compact ? 'mobile' : 'desktop'; document.documentElement.dataset.layoutPreference = layout; try { localStorage.setItem('nobet-layout-v1', layout); } catch {} }, [compact, layout]);
  return <LayoutContext.Provider value={{ compact, layout, setLayout }}>{children}</LayoutContext.Provider>;
}
export function LayoutControls() {
  const { layout, setLayout } = useContext(LayoutContext);
  return <label className="layout-control">Görünüm<select aria-label="Görünüm" value={layout} onChange={event => { setLayout(event.target.value as Layout); const address = new URL(location.href); address.searchParams.delete('view'); history.replaceState(null, '', address); }}><option value="auto">Otomatik</option><option value="mobile">Mobil</option><option value="desktop">Bilgisayar</option></select></label>;
}
export function CompactDetails({ title, children, className = '', defaultExpanded = false }: { title: string; children: ReactNode; className?: string; defaultExpanded?: boolean }) {
  const { compact } = useContext(LayoutContext); const [expanded, setExpanded] = useState(defaultExpanded);
  return <details className={'compact-details ' + className} open={!compact || expanded}><summary onClick={event => { event.preventDefault(); setExpanded(value => !value); }}>{title}<span aria-hidden="true">{expanded ? '−' : '+'}</span></summary><div className="compact-details-body">{(!compact || expanded) && children}</div></details>;
}
